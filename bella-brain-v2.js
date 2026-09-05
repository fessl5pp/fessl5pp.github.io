(() => {
  "use strict";

  const KEY = "bella_brain_v2";
  const MAX_DAYS = 30;
  const defaults = {
    version: 3,
    messages: 0,
    activeDays: [],
    firstSeenAt: Date.now(),
    lastSeenAt: 0,
    lastMessageAt: 0,
    lastNorm: "",
    lastIntent: "new",
    affectionSignals: 0,
    playfulSignals: 0,
    correctionSignals: 0,
    ventSignals: 0
  };

  let state = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      const next = saved && typeof saved === "object" ? { ...defaults, ...saved } : { ...defaults };
      next.version = 3;
      return next;
    } catch { return { ...defaults }; }
  }

  function save() {
    state.activeDays = [...new Set(Array.isArray(state.activeDays) ? state.activeDays : [])].slice(-MAX_DAYS);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[ؤئ]/g, "ء")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function classifyIntent(message) {
    const raw = String(message || "").trim();
    const text = norm(raw);
    const words = text ? text.split(" ").length : 0;
    const serious = /وفاة|مات|مستشفى|عملية|سرطان|حادث|انتحار|تهديد|نزيف|طوارئ|مكتئب|ضايق صدري|خايف/.test(text);
    if (!text) return { intent: "empty", serious, shortFollowup: false };
    if (/^(هلا|هلو|هاي|سلام|السلام عليكم|شلونج|شلونك|صباح الخير|مساء الخير)$/.test(text)) return { intent: "greeting", serious, shortFollowup: false };
    if (/احبج|احبچ|اشتقتلج|اشتقت لج|فديتج|بوسيني|حضنيني|اعشقج/.test(text)) return { intent: "affection", serious, shortFollowup: false };
    if (/زعلت|متضايق|تعبت|مقهور|طفشت|مالي خلق|مالي خلك/.test(text)) return { intent: "vent", serious, shortFollowup: words <= 6 };
    if (/لا مو|قصدي|غلط|مو جذي|فهمتي غلط|لا اقصد/.test(text)) return { intent: "correction", serious, shortFollowup: true };
    if (/شنو رايج|شرايج|وش رايك|رايج شنو/.test(text)) return { intent: "opinion", serious, shortFollowup: false };
    if (/^(اي|ايي|لا|اوكي|تمام|زين|صح|بالضبط|جذي|هو|هي|هذي|هذا|ليش|شلون)$/.test(text)) return { intent: "followup_short", serious, shortFollowup: true };
    if (/^(ابي|أبي|عطني|عطيني|سو|سوي|قولي|اشرحي|اشرح|ترجم|اكتب)/.test(text)) return { intent: "request", serious, shortFollowup: false };
    if (/[؟?]$/.test(raw) || /^(شنو|ليش|شلون|وين|متى|منو|كم|هل|وش)/.test(text)) return { intent: "question", serious, shortFollowup: words <= 4 };
    if (/😂|🤣|هههه|ككك|امزح|اطقطق/.test(raw)) return { intent: "playful", serious, shortFollowup: false };
    return { intent: serious ? "serious" : "chat", serious, shortFollowup: words <= 3 };
  }

  function relationshipScore() {
    const messages = Math.max(0, Number(state.messages) || 0);
    const days = Array.isArray(state.activeDays) ? state.activeDays.length : 0;
    const affection = Math.max(0, Number(state.affectionSignals) || 0);
    const playful = Math.max(0, Number(state.playfulSignals) || 0);
    const corrections = Math.max(0, Number(state.correctionSignals) || 0);
    const raw = messages * 0.5 + days * 4.8 + affection * 1.7 + playful * 1.15 + Math.min(8, corrections) * 0.35;
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  function relationshipSnapshot() {
    const messages = Math.max(0, Number(state.messages) || 0);
    const days = Array.isArray(state.activeDays) ? state.activeDays.length : 0;
    const score = relationshipScore();
    let stage = "new";
    let label = "تو نعرف بعض";
    let teasingLevel = 0;
    let warmthLevel = 1;

    if (score >= 12 || messages >= 10 || days >= 2) {
      stage = "familiar";
      label = "نعرف بعض";
      teasingLevel = 1;
      warmthLevel = 1;
    }
    if (score >= 32 || messages >= 32 || days >= 4) {
      stage = "friends";
      label = "من الربع";
      teasingLevel = 2;
      warmthLevel = 2;
    }
    if ((score >= 65 && messages >= 55 && days >= 5) || (messages >= 100 && days >= 4)) {
      stage = "close";
      label = "قريب من بيلا";
      teasingLevel = 3;
      warmthLevel = 2;
    }

    return {
      stage,
      label,
      score,
      teasingLevel,
      warmthLevel,
      messages,
      activeDays: days,
      affectionSignals: Number(state.affectionSignals || 0),
      playfulSignals: Number(state.playfulSignals || 0)
    };
  }

  function record(message) {
    const n = norm(message);
    if (!n) return classifyIntent(message);
    const now = Date.now();
    const duplicate = state.lastNorm === n && now - Number(state.lastMessageAt || 0) < 5000;
    const info = classifyIntent(message);
    if (!duplicate) {
      state.messages += 1;
      state.lastNorm = n;
      state.lastMessageAt = now;
      state.lastIntent = info.intent;
      if (info.intent === "affection") state.affectionSignals = Math.min(1000, Number(state.affectionSignals || 0) + 1);
      if (info.intent === "playful") state.playfulSignals = Math.min(1000, Number(state.playfulSignals || 0) + 1);
      if (info.intent === "correction") state.correctionSignals = Math.min(1000, Number(state.correctionSignals || 0) + 1);
      if (info.intent === "vent") state.ventSignals = Math.min(1000, Number(state.ventSignals || 0) + 1);
      const day = todayKey();
      if (!state.activeDays.includes(day)) state.activeDays.push(day);
      save();
    }
    return info;
  }

  function applyRelationshipStyle(styleProfile, intent, relationship) {
    const style = { ...(styleProfile || {}) };
    const currentHumor = Math.max(0, Math.min(3, Number(style.humor) || 0));
    const currentWarmth = Math.max(0, Math.min(3, Number(style.warmth) || 0));

    if (intent.serious) {
      style.humor = 0;
      style.warmth = Math.max(2, currentWarmth);
      return style;
    }

    if (relationship.stage === "new") {
      style.humor = Math.min(1, currentHumor);
      style.warmth = Math.max(1, currentWarmth);
    } else if (relationship.stage === "familiar") {
      style.humor = Math.max(1, Math.min(2, currentHumor));
      style.warmth = Math.max(1, currentWarmth);
    } else if (relationship.stage === "friends") {
      style.humor = Math.max(1, Math.min(3, currentHumor + 1));
      style.warmth = Math.max(1, currentWarmth);
    } else if (relationship.stage === "close") {
      style.humor = Math.max(2, currentHumor);
      style.warmth = Math.max(2, currentWarmth);
    }
    return style;
  }

  function enrichPayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    const intent = record(payload.message || "");
    const relationship = relationshipSnapshot();
    const styleProfile = applyRelationshipStyle(payload.styleProfile, intent, relationship);
    return {
      ...payload,
      styleProfile,
      relationship: `${relationship.label} | قرب ${relationship.score}/100 | نغزة ${intent.serious ? 0 : relationship.teasingLevel}/3`,
      brainContext: {
        intent: intent.intent,
        shortFollowup: intent.shortFollowup,
        serious: intent.serious,
        relationshipStage: relationship.stage,
        relationshipLabel: relationship.label,
        relationshipScore: relationship.score,
        teasingLevel: intent.serious ? 0 : relationship.teasingLevel,
        warmthLevel: relationship.warmthLevel,
        assumeRomance: false,
        naturalKuwaitiChat: true
      }
    };
  }

  function markVisit() {
    const previous = Number(state.lastSeenAt || 0);
    state.lastSeenAt = Date.now();
    const day = todayKey();
    if (!state.activeDays.includes(day)) state.activeDays.push(day);
    save();
    return previous;
  }

  function snapshot() {
    return { version: 3, ...relationshipSnapshot(), lastSeenAt: state.lastSeenAt, lastIntent: state.lastIntent };
  }

  window.BellaBrainV2 = Object.freeze({
    classifyIntent,
    enrichPayload,
    relationshipSnapshot,
    relationshipScore,
    applyRelationshipStyle,
    record,
    markVisit,
    snapshot
  });
})();
