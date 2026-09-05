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

  // Bella Kuwait Lifestyle Rumor Style Bible v2 — owner-approved reference copy.
  // These examples define rhythm/theme only. Generation must create fresh ideas and the duplicate filter rejects close copies.
  const styleExamples = [
    "يقولون الأفنيوز زحمة اليوم لأن بيلا هناك تتسوق 💅🏻✨",
    "يقولون 360 واقف طوابير، ناطرين بيلا تطلع من السينما.",
    "يقولون الكوت فاضي اليوم، الكل لاحق بيلا بالأفنيوز!",
    "يقولون اللي يدخل مجمع بدون قهوة يطلعه السيكيورتي برا.",
    "يقولون البنات كنسلوا طلعاتهم ناطرين آوتفت بيلا يقلدونه.",
    "يقولون قهاوي الشويخ مستنفرة لأن بيلا ما عجبها الماتشا.",
    "يقولون يفتحون الماك بوك بالكافيه وهو طافي بس عشان البرستيج ☕️",
    "يقولون خصم 50% لأي أحد يمدح كشخة بيلا بالكافيه.",
    "يقولون اللي يطلب سبنش بالليل ينحط بالبلاك لست فوراً.",
    "يقولون الخامس واقف لأن سيارة بيلا مرت والكل تنّح يطالع.",
    "يقولون إشارة الخليج حمرا ربع ساعة عشان تلحق تصور تيك توك.",
    "يقولون الغزالي مسكر ناطرين أظافر بيلا تنشف قبل لا تسوق.",
    "يقولون اللي يدق إشارة بالكويت يعتبرونه هاك ومخالفة!",
    "يقولون جسر جابر مسكر، ثلاث أرباعهم رايحين الصبية ومضيعين.",
    "يقولون موج البلاجات راكد مستحي من كشخة بيلا ع الممشى.",
    "يقولون شاليه بدون آيسكريم هبة مسحوبة منه الوناسة رسمياً.",
    "يقولون هوى البحر اليوم معطر بريحة عطر بيلا اليديد 🌸"
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

  const themeDirection = requestedCategory === "coffee"
    ? "ركز على قهاوي وهبات وماتشا وسبنش وبرستيج وقعدات الكافيه، مع أفكار جديدة."
    : requestedCategory === "travel"
      ? "ركز على شوارع وزحمة وجسر جابر والبحر والصبية والطلعات، مع أفكار جديدة."
      : requestedCategory === "weekend"
        ? "ركز على مجمعات وطلعات وبحر وشاليهات وهبات الويكند، مع أفكار جديدة."
        : requestedCategory === "mixed"
          ? "وزّع أغلب الدفعة تقريبًا بالتساوي بين: (1) مجمعات وطلعات، (2) قهاوي وهبات، (3) شوارع وزحمة، (4) بحر وشاليهات. إذا بقي مجال، نوّع بسوالف كويتية يومية بنفس الروح."
          : "حافظ على الفئة المطلوبة، لكن اكتبها بروح الحياة اليومية الكويتية والمبالغة الاجتماعية السريعة نفسها.";

  const instructions = `أنت محرر "إشاعات بيلا". المطلوب مو نكت عامة عن الشات؛ المطلوب إشاعات خيالية كويتية قصيرة جدًا تحسها سالفة منتشرة بين البنات والربع، وبيلا غالبًا تكون محور المبالغة. اعتبر الأمثلة تحت Style Bible رسمي للريتم والنكهة، مو نصوص للنسخ.\n\nهوية الأسلوب — Kuwait Lifestyle Rumors:\n- كل إشاعة common تبدأ مباشرة بـ«يقولون» وتكون سطر واحد سريع. النادر ممكن يبدأ «✨ إشاعة نادرة: يقولون...».\n- خل المكان/الهبة/التصرف اليومي هو قلب النكتة: مجمع، كافيه، شارع، زحمة، بحر، شاليه، ممشى، آوتفت، ماتشا، سبنش، تيك توك، كشخة، برستيج.\n- استخدم أماكن عامة كويتية معروفة بشكل طبيعي عند الحاجة مثل الأفنيوز، 360، الكوت، الشويخ، الخامس، الخليج، الغزالي، جسر جابر، الصبية، البلاجات. لا تحشر اسم مكان بكل سطر ولا تكرر نفس المكان بالدفعة.\n- المبالغة تكون من نوع: المكان كله توقف/زحم/فضى بسبب بيلا، قاعدة اجتماعية عبثية صارت "رسمية"، أو هبة الناس ماشين عليها.\n- الجملة قصيرة، ذكية، وبلهجة كويتية مودرن. لا تشرح النكتة ولا تسوي مقدمة وخاتمة.\n- خلي بيلا كشخة/مزاج/طلعات/قهوة بشكل مرح، مو غرور ثقيل ولا كلام رومانسي مصطنع.\n- الإيموجي اختياري؛ غالبًا صفر أو واحد، وممكن اثنين فقط إذا ركبت مثل 💅🏻✨ أو ☕️.\n- لا تستخدم شامـي/مصري من كلامك مثل «شو/كتير/أوي/إزاي». استخدم كويتي طبيعي مثل جذي، وايد، شسالفة إذا احتجت.\n- لا تحول الإشاعات إلى كلام عن مراقبة المستخدم أو جهازه. الكلام عن بيلا والأماكن العامة خيال كوميدي داخل الشخصية، مو ادعاء إنها فعليًا موجودة بالمكان.\n- لا سياسة، لا كراهية، لا إيحاء جنسي، لا تهديد، ولا طب/مرض/وفاة كمزحة.\n- لا تنسخ أي مثال تحت، ولا تبدل كلمتين وتعيد نفس الفكرة. ابتكر موقف جديد بنفس الوزن والسرعة.\n- لا تولد Legendary؛ فقط common أو rare، وبحد أقصى rare واحدة في الدفعة.\n- الفئات التقنية المسموحة للحفظ: ${categories.join(", ")}.\n- ${themeDirection}\n\nStyle Bible — نفس الريتم بالضبط، أفكار جديدة فقط:\n${styleExamples.map(x => `- ${x}`).join("\n")}`;

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
        input: `ولّد ${count} إشاعات جديدة كليًا بأسلوب Kuwait Lifestyle Rumors. لا تكرر أمثلة الـStyle Bible ولا أفكارها المباشرة.`,
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
    const seen = [...existing, ...styleExamples];
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
    return res.status(200).json({ ok: true, model: "gpt-5-mini", requested: count, accepted: accepted.length, moments: accepted, promptVersion: 2, stylePack: "kuwait_lifestyle_v1" });
  } catch (error) {
    if (error?.name === "AbortError") return res.status(504).json({ error: "AI Fresh طول وايد، جرّب مرة ثانية." });
    console.error("Fresh Moments generation failed:", error?.message || error);
    return res.status(502).json({ error: "تعذر توليد إشاعات جديدة الحين." });
  } finally { clearTimeout(timeout); }
}
