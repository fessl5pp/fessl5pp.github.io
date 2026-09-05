(() => {
  "use strict";

  // Mood is owned by bella-vnext.js. This module only learns communication style and enriches context.
  const STORAGE_KEY = "bella_style_v1";
  const defaults = {
    version: 1,
    samples: 0,
    emaChars: 34,
    humor: 0.2,
    warmth: 0.25,
    directness: 0.35,
    emoji: 0.08,
    formality: 0.08,
    dialect: 0.55,
    lastUserNorm: "",
    lastSeenAt: 0
  };

  const playfulCues = ["امزح", "مزح", "اطقطق", "طقطقه", "قاعد امزح"];
  const affectionCues = ["احبج", "احبچ", "احبك", "اعشقج", "فديتج", "اشتقت لج", "يا بعد جبدي", "يا قلبي", "يا حلاتج", "اموت فيج", "كيوت", "ذربه"];
  const directCues = ["ابي", "أبي", "عطني", "عطيني", "سو", "سوي", "قولي", "جاوبي", "اشرحي", "اشرح", "اختصري", "اختصر"];
  const formalCues = ["من فضلك", "لو سمحت", "شكرا", "شكرًا", "يرجى", "هل يمكنك", "أرجو"];
  const dialectCues = ["شلون", "شنو", "شكو", "جذي", "عاد", "عيل", "صج", "وايد", "ابي", "تبي", "ويا", "باجر", "عقب", "اشدعوه", "علامك", "مو"];
  const seriousCues = ["توفى", "وفاة", "مات", "مستشفى", "عملية", "سرطان", "حادث", "خايف", "خايفه", "مكتئب", "انتحار", "تهديد", "مصيبه", "كارثه", "ضايق صدري", "متضايق", "مضايق", "مشكله كبيره"];

  let state = load();
  let observer = null;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved && typeof saved === "object" ? { ...defaults, ...saved } : { ...defaults };
    } catch {
      return { ...defaults };
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/[ة]/g, "ه")
      .replace(/[ى]/g, "ي")
      .replace(/[ؤئ]/g, "ء")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function ema(previous, sample, alpha = 0.16) {
    return previous * (1 - alpha) + sample * alpha;
  }

  function hasAny(text, list) {
    const normalized = normalize(text);
    return list.some(item => normalized.includes(normalize(item)));
  }

  function analyze(text) {
    const raw = String(text || "");
    const norm = normalize(raw);
    const playful = /😂|🤣|هههه|ككك|😭/.test(raw) || hasAny(raw, playfulCues);
    const affectionate = hasAny(raw, affectionCues);
    const serious = hasAny(raw, seriousCues);
    const direct = hasAny(raw, directCues) || (norm.split(" ").length <= 5 && /^(ابي|عطني|عطيني|سو|سوي|قولي|جاوبي)/.test(norm));

    return {
      norm,
      serious,
      chars: Math.min(180, norm.length),
      humorSample: playful ? 1 : 0,
      warmthSample: affectionate || hasAny(raw, ["مشكور", "تسلمين", "كفو عليج", "ذوق", "حبيبتي"]) ? 1 : 0,
      directSample: direct ? 1 : 0,
      emojiSample: /[\u{1F300}-\u{1FAFF}]/u.test(raw) ? 1 : 0,
      formalSample: hasAny(raw, formalCues) ? 1 : 0,
      dialectSample: hasAny(raw, dialectCues) ? 1 : 0
    };
  }

  function commit(text) {
    const signals = analyze(text);
    if (!signals.norm) return { signals, duplicate: false };

    const now = Date.now();
    const duplicate = state.lastUserNorm === signals.norm && now - Number(state.lastSeenAt || 0) < 8000;
    if (duplicate) return { signals, duplicate: true };

    state.samples += 1;
    state.emaChars = ema(state.emaChars, signals.chars, 0.14);
    state.humor = ema(state.humor, signals.humorSample, 0.13);
    state.warmth = ema(state.warmth, signals.warmthSample, 0.12);
    state.directness = ema(state.directness, signals.directSample, 0.12);
    state.emoji = ema(state.emoji, signals.emojiSample, 0.1);
    state.formality = ema(state.formality, signals.formalSample, 0.1);
    state.dialect = ema(state.dialect, signals.dialectSample, 0.1);
    state.lastUserNorm = signals.norm;
    state.lastSeenAt = now;
    save();
    return { signals, duplicate: false };
  }

  function getStyleProfile(signals = null) {
    const chars = signals ? ema(state.emaChars, signals.chars, 0.2) : state.emaChars;
    const directness = signals ? ema(state.directness, signals.directSample, 0.18) : state.directness;
    const humorValue = signals ? ema(state.humor, signals.humorSample, 0.2) : state.humor;
    const warmthValue = signals ? ema(state.warmth, signals.warmthSample, 0.2) : state.warmth;

    let brevity = "medium";
    if (chars < 27 || (directness > 0.62 && chars < 58)) brevity = "short";
    else if (chars > 92 && directness < 0.58) brevity = "long";

    return {
      brevity,
      humor: Math.round(clamp(humorValue * 4.2, 0, 3)),
      warmth: Math.round(clamp(warmthValue * 4.4, 0, 3)),
      directness: Number(clamp(directness).toFixed(2)),
      emoji: Number(clamp(state.emoji).toFixed(2)),
      formality: Number(clamp(state.formality).toFixed(2)),
      dialect: Number(clamp(state.dialect).toFixed(2)),
      samples: state.samples
    };
  }

  function enrichPayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    const result = commit(payload.message || "");
    const style = getStyleProfile(result.signals);
    if (result.signals.serious) {
      style.humor = 0;
      style.warmth = Math.max(2, style.warmth);
    }

    let enriched = {
      ...payload,
      styleProfile: { ...(payload.styleProfile || {}), ...style }
    };
    if (window.BellaBrainV2?.enrichPayload) enriched = window.BellaBrainV2.enrichPayload(enriched);
    if (window.BellaMemoryV3?.enrichPayload) enriched = window.BellaMemoryV3.enrichPayload(enriched);
    return enriched;
  }

  function cleanNodeText(node) {
    if (!node) return "";
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".vnext-time,.source-row,.bella-error-actions").forEach(x => x.remove());
    return (copy.innerText || copy.textContent || "").trim();
  }

  function observeMessages() {
    if (observer) return;
    const box = document.getElementById("box");
    if (!box) return;

    const take = node => {
      if (!(node instanceof HTMLElement) || !node.classList.contains("m") || !node.classList.contains("user")) return;
      queueMicrotask(() => commit(cleanNodeText(node)));
    };

    box.querySelectorAll(".m.user").forEach(take);
    observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) take(node);
    });
    observer.observe(box, { childList: true });
  }

  function snapshot() {
    return { samples: state.samples, style: getStyleProfile() };
  }

  window.BellaPersonality = Object.freeze({ analyze, commit, enrichPayload, getStyleProfile, snapshot });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observeMessages, { once: true });
  else observeMessages();
})();
