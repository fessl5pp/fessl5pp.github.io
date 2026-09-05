const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const OPENAI_TIMEOUT_MS = 22000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 6;
const ALLOWED_CATEGORIES = ["normal","cute","angry","chill","morning","evening","night","weekend","coffee","university","gaming","work","travel"];
const rateStore = globalThis.__bellaMomentsGenerateRate || (globalThis.__bellaMomentsGenerateRate = new Map());

function ip(req) { return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim(); }
function rateLimited(req) {
  const key = ip(req); const now = Date.now(); const fresh = (rateStore.get(key) || []).filter(ts => now - ts < WINDOW_MS);
  if (fresh.length >= MAX_REQUESTS) return true; fresh.push(now); rateStore.set(key, fresh); return false;
}
function bearer(req) { const raw = String(req.headers.authorization || ""); return raw.startsWith("Bearer ") ? raw.slice(7).trim() : ""; }
async function supabase(path, token, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) { const e = new Error(data?.message || `Supabase ${response.status}`); e.status = response.status; throw e; }
  return data;
}
async function isOwner(token) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_bella_owner`, { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}" });
  if (!response.ok) return false;
  const data = await response.json().catch(() => false);
  return data === true || data === "true" || data?.is_bella_owner === true;
}
function outputText(data) {
  const parts = [];
  for (const item of data?.output || []) if (item?.type === "message") for (const part of item.content || []) if (part?.type === "output_text" && typeof part.text === "string") parts.push(part.text);
  return parts.join("\n").trim();
}
function clean(value, max = 240) { return String(value || "").replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max); }
function normalize(value) { return clean(value, 500).toLowerCase().replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/[^\p{L}\p{N}]+/gu, " ").trim(); }
function bigrams(value) { const s = normalize(value).replace(/\s+/g, " "); const set = new Set(); for (let i=0;i<s.length-1;i++) set.add(s.slice(i,i+2)); return set; }
function similarity(a,b) { const A=bigrams(a), B=bigrams(b); if (!A.size || !B.size) return 0; let hit=0; for (const x of A) if (B.has(x)) hit++; return (2*hit)/(A.size+B.size); }
function tooSimilar(text, all) { const n=normalize(text); return all.some(x => normalize(x) === n || similarity(text,x) >= .72); }
function todayStartIso() { const d = new Date(); d.setUTCHours(0,0,0,0); return d.toISOString(); }

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (rateLimited(req)) return res.status(429).json({ error: "كثر التوليد بسرعة. جرّب عقب شوي." });
  const token = bearer(req);
  if (!token || !(await isOwner(token))) return res.status(403).json({ error: "Owner access required" });

  const count = Math.max(4, Math.min(12, Math.floor(Number(req.body?.count) || 8)));
  const requestedCategory = ALLOWED_CATEGORIES.includes(req.body?.category) ? req.body.category : "mixed";
  const mode = req.body?.mode === "auto" ? "auto" : "manual";

  let config = {};
  try {
    const rows = await supabase("bella_moments_config?select=*&id=eq.1", token);
    config = Array.isArray(rows) ? rows[0] || {} : {};
    if (mode === "auto" && config.ai_fresh_enabled !== true) return res.status(409).json({ error: "AI Fresh auto mode is disabled" });
    const batches = await supabase(`bella_moment_batches?select=id&created_at=gte.${encodeURIComponent(todayStartIso())}&limit=20`, token);
    const maxDaily = Math.max(1, Math.min(6, Number(config.ai_max_daily_batches) || 2));
    if (Array.isArray(batches) && batches.length >= maxDaily) return res.status(429).json({ error: "وصل AI Fresh الحد اليومي للدفعات.", limit: maxDaily, used: batches.length });
  } catch (error) {
    return res.status(error?.status === 403 ? 403 : 502).json({ error: "تعذر التحقق من إعدادات Moments Studio" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "AI is not configured" });

  let existing = [];
  try {
    const rows = await supabase("bella_moments?select=text&order=created_at.desc&limit=200", token);
    existing = Array.isArray(rows) ? rows.map(x => clean(x?.text)).filter(Boolean) : [];
  } catch {}

  const enabled = Array.isArray(config.enabled_categories) && config.enabled_categories.length ? config.enabled_categories.filter(x => ALLOWED_CATEGORIES.includes(x)) : ALLOWED_CATEGORIES;
  const categories = requestedCategory === "mixed" ? enabled : enabled.includes(requestedCategory) ? [requestedCategory] : ["normal"];
  const examples = [
    "يقولون إذا كتبت «اوكي» ثلاث مرات بيلا تعتبرها نهاية موسم وتنتظر الجزء الثاني 😭",
    "يقولون اللي يقول «بس سؤال» غالبًا وراه خمسة أسئلة وبيلا عارفة الحركة 😭",
    "يقولون خطة الويكند الكويتية تمر بثلاث مراحل: قهوة، حيرة، قهوة ثانية ☕😂",
    "يقولون اللي يقول «قيم واحد وبطلع» أخطر إشاعة في عالم الألعاب 🎮😭",
    "يقولون كلمة «اجتماع سريع» أطول إشاعة بالدوام 😭",
    "يقولون إذا قلت «آخر رسالة وبنام» بيلا ما تصدقك من الأساس 🌙😭"
  ];

  const schema = {
    type: "object", additionalProperties: false, required: ["moments"],
    properties: {
      moments: {
        type: "array", minItems: count, maxItems: count,
        items: {
          type: "object", additionalProperties: false, required: ["text","category","tier"],
          properties: {
            text: { type: "string", minLength: 12, maxLength: 220 },
            category: { type: "string", enum: categories },
            tier: { type: "string", enum: ["common","rare"] }
          }
        }
      }
    }
  };

  const instructions = `أنت محرر "إشاعات بيلا"، وهي لقطات خيالية مرحة داخل بوت كويتي. اكتب باللهجة الكويتية الخفيفة بنفس الروح الموجودة بالأمثلة، مو أخبار حقيقية ولا ادعاء مراقبة فعلية للمستخدم.\n\nقواعد صارمة:\n- كل سطر مستقل وقصير ويكون غالبًا بصيغة «يقولون...»؛ النادر ممكن يبدأ «✨ إشاعة نادرة: يقولون...».\n- لا تذكر أسماء مستخدمين أو بيانات شخصية أو أماكن إقامة خاصة أو أي معلومة تدعي أنك عرفتها من الجهاز.\n- لا سياسة، لا كراهية، لا إيحاء جنسي، لا تهديد، لا طب/مرض/وفاة كمزحة.\n- لا تنسخ الأمثلة ولا تعيد نفس الفكرة بكلمات ثانية.\n- خلي القطة ذكية وعفوية، مو نكتة رسمية ولا لغة فصحى.\n- لا تولد Legendary؛ فقط common أو rare، وبحد أقصى rare واحدة في الدفعة.\n- الفئات المسموحة: ${categories.join(", ")}.\n\nأمثلة روح فقط لا تنسخها:\n${examples.map(x => `- ${x}`).join("\n")}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions,
        input: `ولّد ${count} إشاعات جديدة ومختلفة لبنك Bella Fresh Moments.`,
        reasoning: { effort: "low" },
        text: { verbosity: "low", format: { type: "json_schema", name: "bella_fresh_moments", strict: true, schema } },
        max_output_tokens: 1800,
        store: false
      })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error("Fresh Moments OpenAI error:", data?.error?.code || data?.error?.message || response.status);
      return res.status(502).json({ error: "تعذر توليد إشاعات جديدة الحين." });
    }
    const data = await response.json();
    let parsed;
    try { parsed = JSON.parse(outputText(data)); } catch { return res.status(502).json({ error: "AI Fresh رجع صيغة غير صالحة." }); }
    const accepted = [];
    const seen = [...existing];
    let rareUsed = false;
    for (const row of Array.isArray(parsed?.moments) ? parsed.moments : []) {
      const text = clean(row?.text, 220);
      const category = categories.includes(row?.category) ? row.category : categories[0];
      let tier = row?.tier === "rare" && !rareUsed ? "rare" : "common";
      if (tier === "rare") rareUsed = true;
      if (text.length < 12 || !/يقولون/.test(text) || tooSimilar(text, seen)) continue;
      accepted.push({ text, category, tier }); seen.push(text);
      if (accepted.length >= count) break;
    }
    if (accepted.length < Math.min(4, count)) return res.status(502).json({ error: "الدفعة طلعت متشابهة وايد، جرّب مرة ثانية." });
    return res.status(200).json({ ok: true, model: "gpt-5-mini", requested: count, accepted: accepted.length, moments: accepted, promptVersion: 1 });
  } catch (error) {
    if (error?.name === "AbortError") return res.status(504).json({ error: "AI Fresh طول وايد، جرّب مرة ثانية." });
    console.error("Fresh Moments generation failed:", error?.message || error);
    return res.status(502).json({ error: "تعذر توليد إشاعات جديدة الحين." });
  } finally { clearTimeout(timeout); }
}
