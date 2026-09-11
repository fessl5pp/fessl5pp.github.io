function clean(value, max = 5000) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, max);
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ؤئ]/g, "ء")
    .replace(/[؟?!.,،؛:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function hits(text, patterns) {
  let score = 0;
  for (const [pattern, weight] of patterns) if (pattern.test(text)) score += weight;
  return score;
}

export function bellaFreshnessRouteV23(message) {
  const text = normalize(message);
  if (!text) return { tier: "none", score: 0, useLiveWeb: false, searchContextSize: "low", reasons: [] };

  const reasons = [];
  let score = 0;
  const add = (condition, weight, reason) => {
    if (!condition) return;
    score += weight;
    reasons.push(reason);
  };

  const explicitCurrent = /(?:اليوم|الحين|الان|الحالي|حاليا|توه|توها|باجر|هالاسبوع|هذا الاسبوع|اخر|احدث|جديد|مباشر|latest|today|now|current|currently|tonight|this week)/.test(text);
  const volatileFacts = /(?:اخبار|خبر|ترند|طقس|جو|حراره|مباراه|نتيجه|سعر|اسعار|بورصه|سهم|اسهم|ذهب|بيتكوين|عمله|رحله|طيران|فعاليات|عرض|عروض|متوفر|توفر|مخزون|stock|price|weather|score|match|news|flight|event)/.test(text);
  const currentStatus = /(?:فاتح|مفتوح|مسكر|مغلق|شغال|متعطل|متوقف|ازدحام|زحمه|حاله|status|open|closed|outage)/.test(text);
  const asksWho = /(?:منو|من هو|من هي|who is)/.test(text);
  const roleTerm = /(?:الرءيس|رءيس|الامير|الملك|الوزير|المدير التنفيذي|ceo|رءيس الوزراء|رءيس الحكومه)/.test(text);
  const currentRole = roleTerm && (asksWho || explicitCurrent);
  const versionIntent = /(?:احدث|اخر|current|latest)\s+(?:اصدار|نسخه|version)|(?:اصدار|نسخه|version)\s+(?:الحالي|الجديد|latest|current)/.test(text);
  const recommendationNow = /(?:افضل|احسن|رشح|اقترح).*(?:مطعم|كافيه|فندق|منتج|لابتوب|جوال|لعبه|فيلم|مسلسل).*(?:الحين|اليوم|2026|هالسنه|هالسنة)/.test(text);

  add(explicitCurrent && volatileFacts, 5, "current+volatile");
  add(currentStatus && explicitCurrent, 5, "live-status");
  add(currentRole, 5, "current-officeholder");
  add(versionIntent, 4, "current-version");
  add(/(?:كم|شنو|وش)\s+(?:سعر|سعره)|(?:سعر|price)\s+.+/.test(text), 4, "price");
  add(/(?:نتيجه|نتيجة|score)\s+.+|(?:من\s+فاز)/.test(text), 5, "sports-result");
  add(/(?:الطقس|الجو|weather)/.test(text) && explicitCurrent, 5, "weather");
  add(recommendationNow, 3, "time-sensitive-recommendation");
  add(explicitCurrent && /(?:قانون|قرار|لائحه|لائحة|شروط|رسوم|فيزا|تاشيره|تأشيرة|دوام|موعد)/.test(text), 4, "current-rule-or-schedule");

  const bounded = clamp(score, 0, 10);
  const tier = bounded >= 5 ? "required" : bounded >= 3 ? "preferred" : "none";
  return {
    tier,
    score: bounded,
    useLiveWeb: tier !== "none",
    searchContextSize: bounded >= 7 ? "medium" : "low",
    reasons: [...new Set(reasons)].slice(0, 5)
  };
}

export function bellaReasoningRouteV23(message, history = []) {
  const raw = clean(message);
  const text = normalize(raw);
  const words = text ? text.split(" ").filter(Boolean).length : 0;
  if (!text) return { tier: "light", effort: "low", score: 0, verbosity: "low", maxOutputTokens: 650, reasons: ["empty"] };

  const reasons = [];
  let score = 0;
  const add = (condition, weight, reason) => {
    if (!condition) return;
    score += weight;
    reasons.push(reason);
  };

  const social = /^(?:هلا|هلو|هاي|سلام|شلونج|شلونك|احبج|احبك|اشتقتلج|موا|هههه|😂|🤣|تمام|اوكي|زين|اي|لا)\b/.test(text) && words <= 12;
  const directSimple = /^(?:ترجم|اكتب|قول|قولي|شنو معنى|وش معنى)\b/.test(text) && words <= 18;
  const codeLike = /```|(?:const|let|var|function|class|import|export|select|insert|update|create table|traceback|exception|error:|npm|node|python|javascript|typescript|sql)\b/i.test(raw);
  const technical = /(?:برمجه|كود|api|github|vercel|supabase|قاعده بيانات|database|server|frontend|backend|خطا|مشكله تقنيه|debug|architecture|algorithm|خوارزميه|امن|security)/.test(text);
  const analysis = /(?:حلل|قارن|اشرح بالتفصيل|ليش صار|سبب|اسباب|خطه|خطة|صمم|معماري|استراتيجي|استراتيجية|احسب|اثبت|برهن|استنتج)/.test(text);
  const multiStep = /(?:اولا|اول شي|ثانيا|بعدها|وبعدين|خطوه|خطوة|مراحل|شروط|متطلبات)/.test(text) || (raw.match(/[\n•*-]/g) || []).length >= 4;
  const highStakes = /(?:طب|طبي|مرض|دواء|علاج|قانون|قانوني|استثمار|مالي|قرض|امن سيبراني|ثغره|ثغرة)/.test(text);
  const correction = /(?:فهمتي غلط|غلط|قصدي|لا اقصد|لا مو|مو جذي)/.test(text);
  const longPrompt = words >= 80;
  const veryLongPrompt = words >= 180;
  const deepHistory = Array.isArray(history) && history.length >= 12;

  if (social || directSimple) score -= 3;
  add(codeLike, 4, "code-or-error");
  add(technical, 2, "technical");
  add(analysis, 2, "analysis-request");
  add(multiStep, 2, "multi-step");
  add(highStakes, 2, "high-stakes");
  add(correction, 1, "user-correction");
  add(longPrompt, 2, "long-prompt");
  add(veryLongPrompt, 2, "very-long-prompt");
  add(deepHistory && (technical || analysis || correction), 1, "context-heavy");

  score = clamp(score, 0, 10);
  if (score >= 7) return { tier: "deep", effort: "high", score, verbosity: "medium", maxOutputTokens: 1400, reasons: [...new Set(reasons)] };
  if (score >= 3) return { tier: "focused", effort: "medium", score, verbosity: "medium", maxOutputTokens: 1050, reasons: [...new Set(reasons)] };
  return { tier: "light", effort: "low", score, verbosity: "low", maxOutputTokens: 700, reasons: [...new Set(reasons)] };
}

export function routeBellaIntelligenceV23({ message, history = [] } = {}) {
  const freshness = bellaFreshnessRouteV23(message);
  const reasoning = bellaReasoningRouteV23(message, history);
  return {
    release: "v23",
    freshness,
    reasoning,
    useLiveWeb: freshness.useLiveWeb,
    reasoningEffort: reasoning.effort
  };
}
