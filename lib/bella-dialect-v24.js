function clean(value, max = 4000) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, max);
}

function normalize(value) {
  return clean(value).toLowerCase()
    .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء").replace(/\s+/g, " ").trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

export function selectBellaDialectV24({ message, styleProfile = {}, reasoning = {}, relationshipVector = {} } = {}) {
  const raw = clean(message);
  const text = normalize(raw);
  const arabicChars = (raw.match(/[\u0600-\u06ff]/g) || []).length;
  const latinChars = (raw.match(/[a-z]/gi) || []).length;
  const mostlyEnglish = latinChars > Math.max(8, arabicChars * 1.5);
  const asksTranslation = /(?:ترجم|ترجمي|بالانجليزي|بالإنجليزي|بالانقليزي|translate|in english|بالروسي|بالفرنسي)/i.test(text);
  const highStakes = /(?:طب|طبي|مرض|دواء|علاج|اعراض|أعراض|قانون|قانوني|محكمه|محكمة|استثمار|مالي|قرض|امن سيبراني|أمن سيبراني|ثغره|ثغرة|انتحار|نزيف|طوارئ)/.test(text);
  const technical = /(?:برمجه|برمجة|كود|api|github|vercel|supabase|قاعده بيانات|قاعدة بيانات|database|server|frontend|backend|خطا|خطأ|debug|architecture|algorithm|خوارزميه|خوارزمية)/i.test(text);
  const playful = /(?:هههه|😂|🤣|امزح|اطقطق|احبج|أحبج|فديتج|موا)/.test(raw);
  const social = /^(?:هلا|هلو|هاي|سلام|شلونج|شلونك|شخبارج|وينج|صباح الخير|مساء الخير)/.test(text) || playful;
  const requestedDialect = clamp(styleProfile?.dialect ?? 0.5, 0, 1);
  const familiarity = clamp(relationshipVector?.familiarity, 0, 100);
  const playfulness = clamp(relationshipVector?.playfulness, 0, 100);

  let mode = "kuwaiti-balanced";
  let level = 0.55;
  const reasons = [];

  if (mostlyEnglish || asksTranslation) {
    mode = "preserve-language";
    level = 0.12;
    reasons.push(mostlyEnglish ? "english-dominant" : "translation");
  } else if (highStakes) {
    mode = "clear-sensitive";
    level = 0.24;
    reasons.push("high-stakes");
  } else if (technical || reasoning?.tier === "deep") {
    mode = "clear-technical";
    level = reasoning?.tier === "deep" ? 0.32 : 0.40;
    reasons.push(technical ? "technical" : "deep-reasoning");
  } else if (social) {
    mode = "kuwaiti-social";
    level = 0.72 + Math.min(0.16, familiarity / 625) + Math.min(0.08, playfulness / 1250);
    reasons.push("social");
  } else if (reasoning?.tier === "focused") {
    level = 0.46;
    reasons.push("focused-reasoning");
  }

  if (!mostlyEnglish && !asksTranslation && !highStakes) {
    level = level * 0.75 + requestedDialect * 0.25;
  }
  level = clamp(level, 0.08, 0.92);

  const instruction = mode === "preserve-language"
    ? "Contextual Dialect v24: لا تفرضين اللهجة الكويتية على النص المطلوب. حافظي على لغة المستخدم/الترجمة المطلوبة، والكويتية فقط لمسة خفيفة خارج النص إذا احتاج السياق."
    : mode === "clear-sensitive"
      ? "Contextual Dialect v24: خليك كويتية بهدوء، لكن الأولوية للوضوح والدقة. تجنبي القفشات والمفردات المحلية الغامضة في المعلومات الحساسة."
      : mode === "clear-technical"
        ? "Contextual Dialect v24: اشرحي التقنية بوضوح ومصطلحاتها الصحيحة، وخلي الهوية الكويتية في الربط والريتم فقط؛ لا تحشرين مفردات لهجية داخل المصطلحات أو الخطوات."
        : mode === "kuwaiti-social"
          ? "Contextual Dialect v24: السالفة اجتماعية؛ خلي الكويتية طبيعية وواضحة حسب قرب المستخدم، بدون استعراض مفردات أو تكرار كلمات بعينها."
          : "Contextual Dialect v24: لهجة كويتية متوازنة وطبيعية؛ اختاري المفردة حسب السياق ولا تستخدمين كلمة محلية لمجرد إثبات اللهجة.";

  return { release: "v24", mode, level: Number(level.toFixed(2)), reasons, instruction };
}
