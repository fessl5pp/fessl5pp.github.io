(() => {
  "use strict";

  const base = window.BellaMemoryV3;
  if (!base?.enrichPayload) return;

  const MAX_WORKING_DURABLE = 12;
  const SIMILARITY_THRESHOLD = 0.74;

  function clean(value, max = 180) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function normalize(value) {
    return clean(value, 260).toLowerCase()
      .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ؤئ]/g, "ء")
      .replace(/[؟?!.,،؛:]/g, " ").replace(/\s+/g, " ").trim();
  }

  function polarity(value) {
    const n = normalize(value);
    if (/(?:ما احب|ماحب|ما افضل|مافضل|اكره|مو عاجبني|ما ابي)/.test(n)) return -1;
    if (/(?:احب|افضل|يعجبني|ابي|اختار)/.test(n)) return 1;
    return 0;
  }

  function coreTokens(value) {
    const drop = new Set(["انا", "اني", "اني", "احب", "ما", "افضل", "اكره", "ابي", "تذكري", "ان", "مو", "عاجبني", "يعجبني"]);
    return normalize(value).split(" ").filter(word => word.length > 1 && !drop.has(word));
  }

  function coreSimilarity(a, b) {
    const aa = new Set(coreTokens(a));
    const bb = new Set(coreTokens(b));
    if (!aa.size || !bb.size) return 0;
    let common = 0;
    for (const token of aa) if (bb.has(token)) common++;
    return common / Math.max(aa.size, bb.size);
  }

  function similarity(a, b) {
    try { return Number(window.BellaContext?.similarity?.(a, b) || 0); }
    catch { return 0; }
  }

  function importance(value) {
    const n = normalize(value);
    let score = 55;
    if (/(?:اسمي|عمري|تخصصي|ادرس|اشتغل|وظيفتي|احب|افضل|ما احب|اكره)/.test(n)) score += 18;
    if (/(?:دايم|دائما|عادة|عادةً|من زمان)/.test(n)) score += 8;
    if (/(?:اليوم|الحين|الان|باجر|هالاسبوع|هذا الاسبوع)/.test(n)) score -= 25;
    return Math.max(20, Math.min(95, score));
  }

  function distillMemoryList(items, max = MAX_WORKING_DURABLE) {
    const source = (Array.isArray(items) ? items : []).map(item => clean(item)).filter(Boolean);
    const selectedNewestFirst = [];

    for (let index = source.length - 1; index >= 0; index--) {
      const candidate = source[index];
      const duplicate = selectedNewestFirst.some(existing => similarity(candidate, existing) >= SIMILARITY_THRESHOLD);
      if (duplicate) continue;

      const candidatePolarity = polarity(candidate);
      const contradiction = candidatePolarity !== 0 && selectedNewestFirst.some(existing => {
        const otherPolarity = polarity(existing);
        return otherPolarity !== 0 && otherPolarity !== candidatePolarity && coreSimilarity(candidate, existing) >= 0.72;
      });
      if (contradiction) continue; // newest fact wins because we iterate backwards.

      selectedNewestFirst.push(candidate);
      if (selectedNewestFirst.length >= Math.max(1, max)) break;
    }

    return selectedNewestFirst.reverse();
  }

  function enrichPayload(payload) {
    const enriched = base.enrichPayload(payload);
    if (!enriched || typeof enriched !== "object") return enriched;
    const all = Array.isArray(enriched.memory) ? enriched.memory : [];
    const transient = all.filter(item => String(item || "").startsWith("مؤقت للجلسة فقط:"));
    const durable = all.filter(item => !String(item || "").startsWith("مؤقت للجلسة فقط:"));
    const distilled = distillMemoryList(durable, MAX_WORKING_DURABLE);
    return {
      ...enriched,
      memory: [...distilled, ...transient.slice(-4)].slice(-16),
      memoryLayer: {
        ...(enriched.memoryLayer || {}),
        version: "v4",
        distiller: true,
        durableInput: durable.length,
        durableWorkingSet: distilled.length,
        temporalDecay: "session-expiry + server-retrieval-decay"
      }
    };
  }

  const api = Object.freeze({
    ...base,
    enrichPayload,
    distillMemoryList,
    importance,
    policy: "explicit durable facts only; newest near-duplicate/contradiction wins; no automatic sensitive memory",
    version: 4
  });

  window.BellaMemoryV4 = api;
  // Compatibility: existing style/runtime code still calls BellaMemoryV3.
  window.BellaMemoryV3 = api;
})();
