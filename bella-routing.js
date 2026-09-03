(() => {
  "use strict";

  // Bella v12 keeps the legacy script only for UI/game compatibility.
  // Normal conversation copy must come from the AI API, not from old phrase banks.
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

  function disableLegacyConversationCopy() {
    // Old dictionary / mood banks are never allowed to answer normal chat.
    window.dictionaryReply = function bellaAIOnlyDictionary() { return null; };
    window.angryServiceBlock = function bellaAIOnlyAngryService() { return null; };
    window.fazaaReply = function bellaAIOnlyFazaaReply() { return null; };
    window.socialRadarReply = function bellaAIOnlySocialRadar() { return null; };

    // Keep learning the user's name locally, but let the AI phrase the reply.
    window.detectName = function bellaAINameCapture(msg) {
      if (typeof originalDetectName === "function") {
        try { originalDetectName.call(this, msg); } catch {}
      }
      return null;
    };

    // Remove the old random typing popups and rumor-bar copy completely.
    window.handleTypingBehavior = function bellaNoLegacyTypingCopy() {};
    window.initRumorBar = function bellaNoLegacyRumors() {};
    window.startRumorCycle = function bellaNoLegacyRumorCycle() {};
    window.showRumor = function bellaNoLegacyRumor() {};

    // Old suggestion banks are retired. The composer stays clean.
    window.updateSuggestions = function bellaNoLegacySuggestions() {
      const suggestions = document.getElementById("quickSuggestions");
      if (!suggestions) return;
      suggestions.hidden = true;
      suggestions.replaceChildren();
    };
    window.refreshSuggestions = window.updateSuggestions;
  }

  function clearLegacyAmbientUI() {
    document.getElementById("rumor-bar")?.remove();
    const suggestions = document.getElementById("quickSuggestions");
    if (suggestions) {
      suggestions.hidden = true;
      suggestions.replaceChildren();
    }

    try {
      if (typeof rumorTimer !== "undefined" && rumorTimer) {
        clearInterval(rumorTimer);
        rumorTimer = null;
      }
    } catch {}
  }

  window.has = safeHas;
  disableLegacyConversationCopy();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", clearLegacyAmbientUI, { once: true });
  } else {
    clearLegacyAmbientUI();
  }
  window.addEventListener("load", clearLegacyAmbientUI, { once: true });

  window.BellaRouting = Object.freeze({
    normalizeText,
    safeHas,
    shouldUseAI,
    aiFirst: true,
    legacyConversationCopy: false
  });
})();
