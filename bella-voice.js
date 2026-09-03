(() => {
  "use strict";

  const KEY = "bella_voice_v1";
  const LEGACY_KEY = "bella_vnext_v2";
  const MAX_SPOKEN_CHARS = 700;
  const defaults = { enabled: false, migrated: false, provider: "openai" };

  let state = load();
  let audioCtx = null;
  let currentSource = null;
  let sequence = 0;
  let boundButton = null;
  let processing = false;
  const queue = [];

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      return saved ? { ...defaults, ...saved } : { ...defaults };
    } catch {
      return { ...defaults };
    }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  function migrateLegacyPreference() {
    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
      if (legacy && legacy.voiceEnabled === true) state.enabled = true;
      if (legacy && legacy.voiceEnabled !== false) {
        legacy.voiceEnabled = false;
        localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy));
      }
    } catch {}
    state.migrated = true;
    persist();
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/مصادر التحقق:[\s\S]*$/u, "")
      .replace(/https?:\/\/\S+/gi, "")
      .replace(/[😂🤣🥺😡🙂✨🌸💕🔎📡🇰🇼]/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_SPOKEN_CHARS);
  }

  function currentMood() {
    const avatar = document.getElementById("chatAvatar") || document.getElementById("heroAvatar");
    if (avatar?.classList.contains("mood-angry")) return "angry";
    if (avatar?.classList.contains("mood-cute")) return "cute";
    if (avatar?.classList.contains("mood-happy")) return "happy";
    return "chill";
  }

  function getAudioContext() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
      return audioCtx;
    } catch {
      return null;
    }
  }

  function stop() {
    sequence += 1;
    queue.length = 0;
    try { currentSource?.stop?.(); } catch {}
    currentSource = null;
    try { window.speechSynthesis?.cancel?.(); } catch {}
  }

  function fallbackSpeak(text, mySequence) {
    if (!state.enabled || !("speechSynthesis" in window) || mySequence !== sequence) return Promise.resolve(false);
    return new Promise(resolve => {
      try {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesis.getVoices();
        utterance.voice = voices.find(v => /ar-KW/i.test(v.lang)) || voices.find(v => /^ar/i.test(v.lang)) || null;
        utterance.lang = utterance.voice?.lang || "ar-KW";
        utterance.rate = 0.96;
        utterance.pitch = 1.03;
        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);
        speechSynthesis.speak(utterance);
      } catch {
        resolve(false);
      }
    });
  }

  async function playServer(text, mySequence) {
    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, mood: currentMood() })
    });
    if (!response.ok) throw new Error(`voice_http_${response.status}`);
    const bytes = await response.arrayBuffer();
    if (mySequence !== sequence || !state.enabled) return false;

    const ctx = getAudioContext();
    if (!ctx) throw new Error("audio_context_unavailable");
    const decoded = await ctx.decodeAudioData(bytes.slice(0));
    if (mySequence !== sequence || !state.enabled) return false;

    return new Promise(resolve => {
      const source = ctx.createBufferSource();
      source.buffer = decoded;
      source.connect(ctx.destination);
      source.onended = () => {
        if (currentSource === source) currentSource = null;
        resolve(mySequence === sequence);
      };
      currentSource = source;
      source.start(0);
    });
  }

  async function drain() {
    if (processing) return;
    processing = true;
    try {
      while (queue.length && state.enabled) {
        const text = queue.shift();
        const mySequence = sequence;
        try {
          await playServer(text, mySequence);
        } catch (error) {
          console.warn("Bella server voice fallback:", error?.message || "unknown");
          await fallbackSpeak(text, mySequence);
        }
        if (mySequence !== sequence) break;
      }
    } finally {
      processing = false;
      if (queue.length && state.enabled) drain();
    }
  }

  function speak(value) {
    if (!state.enabled) return false;
    const text = cleanText(value);
    if (!text || text.startsWith("بيلا تكتب")) return false;
    queue.push(text);
    drain();
    return true;
  }

  function toast(text) {
    try {
      if (typeof window.showPopupCustom === "function") return window.showPopupCustom(text);
    } catch {}
    const el = document.createElement("div");
    el.className = "vnext-toast";
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  function syncButton() {
    const btn = document.getElementById("bellaVoiceToggle");
    if (!btn) return;
    if (boundButton !== btn) {
      boundButton = btn;
      btn.onclick = toggle;
    }
    const text = state.enabled ? "🔊" : "🔇";
    const label = state.enabled ? "إيقاف صوت بيلا" : "تشغيل صوت بيلا";
    const title = state.enabled ? "صوت بيلا الحقيقي شغال" : "شغّل صوت بيلا الحقيقي";
    if (btn.textContent !== text) btn.textContent = text;
    if (btn.getAttribute("aria-label") !== label) btn.setAttribute("aria-label", label);
    if (btn.title !== title) btn.title = title;
  }

  function toggle() {
    state.enabled = !state.enabled;
    persist();
    if (state.enabled) {
      getAudioContext();
      toast("صوت بيلا الحقيقي اشتغل 🔊");
    } else {
      stop();
      toast("طفيت صوت بيلا");
    }
    syncButton();
  }

  function messageText(node) {
    if (!(node instanceof Element)) return "";
    const clone = node.cloneNode(true);
    clone.querySelectorAll(".vnext-time,.source-row,.bella-cite-inline").forEach(el => el.remove());
    return cleanText(clone.innerText || clone.textContent || "");
  }

  function watchMessages() {
    const box = document.getElementById("box");
    if (!box || box.dataset.bellaVoiceObserved === "1") return;
    box.dataset.bellaVoiceObserved = "1";
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const added of mutation.addedNodes) {
          if (!(added instanceof Element)) continue;
          const nodes = [added, ...(added.querySelectorAll?.(".m") || [])];
          for (const node of nodes) {
            if (!node.classList?.contains("m")) continue;
            if (node.classList.contains("user")) {
              if (state.enabled) stop();
              continue;
            }
            if (!state.enabled || !node.classList.contains("bot")) continue;
            if (node.dataset.bellaVoiceSpoken === "1") continue;
            const text = messageText(node);
            if (!text || text.startsWith("بيلا تكتب")) continue;
            node.dataset.bellaVoiceSpoken = "1";
            setTimeout(() => {
              const finalText = messageText(node);
              if (finalText && !finalText.startsWith("بيلا تكتب")) speak(finalText);
            }, 40);
          }
        }
      }
    });
    observer.observe(box, { childList: true, subtree: true });
  }

  migrateLegacyPreference();

  const domObserver = new MutationObserver(() => {
    syncButton();
    watchMessages();
  });
  domObserver.observe(document.documentElement, { childList: true, subtree: true });
  syncButton();
  watchMessages();

  window.BellaVoice = Object.freeze({
    version: 9,
    get enabled() { return state.enabled; },
    speak,
    stop,
    toggle,
    syncButton,
    provider: "gpt-4o-mini-tts"
  });
})();