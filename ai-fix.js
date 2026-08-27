(() => {
  const originalDictionaryReply = window.dictionaryReply;

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[؟?!.,،؛:]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Prevent tiny Kuwaiti interjections such as "وي" from matching inside
  // unrelated words such as "أسوي".
  window.has = function safeHas(msg, words) {
    const haystack = normalizeText(msg);
    const tokens = haystack ? haystack.split(" ") : [];

    return words.some(word => {
      const needle = normalizeText(word);
      if (!needle) return false;
      if (!needle.includes(" ") && needle.length <= 2) {
        return tokens.includes(needle);
      }
      return haystack.includes(needle);
    });
  };

  window.dictionaryReply = function smartDictionaryReply(msg) {
    const clean = normalizeText(msg);
    const wordCount = clean ? clean.split(" ").length : 0;

    const adviceOrReasoning = [
      "شنو تنصح",
      "شنو اسوي",
      "شنو أسوي",
      "وش اسوي",
      "وش أسوي",
      "شلون اقدر",
      "شلون أقدر",
      "ابي نصيحة",
      "أبي نصيحة",
      "ساعديني",
      "فسري لي",
      "اشرحي لي",
      "ليش",
      "كيف"
    ].some(phrase => clean.includes(normalizeText(phrase)));

    // Longer/open-ended messages should use the AI instead of a canned line.
    if (wordCount >= 5 || adviceOrReasoning) return null;

    return typeof originalDictionaryReply === "function"
      ? originalDictionaryReply(msg)
      : null;
  };

  window.getAIReply = async function getAIReplyFixed(text) {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          message: text,
          mode: window.s?.mode || (typeof s !== "undefined" ? s.mode : "auto"),
          userName: window.s?.userName || (typeof s !== "undefined" ? s.userName : "")
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Bella AI endpoint error:", res.status, data.error || data);
        return "صار خطأ بربط الذكاء الاصطناعي 😅 جرّب مرة ثانية بعد شوي.";
      }

      return data.reply || "ما فهمت عدل، عيدها لي بطريقة ثانية؟ 😅";
    } catch (error) {
      console.error("Bella AI network error:", error);
      return "الواير معلق عندي الحين، جرب بعد شوي 😅";
    }
  };
})();
