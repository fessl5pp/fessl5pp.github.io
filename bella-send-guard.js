(() => {
  "use strict";

  let fallbackBusy = false;
  let watchdog = null;

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function userMessageCount() {
    return document.querySelectorAll("#box .m.user").length;
  }

  function cleanText(node) {
    if (!node) return "";
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".vnext-time,.source-row,.bella-error-actions").forEach(x => x.remove());
    return (copy.innerText || copy.textContent || "").trim();
  }

  function removeStaleTyping() {
    const bots = [...document.querySelectorAll("#box .m.bot")];
    const last = bots[bots.length - 1];
    if (last && cleanText(last).startsWith("بيلا تكتب")) last.remove();
  }

  function unlockButton() {
    const btn = document.querySelector(".send");
    if (btn) btn.disabled = false;
  }

  function armWatchdog() {
    if (watchdog) clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      unlockButton();
      watchdog = null;
    }, 22000);
  }

  async function fallbackSend(text) {
    if (fallbackBusy) return;
    fallbackBusy = true;
    const input = document.getElementById("inp");
    const sendBtn = document.querySelector(".send");
    if (sendBtn) sendBtn.disabled = true;

    try {
      removeStaleTyping();
      if (typeof window.addMsg === "function") window.addMsg(text, "user");
      if (input) input.value = "";
      if (typeof window.addMsg === "function") window.addMsg("بيلا تكتب...", "bot");

      let reply = null;
      if (typeof window.getReply === "function") {
        try { reply = window.getReply(text); } catch { reply = null; }
      }
      if (reply === null || reply === undefined) {
        if (typeof window.getAIReply !== "function") throw new Error("AI reply handler unavailable");
        reply = await window.getAIReply(text);
      }

      removeStaleTyping();
      if (reply && typeof window.addMsg === "function") window.addMsg(reply, "bot");
      if (typeof window.updateSuggestions === "function") {
        try { window.updateSuggestions(reply || text); } catch {}
      }
      if (typeof window.updateMood === "function") {
        try { window.updateMood(); } catch {}
      }
    } catch (error) {
      console.error("Bella emergency send fallback failed:", error);
      removeStaleTyping();
      if (typeof window.addMsg === "function") window.addMsg("صار تعليق بسيط، جرّب ترسلها مرة ثانية.", "bot");
    } finally {
      fallbackBusy = false;
      unlockButton();
    }
  }

  async function guardedSend(event) {
    const input = document.getElementById("inp");
    const text = (input?.value || "").trim();
    if (!text) return;

    const original = window.send;
    if (typeof original !== "function") return fallbackSend(text);

    const beforeCount = userMessageCount();
    const beforeValue = input.value;
    let result;
    let threw = false;

    try {
      result = original();
    } catch (error) {
      threw = true;
      console.error("Bella primary send threw:", error);
    }

    await wait(120);
    const accepted = userMessageCount() > beforeCount || input.value !== beforeValue;

    if (accepted && !threw) {
      armWatchdog();
      Promise.resolve(result).catch(error => {
        console.error("Bella primary send rejected:", error);
        unlockButton();
      });
      return;
    }

    await fallbackSend(text);
  }

  function onClick(event) {
    const btn = event.target.closest?.(".send");
    if (!btn) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    guardedSend(event);
  }

  function onKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
    const input = event.target;
    if (!input || input.id !== "inp") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    guardedSend(event);
  }

  document.addEventListener("click", onClick, true);
  document.addEventListener("keydown", onKeyDown, true);

  window.BellaSendGuard = Object.freeze({ fallbackSend, unlockButton });
})();
