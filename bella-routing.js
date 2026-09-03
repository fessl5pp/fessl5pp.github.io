(() => {
  "use strict";

  // Bella v12 keeps the legacy script only for UI/game compatibility.
  // Normal conversation copy must come from the AI API, not from old phrase banks.
  // Compatibility note: shouldUseAIForRepeat used to escalate only repeated short
  // messages; AI-first routing now escalates every non-empty normal chat message.
  const originalDetectName = window.detectName;

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
      if (!needle.includes(" ") && needle.length <= 2) return tokens.includes(needle);
      return haystack.includes(needle);
    });
  }

  function shouldUseAI(msg) {
    return normalizeText(msg).length > 0;
  }

  function installAIFirstConversation() {
    window.dictionaryReply = function bellaAIOnlyDictionary() { return null; };
    window.angryServiceBlock = function bellaAIOnlyAngryService() { return null; };
    window.fazaaReply = function bellaAIOnlyFazaaReply() { return null; };
    window.socialRadarReply = function bellaAIOnlySocialRadar() { return null; };

    window.detectName = function bellaAINameCapture(msg) {
      if (typeof originalDetectName === "function") {
        try { originalDetectName.call(this, msg); } catch {}
      }
      return null;
    };

    window.updateSuggestions = function bellaNoLegacySuggestions() {
      const suggestions = document.getElementById("quickSuggestions");
      if (!suggestions) return;
      suggestions.hidden = true;
      suggestions.replaceChildren();
    };
    window.refreshSuggestions = window.updateSuggestions;
  }

  function clearLegacySuggestions() {
    const suggestions = document.getElementById("quickSuggestions");
    if (suggestions) {
      suggestions.hidden = true;
      suggestions.replaceChildren();
    }
  }

  window.has = safeHas;
  installAIFirstConversation();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", clearLegacySuggestions, { once: true });
  } else {
    clearLegacySuggestions();
  }
  window.addEventListener("load", clearLegacySuggestions, { once: true });

  window.BellaRouting = Object.freeze({
    normalizeText,
    safeHas,
    shouldUseAI,
    aiFirst: true,
    legacyConversationCopy: false,
    ambientMomentsPreserved: true
  });
})();
