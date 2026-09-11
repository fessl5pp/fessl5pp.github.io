(() => {
  "use strict";

  const KEY = "bella_brain_v2";
  const MAX_DAYS = 30;
  const defaults = {
    version: 4,
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
      next.version = 4;
      return next;
    } catch { return { ...defaults }; }
  }

  function save() {
    state.activeDays = [...new Set(Array.isArray(state.activeDays) ? state.activeDays : [])].slice(-MAX_DAYS);
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  function clamp100(value) { return Math.max(0, Math.min(100, Math.round(Number(value) || 0))); }

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

  function correctionKind(message) {
    const text = norm(message);
    if (/فهمتي غلط|غلط/.test(text)) return "explicit_wrong";
    if (/قصدي|لا اقصد/.test(text)) return "clarification";
    if (/لا مو|مو جذي/.test(text)) return "negation";
    return "correction";
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
    if (/لا مو|قصدي|غلط|مو جذي|فهمتي غلط|لا اقصد/.test(text)) return { intent: "correction", serious, shortFollowup: true, correctionKind: correctionKind(raw) };
    if (/شنو رايج|شرايج|وش رايك|رايج شنو/.test(text)) return { intent: "opinion", serious, shortFollowup: false };
    if (/^(اي|ايي|لا|اوكي|تمام|زين|صح|بالضبط|جذي|هو|هي|هذي|هذا|ليش|شلون)$/.test(text)) return { intent: "followup_short", serious, shortFollowup: true };
    if (/^(ابي|أبي|عطني|عطيني|سو|سوي|قولي|اشرحي|اشرح|ترجم|اكتب)/.test(text)) return { intent: "request", serious, shortFollowup: false };
    if (/[؟?]$/.test(raw) || /^(شنو|ليش|شلون|وين|متى|منو|كم|هل|وش)/.test(text)) return { intent: "question", serious, shortFollowup: words <= 4 };
    if (/😂|🤣|هههه|ككك|امزح|اطقطق/.test(raw)) return { intent: "playful", serious, shortFollowup: false };
    return { intent: serious ? "serious" : "chat", serious, shortFollowup: words <= 3 };
  }

  function relationshipVector() {
    const messages = Math.max(0, Number(state.messages) || 0);
    const days = Array.isArray(state.activeDays) ? state.activeDays.length : 0;
    const affection = Math.max(0, Number(state.affectionSignals) || 0);
    const playful = Math.max(0, Number(state.playfulSignals) || 0);
    const corrections = Math.max(0, Number(state.correctionSignals) || 0);
    const vents = Math.max(0, Number(state.ventSignals) || 0);

    return {
      familiarity: clamp100(messages * 0.62 + days * 6.2 + Math.min(12, corrections) * 0.35),
      warmth: clamp100(affection * 6.4 + vents * 2.1 + days * 1.4 + Math.min(70, messages) * 0.12),
      playfulness: clamp100(playful * 6.2 + affection * 1.25 + Math.min(80, messages) * 0.1)
    };
  }

  function relationshipScore() {
    const vector = relationshipVector();
    return clamp100(vector.familiarity * 0.58 + vector.warmth * 0.27 + vector.playfulness * 0.15);
  }

  function relationshipSnapshot() {
    const messages = Math.max(0, Number(state.messages) || 0);
    const days = Array.isArray(state.activeDays) ? state.activeDays.length : 0;
    const vector = relationshipVector();
    const score = relationshipScore();
    let stage = "new";
    let label = "تو نعرف بعض";

    if (vector.familiarity >= 14 || messages >= 10 || days >= 2) { stage = "familiar"; label = "نعرف بعض"; }
    if ((vector.familiarity >= 34 && Math.max(vector.warmth, vector.playfulness) >= 8) || messages >= 32 || days >= 4) { stage = "friends"; label = "من الربع"; }
    if ((vector.familiarity >= 68 && Math.max(vector.warmth, vector.playfulness) >= 22 && days >= 5) || (messages >= 110 && days >= 4)) { stage = "close"; label = "قريب من بيلا"; }

    const teasingLevel = stage === "new" ? 0 : vector.playfulness >= 55 ? 3 : vector.playfulness >= 18 || stage === "friends" || stage === "close" ? 2 : 1;
    const warmthLevel = vector.warmth >= 45 || stage === "close" ? 3 : vector.warmth >= 12 || stage === "friends" ? 2 : 1;

    return {
      stage,
      label,
      score,
      vector,
      teasingLevel,
      warmthLevel,
      messages,
      activeDays: days,
      affectionSignals: Number(state.affectionSignals || 0),
      playfulSignals: Number(state.playfulSignals || 0),
      correctionSignals: Number(state.correctionSignals || 0),
      ventSignals: Number(state.ventSignals || 0)
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
      if (info.intent === "correction") {
        const relationship = relationshipSnapshot();
        queueMicrotask(() => window.BellaQualityV23?.recordCorrection?.(info.correctionKind || "correction", relationship));
      }
    }
    return info;
  }

  function applyRelationshipStyle(styleProfile, intent, relationship) {
    const style = { ...(styleProfile || {}) };
    const currentHumor = Math.max(0, Math.min(3, Number(style.humor) || 0));
    const currentWarmth = Math.max(0, Math.min(3, Number(style.warmth) || 0));
    const vector = relationship?.vector || { familiarity: 0, warmth: 0, playfulness: 0 };

    if (intent.serious) {
      style.humor = 0;
      style.warmth = Math.max(2, currentWarmth);
      return style;
    }

    const humorFloor = vector.playfulness >= 55 ? 2 : vector.playfulness >= 18 ? 1 : 0;
    const warmthFloor = vector.warmth >= 45 ? 2 : vector.warmth >= 12 ? 1 : 0;
    style.humor = Math.max(humorFloor, Math.min(3, currentHumor + (relationship.stage === "close" ? 1 : 0)));
    style.warmth = Math.max(1, warmthFloor, Math.min(3, currentWarmth));
    if (relationship.stage === "new") style.humor = Math.min(1, style.humor);
    return style;
  }

  function enrichPayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    const intent = record(payload.message || "");
    const relationship = relationshipSnapshot();
    const styleProfile = applyRelationshipStyle(payload.styleProfile, intent, relationship);
    const vector = relationship.vector;
    return {
      ...payload,
      styleProfile,
      relationship: `${relationship.label} | تعارف ${vector.familiarity}/100 | دفا ${vector.warmth}/100 | مزح ${vector.playfulness}/100`,
      relationshipVector: { ...vector, stage: relationship.stage },
      brainContext: {
        intent: intent.intent,
        shortFollowup: intent.shortFollowup,
        serious: intent.serious,
        relationshipStage: relationship.stage,
        relationshipLabel: relationship.label,
        relationshipScore: relationship.score,
        relationshipVector: { ...vector },
        teasingLevel: intent.serious ? 0 : relationship.teasingLevel,
        warmthLevel: relationship.warmthLevel,
        assumeRomance: false,
        naturalKuwaitiChat: true,
        architecture: "relationship-vector-v23"
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
    return { version: 4, ...relationshipSnapshot(), lastSeenAt: state.lastSeenAt, lastIntent: state.lastIntent };
  }

  const api = Object.freeze({
    classifyIntent,
    correctionKind,
    enrichPayload,
    relationshipSnapshot,
    relationshipVector,
    relationshipScore,
    applyRelationshipStyle,
    record,
    markVisit,
    snapshot
  });

  window.BellaBrainV2 = api;
  window.BellaBrainV23 = api;
})();
