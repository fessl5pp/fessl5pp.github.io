(() => {
  "use strict";

  // This is the only compatibility layer between the legacy local brain in
  // script.js and the newer Bella experience. It intentionally does NOT own
  // send(), mood state, memory, or API calls.
  const originalDictionaryReply = window.dictionaryReply;

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[؟?!.,،؛:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function safeHas(msg, words) {
    const haystack = normalizeText(msg);
    const tokens = haystack ? haystack.split(" ") : [];

    return (Array.isArray(words) ? words : []).some(word => {
      const needle = normalizeText(word);
      if (!needle) return false;
      // Tiny Arabic particles such as "وي" must match as a token, not as a
      // substring inside a completely different word such as "أسوي".
      if (!needle.includes(" ") && needle.length <= 2) return tokens.includes(needle);
      return haystack.includes(needle);
    });
  }

  function shouldUseAI(msg) {
    const clean = normalizeText(msg);
    const wordCount = clean ? clean.split(" ").length : 0;
    const openEnded = [
      "شنو تنصح", "شنو اسوي", "شنو أسوي", "وش اسوي", "وش أسوي",
      "شلون اقدر", "شلون أقدر", "ابي نصيحة", "أبي نصيحة", "ساعديني",
      "فسري لي", "اشرحي لي", "اشرح لي", "ليش", "كيف", "شنو رايج",
      "شنو رأيج", "وش رايك", "وش رايج", "قولي رايج"
    ].some(phrase => clean.includes(normalizeText(phrase)));

    const repeatedShortMessage = !!window.BellaContext?.shouldUseAIForRepeat?.(msg);
    return wordCount >= 5 || openEnded || repeatedShortMessage;
  }

  window.has = safeHas;
  window.dictionaryReply = function bellaDictionaryRouter(msg) {
    if (shouldUseAI(msg)) return null;
    return typeof originalDictionaryReply === "function" ? originalDictionaryReply(msg) : null;
  };

  window.BellaRouting = Object.freeze({
    normalizeText,
    safeHas,
    shouldUseAI
  });
})();
