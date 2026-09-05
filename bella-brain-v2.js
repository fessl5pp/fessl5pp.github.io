(() => {
  "use strict";

  const KEY = "bella_brain_v2";
  const MAX_DAYS = 30;
  const defaults = {
    version: 2,
    messages: 0,
    activeDays: [],
    firstSeenAt: Date.now(),
    lastSeenAt: 0,
    lastMessageAt: 0,
    lastNorm: "",
    lastIntent: "new",
    affectionSignals: 0,
    playfulSignals: 0
  };

  let state = load();

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null");
      return saved && typeof saved === "object" ? { ...defaults, ...saved } : { ...defaults };
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

  function relationshipSnapshot() {
    const messages = Math.max(0, Number(state.messages) || 0);
    const days = Array.isArray(state.activeDays) ? state.activeDays.length : 0;
    let stage = "new";
    let label = "تو نعرف بعض";
    if (messages >= 8 || days >= 2) { stage = "familiar"; label = "نعرف بعض"; }
    if (messages >= 25 || days >= 4) { stage = "friends"; label = "من الربع"; }
    if (messages >= 80 && days >= 7) { stage = "close"; label = "قريب من بيلا"; }
    return { stage, label, messages, activeDays: days, affectionSignals: state.affectionSignals || 0 };
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
      const day = todayKey();
      if (!state.activeDays.includes(day)) state.activeDays.push(day);
      save();
    }
    return info;
  }

  function enrichPayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    const intent = record(payload.message || "");
    const relationship = relationshipSnapshot();
    return {
      ...payload,
      relationship: relationship.label,
      brainContext: {
        intent: intent.intent,
        shortFollowup: intent.shortFollowup,
        serious: intent.serious,
        relationshipStage: relationship.stage,
        relationshipLabel: relationship.label,
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
    return { version: 2, ...relationshipSnapshot(), lastSeenAt: state.lastSeenAt, lastIntent: state.lastIntent };
  }

  window.BellaBrainV2 = Object.freeze({ classifyIntent, enrichPayload, relationshipSnapshot, record, markVisit, snapshot });
})();
