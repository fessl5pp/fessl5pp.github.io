(() => {
  "use strict";

  let previousAddMsg = null;
  let pending = null;
  let finishTimer = null;

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanNodeText(node) {
    if (!node) return "";
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".vnext-time,.source-row,.bella-error-actions").forEach(x => x.remove());
    return (copy.innerText || copy.textContent || "").trim();
  }

  function typingNode() {
    const nodes = [...document.querySelectorAll("#box .m.bot")];
    const last = nodes[nodes.length - 1];
    return last && cleanNodeText(last).startsWith("بيلا تكتب") ? last : null;
  }

  function isAppleSafari() {
    const ua = navigator.userAgent || "";
    const appleTouch = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const safari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Edg/i.test(ua);
    return appleTouch || safari;
  }

  function supportsStreaming() {
    if (isAppleSafari()) return false;
    return typeof ReadableStream !== "undefined" && typeof TextDecoder !== "undefined" && !!typingNode();
  }

  function preserveTime(node) {
    return node?.querySelector(".vnext-time")?.cloneNode(true) || null;
  }

  function setNodeText(node, text) {
    if (!node) return;
    const time = preserveTime(node);
    node.textContent = String(text || "");
    if (time) node.appendChild(time);
    const box = document.getElementById("box");
    if (box) requestAnimationFrame(() => { box.scrollTop = box.scrollHeight; });
  }

  function ensureStyle() {
    if (document.getElementById("bellaSpeedStyle")) return;
    const style = document.createElement("style");
    style.id = "bellaSpeedStyle";
    style.textContent = `
      .m.bot.bella-streaming::after{content:"";display:inline-block;width:2px;height:1em;margin-inline-start:4px;vertical-align:-2px;background:currentColor;opacity:.65;animation:bellaCursor .8s steps(1) infinite}
      @keyframes bellaCursor{0%,45%{opacity:.65}46%,100%{opacity:0}}
    `;
    document.head.appendChild(style);
  }

  function clearFinishTimer() {
    if (finishTimer) clearTimeout(finishTimer);
    finishTimer = null;
  }

  function begin() {
    clearFinishTimer();
    const node = typingNode();
    if (!node) return false;
    ensureStyle();
    node.classList.add("bella-streaming");
    pending = { node, full: "", accumulated: "" };
    return true;
  }

  function delta(fullText) {
    if (!pending && !begin()) return;
    const full = String(fullText || "");
    pending.full = full;
    if (full) setNodeText(pending.node, full);
  }

  function complete(fullText) {
    if (!pending && !begin()) return;
    const full = String(fullText || pending.full || "").trim();
    pending.full = full;
    pending.accumulated = "";
    if (full) {
      setNodeText(pending.node, full);
      window.BellaContext?.recordTurn?.("assistant", full);
    }

    clearFinishTimer();
    finishTimer = setTimeout(() => {
      if (pending?.node) pending.node.classList.remove("bella-streaming");
      pending = null;
      finishTimer = null;
    }, 4000);
  }

  function fail() {
    clearFinishTimer();
    if (pending?.node?.isConnected) {
      pending.node.classList.remove("bella-streaming");
      setNodeText(pending.node, "بيلا تكتب...");
    }
    pending = null;
  }

  function finalizePending() {
    clearFinishTimer();
    if (pending?.node) pending.node.classList.remove("bella-streaming");
    pending = null;
  }

  function installAddMsgBridge() {
    if (typeof window.addMsg !== "function" || window.addMsg.__bellaSpeedWrapped) return;
    previousAddMsg = window.addMsg;

    function speedAwareAddMsg(text, type) {
      if (pending?.full && type === "bot") {
        const next = pending.accumulated ? `${pending.accumulated} ${String(text || "")}` : String(text || "");
        const fullNorm = normalize(pending.full);
        const nextNorm = normalize(next);

        if (fullNorm && nextNorm && (fullNorm === nextNorm || fullNorm.startsWith(nextNorm))) {
          pending.accumulated = next;
          if (fullNorm === nextNorm) finalizePending();
          return;
        }
      }
      return previousAddMsg.apply(this, arguments);
    }

    speedAwareAddMsg.__bellaSpeedWrapped = true;
    window.addMsg = speedAwareAddMsg;
  }

  window.BellaSpeed = Object.freeze({
    supportsStreaming,
    begin,
    delta,
    complete,
    fail,
    isAppleSafari
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      ensureStyle();
      installAddMsgBridge();
    }, { once: true });
  } else {
    ensureStyle();
    installAddMsgBridge();
  }
})();
