(() => {
  "use strict";

  const nativeFetch = window.fetch.bind(window);
  const API_TIMEOUT_MS = 18000;
  const RETRIES = 1;

  function requestUrl(input) {
    return typeof input === "string" ? input : (input && input.url) || "";
  }

  function isGuardedUrl(input) {
    const url = requestUrl(input);
    return url.startsWith("/api/chat") || url.startsWith("/api/dira");
  }

  function friendlyNetworkMessage() {
    if (navigator.onLine === false) return "النت مقطوع الحين، أول ما يرجع جرّب مرة ثانية.";
    return "النت أو السيرفر طول شوي، جرّب مرة ثانية.";
  }

  function syntheticErrorResponse(message = friendlyNetworkMessage()) {
    return new Response(JSON.stringify({ error: message, retryable: true }), {
      status: 503,
      headers: {
        "Content-Type": "application/json",
        "X-Bella-Network-Error": "1"
      }
    });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function enrichChatRequest(input, init = {}) {
    if (!requestUrl(input).startsWith("/api/chat")) return init;
    if (!window.BellaContext || typeof init.body !== "string") return init;

    try {
      const body = JSON.parse(init.body);
      body.history = window.BellaContext.buildHistory(body.message, body.history);
      body.recentReplies = window.BellaContext.getRecentReplies(body.recentReplies);
      body.contextRepeat = window.BellaContext.repeatInfo(body.message);
      return { ...init, body: JSON.stringify(body) };
    } catch (error) {
      console.warn("Bella context enrichment skipped:", error);
      return init;
    }
  }

  async function guardedFetch(input, init = {}) {
    if (!isGuardedUrl(input)) return nativeFetch(input, init);
    if (navigator.onLine === false) return syntheticErrorResponse();

    const preparedInit = enrichChatRequest(input, init);
    let lastError = null;
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      const controller = new AbortController();
      const externalSignal = preparedInit.signal;
      const abortFromOutside = () => controller.abort();
      if (externalSignal) {
        if (externalSignal.aborted) controller.abort();
        else externalSignal.addEventListener("abort", abortFromOutside, { once: true });
      }
      const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      try {
        const response = await nativeFetch(input, { ...preparedInit, signal: controller.signal });
        clearTimeout(timer);
        externalSignal?.removeEventListener?.("abort", abortFromOutside);

        if (response.status >= 500 && attempt < RETRIES) {
          await sleep(320 + attempt * 280);
          continue;
        }
        return response;
      } catch (error) {
        clearTimeout(timer);
        externalSignal?.removeEventListener?.("abort", abortFromOutside);
        lastError = error;
        if (attempt < RETRIES && externalSignal?.aborted !== true) {
          await sleep(320 + attempt * 280);
          continue;
        }
      }
    }

    console.error("Bella network request failed safely:", lastError);
    return syntheticErrorResponse();
  }

  // One network owner for Bella. Other modules keep using fetch normally,
  // while this layer owns timeout/retry/offline behavior for Bella APIs only.
  window.fetch = guardedFetch;

  const errorPhrases = [
    "النت أو السيرفر طول شوي",
    "النت مقطوع الحين",
    "الربط مع الذكاء الاصطناعي تعطل شوي",
    "بيلا ما رجعت رد هالمرة",
    "فشل الاتصال بالذكاء الاصطناعي",
    "صار شي بالربط الحين",
    "الواير لعب فيني",
    "ما قدرت أجيب شي الحين"
  ];

  function cleanMessageText(node) {
    if (!node) return "";
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".vnext-time,.source-row").forEach(el => el.remove());
    return (copy.innerText || "").trim();
  }

  function isErrorText(text) {
    return errorPhrases.some(phrase => String(text || "").includes(phrase));
  }

  function setBotMessageText(node, text) {
    const time = node.querySelector(".vnext-time")?.cloneNode(true) || null;
    node.textContent = text;
    if (time) node.appendChild(time);
  }

  function findPreviousUser(node) {
    let current = node?.previousElementSibling || null;
    while (current) {
      if (current.classList?.contains("m") && current.classList.contains("user")) return current;
      current = current.previousElementSibling;
    }
    return null;
  }

  function removeRetryActions(node) {
    const next = node?.nextElementSibling;
    if (next?.classList?.contains("bella-error-actions")) next.remove();
  }

  async function retryBotMessage(errorNode) {
    if (!errorNode || errorNode.dataset.retrying === "1") return;
    const userNode = findPreviousUser(errorNode);
    const userText = cleanMessageText(userNode);
    if (!userText || typeof window.getAIReply !== "function") return;

    errorNode.dataset.retrying = "1";
    removeRetryActions(errorNode);
    setBotMessageText(errorNode, "بيلا تعيد المحاولة...");

    try {
      const reply = await window.getAIReply(userText);
      if (!reply || isErrorText(reply)) {
        setBotMessageText(errorNode, reply || friendlyNetworkMessage());
        errorNode.dataset.retrying = "0";
        decorateErrorMessage(errorNode);
        return;
      }

      setBotMessageText(errorNode, reply);
      errorNode.classList.remove("bella-net-error");
      delete errorNode.dataset.retrying;
      if (typeof window.updateSuggestions === "function") window.updateSuggestions(reply);
      if (typeof window.updateMood === "function") window.updateMood();
      errorNode.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } catch (error) {
      console.error("Bella retry failed:", error);
      setBotMessageText(errorNode, friendlyNetworkMessage());
      errorNode.dataset.retrying = "0";
      decorateErrorMessage(errorNode);
    }
  }

  function decorateErrorMessage(node) {
    if (!node?.classList?.contains("bot")) return;
    const text = cleanMessageText(node);
    if (!isErrorText(text)) return;

    node.classList.add("bella-net-error");
    const next = node.nextElementSibling;
    if (next?.classList?.contains("bella-error-actions")) return;

    const actions = document.createElement("div");
    actions.className = "bella-error-actions";
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "bella-retry-btn";
    retry.textContent = "↻ جرّب مرة ثانية";
    retry.onclick = () => retryBotMessage(node);
    actions.appendChild(retry);
    node.insertAdjacentElement("afterend", actions);
  }

  function ensureConnectionBanner() {
    let banner = document.getElementById("bellaConnectionState");
    if (banner) return banner;
    const inputArea = document.querySelector(".input-area");
    if (!inputArea) return null;
    banner = document.createElement("div");
    banner.id = "bellaConnectionState";
    banner.className = "bella-connection-state";
    banner.hidden = true;
    inputArea.insertAdjacentElement("beforebegin", banner);
    return banner;
  }

  function updateConnectionState() {
    const banner = ensureConnectionBanner();
    if (!banner) return;
    const offline = navigator.onLine === false;
    banner.hidden = !offline;
    banner.textContent = offline ? "📡 أنت أوفلاين — ردود الذكاء الاصطناعي تحتاج نت." : "";
  }

  function startErrorObserver() {
    const box = document.getElementById("box");
    if (!box || box.dataset.runtimeObserved === "1") return;
    box.dataset.runtimeObserved = "1";
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof HTMLElement && node.classList.contains("m")) decorateErrorMessage(node);
        }
      }
    });
    observer.observe(box, { childList: true });
  }

  window.BellaRuntime = Object.freeze({
    fetch: guardedFetch,
    isErrorText,
    retryBotMessage,
    updateConnectionState,
    enrichChatRequest
  });

  window.addEventListener("online", updateConnectionState);
  window.addEventListener("offline", updateConnectionState);
  window.addEventListener("error", event => console.error("Bella browser error:", event.error || event.message));
  window.addEventListener("unhandledrejection", event => console.error("Bella unhandled promise:", event.reason));
  window.addEventListener("load", () => {
    updateConnectionState();
    startErrorObserver();
    document.querySelectorAll("#box .m.bot").forEach(decorateErrorMessage);
  });
})();
