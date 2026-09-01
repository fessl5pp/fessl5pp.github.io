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

  function jsonResponse(payload, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...extraHeaders
      }
    });
  }

  function syntheticErrorResponse(message = friendlyNetworkMessage()) {
    return jsonResponse({ error: message, retryable: true }, 503, { "X-Bella-Network-Error": "1" });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function prepareChatRequest(input, init = {}) {
    if (!requestUrl(input).startsWith("/api/chat") || typeof init.body !== "string") {
      return { init, streamRequested: false, mode: null };
    }

    try {
      let body = JSON.parse(init.body);
      if (window.BellaContext) {
        body.history = window.BellaContext.buildHistory(body.message, body.history);
        body.recentReplies = window.BellaContext.getRecentReplies(body.recentReplies);
        body.contextRepeat = window.BellaContext.repeatInfo(body.message);
      }
      if (window.BellaPersonality?.enrichPayload) {
        body = window.BellaPersonality.enrichPayload(body);
      }

      const streamRequested = window.BellaSpeed?.supportsStreaming?.() === true;
      const headers = new Headers(init.headers || {});
      if (streamRequested) {
        body.stream = true;
        headers.set("Accept", "text/event-stream");
      }

      return {
        init: { ...init, headers, body: JSON.stringify(body) },
        streamRequested,
        mode: body.mode || null
      };
    } catch (error) {
      console.warn("Bella request enrichment skipped:", error);
      return { init, streamRequested: false, mode: null };
    }
  }

  function parseSseBlock(block) {
    const dataLines = String(block || "")
      .split(/\r?\n/)
      .filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).trimStart());
    if (!dataLines.length) return null;
    const raw = dataLines.join("\n").trim();
    if (!raw || raw === "[DONE]") return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  async function consumeChatStream(response, mode) {
    if (!response.body?.getReader) return response;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let reply = "";
    let sawDelta = false;
    window.BellaSpeed?.begin?.();

    const handleEvent = event => {
      if (!event || typeof event !== "object") return;
      if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
        reply += event.delta;
        sawDelta = true;
        window.BellaSpeed?.delta?.(reply);
        return;
      }
      if (event.type === "response.output_text.done" && typeof event.text === "string") {
        if (!reply || event.text.length >= reply.length) reply = event.text;
        if (reply) window.BellaSpeed?.delta?.(reply);
        return;
      }
      if (event.type === "error" || event.type === "response.failed") {
        const message = event.message || event.error?.message || "الرد انقطع بالنص، جرّب مرة ثانية.";
        throw new Error(message);
      }
    };

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || "";
        for (const block of blocks) handleEvent(parseSseBlock(block));
      }

      buffer += decoder.decode();
      if (buffer.trim()) handleEvent(parseSseBlock(buffer));

      reply = reply.trim();
      if (!reply) throw new Error("Bella stream completed without text");
      window.BellaSpeed?.complete?.(reply);
      return jsonResponse({ reply, mode, streamed: true }, 200, { "X-Bella-Streamed": "1" });
    } catch (error) {
      console.error("Bella streamed reply failed:", error);
      window.BellaSpeed?.fail?.();
      const message = sawDelta ? "الرد انقطع بالنص، جرّب مرة ثانية." : friendlyNetworkMessage();
      return syntheticErrorResponse(message);
    } finally {
      try { reader.releaseLock(); } catch {}
    }
  }

  async function guardedFetch(input, init = {}) {
    if (!isGuardedUrl(input)) return nativeFetch(input, init);
    if (navigator.onLine === false) return syntheticErrorResponse();

    const prepared = prepareChatRequest(input, init);
    const preparedInit = prepared.init;
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

        const contentType = response.headers.get("content-type") || "";
        if (prepared.streamRequested && response.ok && contentType.includes("text/event-stream")) {
          return await consumeChatStream(response, prepared.mode);
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
    window.BellaSpeed?.fail?.();
    return syntheticErrorResponse();
  }

  // One network owner for Bella. Other modules keep using fetch normally,
  // while this layer owns timeout/retry/offline/stream behavior for Bella APIs only.
  window.fetch = guardedFetch;

  const errorPhrases = [
    "النت أو السيرفر طول شوي",
    "النت مقطوع الحين",
    "الربط مع الذكاء الاصطناعي تعطل شوي",
    "بيلا ما رجعت رد هالمرة",
    "فشل الاتصال بالذكاء الاصطناعي",
    "صار شي بالربط الحين",
    "الواير لعب فيني",
    "ما قدرت أجيب شي الحين",
    "الرد انقطع بالنص"
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
    prepareChatRequest,
    consumeChatStream
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
