(() => {
  "use strict";

  let bound = null;
  function bind() {
    const input = document.getElementById("inp");
    if (!input || input === bound) return false;
    bound = input;
    const stopOnTyping = () => {
      if (!String(input.value || "").trim()) return;
      try { window.BellaVoice?.stop?.(); } catch {}
    };
    input.addEventListener("input", stopOnTyping, { passive: true });
    input.addEventListener("keydown", stopOnTyping, { passive: true });
    return true;
  }
  const observer = new MutationObserver(bind);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  bind();
  window.BellaVoiceV2 = Object.freeze({ bind, version: 2, behavior: "stop-on-typing + mood-directed server voice" });
})();
