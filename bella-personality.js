(() => {
  "use strict";

  const STORAGE_KEY = "bella_personality_v1";
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
    mood: { angry: 0, cute: 0, happy: 0 },
    lastMode: "chill",
    lastUserNorm: "",
    lastSeenAt: 0
  };

  const insults = [
    "غبي", "غبيه", "حمار", "حماره", "كلب", "تيس", "وصخ", "وصخه", "زباله",
    "خرا", "زق", "سامج", "سامجه", "غثيث", "غثيثه", "فاشل", "فاشله", "سخيف", "سخيفه"
  ];
  const thirdPartyCues = ["قال", "قالت", "قالي", "قالتلي", "يقول", "تقول", "خويي", "خويتي", "صاحبي", "صاحبتي", "واحد", "وحده", "فلان", "فلانه", "هو", "هي"];
  const playfulCues = ["امزح", "مزح", "اطقطق", "طقطقه", "قاعد امزح"];
  const affectionCues = ["احبج", "احبچ", "احبك", "اعشقج", "فديتج", "اشتقت لج", "يا بعد جبدي", "يا قلبي", "يا حلاتج", "اموت فيج", "كيوت", "ذربه"];
  const happyCues = ["كفو", "عاش", "وناسه", "مستانس", "نجح", "ضبط", "خوش", "يا سلام", "حلو", "تمام"];
  const apologyCues = ["اسف", "آسف", "سامحيني", "حقج علي", "حقك علي", "لا تزعلين"];
  const seriousCues = ["توفى", "وفاة", "مات", "مستشفى", "عملية", "سرطان", "حادث", "خايف", "خايفه", "مكتئب", "انتحار", "تهديد", "مصيبه", "كارثه", "ضايق صدري", "متضايق", "مضايق", "مشكله كبيره"];
  const directCues = ["ابي", "أبي", "عطني", "عطيني", "سو", "سوي", "قولي", "جاوبي", "اشرحي", "اشرح", "اختصري", "اختصر"];
  const formalCues = ["من فضلك", "لو سمحت", "شكرا", "شكرًا", "يرجى", "هل يمكنك", "أرجو"];
  const dialectCues = ["شلون", "شنو", "شكو", "جذي", "عاد", "عيل", "صج", "وايد", "ابي", "تبي", "ويا", "باجر", "عقب", "اشدعوه", "علامك", "مو"];

  let state = load();
  let observer = null;

  function cloneDefaults() {
    return {
      ...defaults,
      mood: { ...defaults.mood }
    };
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!saved || typeof saved !== "object") return cloneDefaults();
      return {
        ...cloneDefaults(),
        ...saved,
        mood: { ...defaults.mood, ...(saved.mood || {}) }
      };
    } catch {
      return cloneDefaults();
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
    const n = normalize(text);
    return list.some(item => n.includes(normalize(item)));
  }

  function hasInsult(text) {
    const n = normalize(text);
    const words = new Set(n.split(" "));
    return insults.some(word => words.has(normalize(word)));
  }

  function directInsult(text) {
    const n = normalize(text);
    for (const insult of insults) {
      const w = normalize(insult);
      if (n.includes(`يا ${w}`) || n.includes(`انتي ${w}`) || n.includes(`انت ${w}`) || n.includes(`${w} انتي`) || n.includes(`${w} انت`)) return true;
    }
    return hasAny(n, ["قرفتيني", "غثيتيني", "ما تفهمين", "ما تفهم", "انقلعي", "انقلع", "انثبري", "انثبر"]);
  }

  function thirdPartyInsult(text) {
    if (!hasInsult(text)) return false;
    const n = normalize(text);
    return thirdPartyCues.some(cue => n.includes(normalize(cue))) && !directInsult(text);
  }

  function selfInsult(text) {
    if (!hasInsult(text)) return false;
    const n = normalize(text);
    return insults.some(word => n.includes(`انا ${normalize(word)}`));
  }

  function analyze(text) {
    const raw = String(text || "");
    const n = normalize(raw);
    const insult = hasInsult(raw) || hasAny(raw, ["قرفتيني", "غثيتيني", "ما تفهمين", "انقلعي", "انقلع", "انثبري", "انثبر"]);
    const direct = directInsult(raw);
    const quoted = thirdPartyInsult(raw);
    const selfDirected = selfInsult(raw);
    const playful = /😂|🤣|هههه|ككك|😭/.test(raw) || hasAny(raw, playfulCues);
    const affection = hasAny(raw, affectionCues);
    const happy = /😂|🤣|هههه|ككك/.test(raw) || hasAny(raw, happyCues);
    const apology = hasAny(raw, apologyCues);
    const serious = hasAny(raw, seriousCues);

    let angerImpact = 0;
    if (insult && !quoted && !selfDirected) {
      if (direct) angerImpact = playful ? 0.55 : 2.9;
      else angerImpact = playful ? 0.2 : 1.15;
    }

    const chars = Math.min(180, n.length);
    const humorSample = playful || /😂|🤣|هههه|ككك/.test(raw) ? 1 : 0;
    const warmthSample = affection || hasAny(raw, ["مشكور", "تسلمين", "كفو عليج", "ذوق", "حبيبتي"]) ? 1 : 0;
    const directSample = hasAny(raw, directCues) || (n.split(" ").length <= 5 && /^(ابي|عطني|عطيني|سو|سوي|قولي|جاوبي)/.test(n)) ? 1 : 0;
    const emojiSample = /[\u{1F300}-\u{1FAFF}]/u.test(raw) ? 1 : 0;
    const formalSample = hasAny(raw, formalCues) ? 1 : 0;
    const dialectSample = hasAny(raw, dialectCues) ? 1 : 0;

    return {
      norm: n,
      insult,
      directInsult: direct,
      quotedInsult: quoted,
      selfInsult: selfDirected,
      playful,
      affection,
      happy,
      apology,
      serious,
      angerImpact,
      chars,
      humorSample,
      warmthSample,
      directSample,
      emojiSample,
      formalSample,
      dialectSample
    };
  }

  function decideMode(signals) {
    if (signals?.serious) return "chill";
    const { angry, cute, happy } = state.mood;
    if (angry >= 3.4 && angry >= cute + 0.7) return "angry";
    if (cute >= 3.0 && cute >= angry + 0.25) return "cute";
    if (happy >= 2.6 && angry < 2.2) return "auto";

    if (state.lastMode === "angry" && angry >= 2.0) return "angry";
    if (state.lastMode === "cute" && cute >= 1.9) return "cute";
    if (state.lastMode === "auto" && happy >= 1.7 && angry < 1.8) return "auto";
    return "chill";
  }

  function applyMode(mode) {
    if (typeof s !== "undefined") {
      const old = s.mode;
      s.mode = mode;
      if (!Array.isArray(s.modesTried)) s.modesTried = [];
      if (!s.modesTried.includes(mode)) s.modesTried.push(mode);
      if (mode === "angry" && old !== "angry") s.angryUses = (s.angryUses || 0) + 1;
      if (typeof save === "function") {
        try { save(); } catch {}
      }
    }
    if (typeof window.updateMood === "function") {
      try { window.updateMood(); } catch {}
    }
  }

  function commit(text) {
    const signals = analyze(text);
    if (!signals.norm) return { signals, mode: state.lastMode, duplicate: false };

    const now = Date.now();
    const duplicate = state.lastUserNorm === signals.norm && now - Number(state.lastSeenAt || 0) < 8000;
    if (duplicate) return { signals, mode: state.lastMode, duplicate: true };

    state.samples += 1;
    state.emaChars = ema(state.emaChars, signals.chars, 0.14);
    state.humor = ema(state.humor, signals.humorSample, 0.13);
    state.warmth = ema(state.warmth, signals.warmthSample, 0.12);
    state.directness = ema(state.directness, signals.directSample, 0.12);
    state.emoji = ema(state.emoji, signals.emojiSample, 0.1);
    state.formality = ema(state.formality, signals.formalSample, 0.1);
    state.dialect = ema(state.dialect, signals.dialectSample, 0.1);

    state.mood.angry *= signals.serious ? 0.48 : 0.82;
    state.mood.cute *= signals.serious ? 0.68 : 0.84;
    state.mood.happy *= signals.serious ? 0.42 : 0.82;

    state.mood.angry += signals.angerImpact;
    if (signals.affection) state.mood.cute += 2.25;
    if (signals.happy) state.mood.happy += signals.playful && signals.insult ? 0.45 : 1.55;
    if (signals.apology) state.mood.angry -= 1.9;

    state.mood.angry = clamp(state.mood.angry, 0, 8);
    state.mood.cute = clamp(state.mood.cute, 0, 8);
    state.mood.happy = clamp(state.mood.happy, 0, 8);

    state.lastMode = decideMode(signals);
    state.lastUserNorm = signals.norm;
    state.lastSeenAt = now;
    save();
    applyMode(state.lastMode);
    return { signals, mode: state.lastMode, duplicate: false };
  }

  function getStyleProfile(signals = null) {
    const chars = signals ? ema(state.emaChars, signals.chars, 0.2) : state.emaChars;
    const directness = signals ? ema(state.directness, signals.directSample, 0.18) : state.directness;
    let brevity = "medium";
    if (chars < 27 || (directness > 0.62 && chars < 58)) brevity = "short";
    else if (chars > 92 && directness < 0.58) brevity = "long";

    const humorValue = signals ? ema(state.humor, signals.humorSample, 0.2) : state.humor;
    const warmthValue = signals ? ema(state.warmth, signals.warmthSample, 0.2) : state.warmth;
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
    const text = String(payload.message || "");
    const result = commit(text);
    const style = getStyleProfile(result.signals);
    if (result.signals.serious) {
      style.humor = 0;
      style.warmth = Math.max(2, style.warmth);
    }
    return {
      ...payload,
      mode: result.mode,
      styleProfile: { ...(payload.styleProfile || {}), ...style }
    };
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
    return {
      samples: state.samples,
      style: getStyleProfile(),
      mood: { ...state.mood },
      mode: state.lastMode
    };
  }

  window.BellaPersonality = Object.freeze({
    analyze,
    commit,
    enrichPayload,
    getStyleProfile,
    snapshot
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", observeMessages, { once: true });
  else observeMessages();
})();
