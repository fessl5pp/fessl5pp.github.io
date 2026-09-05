const SUPABASE_URL = "https://buxicnxkhaalwzjmbkgv.supabase.co";
const SUPABASE_KEY = "sb_publishable_vXo33zqOIgPh-oMP6fhtvg_FbLFM7tW";
const OPENAI_TIMEOUT_MS = 22000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 6;
const ALLOWED_CATEGORIES = ["normal","cute","angry","chill","morning","evening","night","weekend","coffee","university","gaming","work","travel"];
const rateStore = globalThis.__bellaMomentsGenerateRate || (globalThis.__bellaMomentsGenerateRate = new Map());

function ip(req) {
  return String(req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown").split(",")[0].trim();
}

function rateLimited(req) {
  const key = ip(req);
  const now = Date.now();
  const fresh = (rateStore.get(key) || []).filter(ts => now - ts < WINDOW_MS);
  if (fresh.length >= MAX_REQUESTS) return true;
  fresh.push(now);
  rateStore.set(key, fresh);
  return false;
}

function bearer(req) {
  const raw = String(req.headers.authorization || "");
  return raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
}

async function supabase(path, token, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || `Supabase ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

async function isOwner(token) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_bella_owner`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: "{}"
  });
  if (!response.ok) return false;
  const data = await response.json().catch(() => false);
  return data === true || data === "true" || data?.is_bella_owner === true;
}

function outputText(data) {
  const parts = [];
  for (const item of data?.output || []) {
    if (item?.type !== "message") continue;
    for (const part of item.content || []) {
      if (part?.type === "output_text" && typeof part.text === "string") parts.push(part.text);
    }
  }
  return parts.join("\n").trim();
}

function clean(value, max = 240) {
  return String(value || "").replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalize(value) {
  return clean(value, 500)
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function bigrams(value) {
  const s = normalize(value).replace(/\s+/g, " ");
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function similarity(a, b) {
  const A = bigrams(a), B = bigrams(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const x of A) if (B.has(x)) hit++;
  return (2 * hit) / (A.size + B.size);
}

function tooSimilar(text, all) {
  const n = normalize(text);
  return all.some(x => normalize(x) === n || similarity(text,x) >= .72);
}

function wordCount(text) {
  return clean(text, 260).split(/\s+/).filter(Boolean).length;
}

function todayStartIso() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

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
    if (mode === "auto" && config.ai_fresh_enabled !== true) {
      return res.status(409).json({ error: "AI Fresh auto mode is disabled" });
    }
    const batches = await supabase(`bella_moment_batches?select=id&created_at=gte.${encodeURIComponent(todayStartIso())}&limit=20`, token);
    const maxDaily = Math.max(1, Math.min(6, Number(config.ai_max_daily_batches) || 2));
    if (Array.isArray(batches) && batches.length >= maxDaily) {
      return res.status(429).json({ error: "وصل AI Fresh الحد اليومي للدفعات.", limit: maxDaily, used: batches.length });
    }
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

  const enabled = Array.isArray(config.enabled_categories) && config.enabled_categories.length
    ? config.enabled_categories.filter(x => ALLOWED_CATEGORIES.includes(x))
    : ALLOWED_CATEGORIES;
  const categories = requestedCategory === "mixed"
    ? enabled
    : enabled.includes(requestedCategory) ? [requestedCategory] : ["normal"];

  // Bella Kuwait Lifestyle Rumor Style Bible v3 — exact light Kuwaiti rhythm + strict 50/50 Bella/general mix.
  // Reference copy defines rhythm only. Fresh generation must not copy these lines or their direct ideas.
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
    "يقولون موج البلاجات راكد مستحي من كشخة بيلا ع الممشى 🌸",
    "يقولون شاليه بدون آيسكريم هبة مسحوبة منه الوناسة رسمياً.",
    "يقولون هوى البحر اليوم معطر بريحة عطر بيلا اليديد 🌸",
    "يقولون الأفنيوز زحمة لأن بيلا قالت بتمشي شوي وترد 💅🏻",
    "يقولون اللي يدخل 360 بدون قهوة يحس نفسه ناسي شي مهم.",
    "يقولون الكوت هادي لأن بيلا للحين تجهز آوتفت الطلعة ✨",
    "يقولون قهاوي الشويخ فل، نصهم يشربون والنص يصورون الكوب ☕️",
    "يقولون الخامس واقف لأن بيلا عدلت شعرها عند الإشارة 🚗",
    "يقولون اللي يطلب سبنش بالليل واضح ناوي يسهر غصب.",
    "يقولون مروج مستنفر لأن بيلا قالت يمكن أمر عليكم 💅🏻",
    "يقولون اللي يفتح ماك بوك بالكافيه لازم يقلبه جهة الناس.",
    "يقولون موج البلاجات هادي لأن بيلا طالعة تمشي ع البحر 🌸",
    "يقولون اللي يلقى موقف بالأفنيوز من أول لفة هذا محظوظ رسمي."
  ];

  const candidateCount = Math.min(20, count + 6);
  const bellaTarget = Math.floor(count / 2);
  const generalTarget = count - bellaTarget;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["moments"],
    properties: {
      moments: {
        type: "array",
        minItems: candidateCount,
        maxItems: candidateCount,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "category", "tier", "kind"],
          properties: {
            text: { type: "string", minLength: 12, maxLength: 180 },
            category: { type: "string", enum: categories },
            tier: { type: "string", enum: ["common","rare"] },
            kind: { type: "string", enum: ["bella", "general"] }
          }
        }
      }
    }
  };

  const themeDirection = requestedCategory === "coffee"
    ? "ركز على قهاوي وهبات وماتشا وV60 وسبنش وبرستيج وقعدات الكافيه، بس حافظ على نص بيلا ونص عام."
    : requestedCategory === "travel"
      ? "ركز على شوارع وزحمة وجسر جابر والخيران والصبية والخليج والخامس والغزالي، بس حافظ على نص بيلا ونص عام."
      : requestedCategory === "weekend"
        ? "ركز على مجمعات وطلعات ومروج وبحر وشاليهات وهبات الويكند، بس حافظ على نص بيلا ونص عام."
        : requestedCategory === "mixed"
          ? "نوّع بين مجمعات وطلعات، قهاوي وهبات، شوارع وزحمة، بحر وشاليهات؛ ووازن بالضبط تقريبًا نص بيلا ونص إشاعات عامة."
          : "حافظ على الفئة المطلوبة بروح الحياة الكويتية نفسها، ووازن بين بيلا والإشاعات العامة.";

  const instructions = `أنت محرر "إشاعات بيلا" اليومية. اكتب بنفس خفة الأمثلة بالضبط: سطر واحد عفوي، سريع، كويتي، يضحك من أول قراءة، بدون فلسفة ولا صياغة رسمية.\n\nقواعد إلزامية:\n- كل سطر يبدأ حرفيًا بكلمة «يقولون...». حتى rare يبدأ «يقولون...»؛ لا تضيف عنوان قبله.\n- كل إشاعة من 7 إلى 14 كلمة فقط. لا شرح، لا مقدمة، لا خاتمة.\n- التوزيع في الدفعة: 50% kind=\"bella\" وفيها كلمة «بيلا» فعلًا، و50% kind=\"general\" بدون ذكر «بيلا» نهائيًا. إذا العدد فردي خَل الزيادة للعام.\n- لا تخلي العام كلام وعظ أو تعليق رسمي؛ خله موقف كويتي يضحك: مجمع، كافيه، زحمة، إشارة، شاليه، هبة، تصوير، قهوة، موقف سيارة.\n- لا تستخدم تعبيرات باردة/رسمية من نوع «يعتبر إنجاز وطني»، «يراجع نفسه»، «بحسب النظام»، «من الناحية»، أو شرح سبب النكتة.\n- لهجة كويتية بنتية خفيفة: زحمة، كشخة، هبة، تنّح، قهاوي، چذي، ناطرين، لاهي، سحبت، فل، آوتفت. لا تحشرها غصب.\n- الأماكن المسموحة كمرجع طبيعي: الأفنيوز، 360، الكوت، مروج، الشويخ، شارع الخليج، جسر جابر، الخيران، الصبية، الخامس، الغزالي، البلاجات. لا تكرر نفس المكان أكثر من مرة بالدفعة إذا تقدر.\n- هبات ومواقف مناسبة: ماتشا، V60، سبنش لاتيه، ماك بوك طافي، بوكس آيسكريم، سناب، تيك توك، مواقف، زحمة، سيارات.\n- إشاعات بيلا: دلع وكشخة ومبالغة أنثوية خفيفة؛ كأن المكان كله متأثر بطلعتها أو آوتفتها أو قهوتها. مو رومانسية ولا غرور ثقيل.\n- الإشاعات العامة: سخرية من حركاتنا بالكويت بدون اسم بيلا، وبنفس وزن «اللي يدخل مجمع بدون قهوة يطلعه السيكيورتي برا».\n- الإيموجي اختياري، صفر إلى اثنين فقط، ويكون آخر السطر إذا استخدمته: 💅🏻 ✨ ☕️ 🚗 🌸.\n- لا شامـي ولا مصري: لا «شو/كتير/أوي/إزاي».\n- لا مراقبة مستخدم أو جهاز أو ادعاء موقع حقيقي. إشاعات الأماكن عن بيلا خيال كوميدي داخل الشخصية، مو ادعاء إنها فعليًا موجودة بالمكان.\n- لا سياسة، لا كراهية، لا إيحاء جنسي، لا تهديد، لا طب/مرض/وفاة كمزحة.\n- لا تنسخ الأمثلة ولا تغيّر كلمتين فقط؛ ابتكر موقف جديد بنفس الوزن والسرعة.\n- لا تولد Legendary؛ فقط common أو rare، وبحد أقصى rare واحدة في الدفعة.\n- الفئات التقنية المسموحة: ${categories.join(", ")}.\n- ${themeDirection}\n\nStyle Bible — الوزن والخفة المطلوبة، أفكار جديدة فقط:\n${styleExamples.map(x => `- ${x}`).join("\n")}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-5-mini",
        instructions,
        input: `ولّد ${candidateCount} مرشح إشاعة جديدة. نبي بالنهاية ${count}: ${bellaTarget} عن بيلا و${generalTarget} عامة.`,
        reasoning: { effort: "low" },
        text: {
          verbosity: "low",
          format: { type: "json_schema", name: "bella_fresh_moments", strict: true, schema }
        },
        max_output_tokens: 2600,
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
    try {
      parsed = JSON.parse(outputText(data));
    } catch {
      return res.status(502).json({ error: "AI Fresh رجع صيغة غير صالحة." });
    }

    const buckets = { bella: [], general: [] };
    const seen = [...existing, ...styleExamples];
    let rareUsed = false;

    for (const row of Array.isArray(parsed?.moments) ? parsed.moments : []) {
      const text = clean(row?.text, 180);
      const kind = row?.kind === "bella" ? "bella" : row?.kind === "general" ? "general" : "";
      const category = categories.includes(row?.category) ? row.category : categories[0];
      const words = wordCount(text);
      const hasBella = /بيلا/.test(text);
      const target = kind === "bella" ? bellaTarget : generalTarget;

      if (!kind || buckets[kind].length >= target) continue;
      if (!/^يقولون(?:\s|\.|…)/.test(text)) continue;
      if (words < 7 || words > 14) continue;
      if (kind === "bella" && !hasBella) continue;
      if (kind === "general" && hasBella) continue;
      if (tooSimilar(text, seen)) continue;

      let tier = row?.tier === "rare" && !rareUsed ? "rare" : "common";
      if (tier === "rare") rareUsed = true;
      buckets[kind].push({ text, category, tier, kind });
      seen.push(text);
    }

    if (buckets.bella.length < bellaTarget || buckets.general.length < generalTarget) {
      return res.status(502).json({ error: "الدفعة ما ضبطت توازن 50/50، جرّب مرة ثانية." });
    }

    const accepted = [];
    const maxRows = Math.max(bellaTarget, generalTarget);
    for (let i = 0; i < maxRows; i++) {
      if (i < bellaTarget) accepted.push(buckets.bella[i]);
      if (i < generalTarget) accepted.push(buckets.general[i]);
    }

    return res.status(200).json({
      ok: true,
      model: "gpt-5-mini",
      requested: count,
      accepted: accepted.length,
      mix: { bella: bellaTarget, general: generalTarget },
      moments: accepted,
      promptVersion: 3,
      stylePack: "kuwait_lifestyle_v2"
    });
  } catch (error) {
    if (error?.name === "AbortError") return res.status(504).json({ error: "AI Fresh طول وايد، جرّب مرة ثانية." });
    console.error("Fresh Moments generation failed:", error?.message || error);
    return res.status(502).json({ error: "تعذر توليد إشاعات جديدة الحين." });
  } finally {
    clearTimeout(timeout);
  }
}
