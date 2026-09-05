(() => {
  "use strict";

  const KEY = "bella_memory_session_v3";
  const VNEXT_KEY = "bella_vnext_v2";
  const MAX_TRANSIENT = 4;
  const blocked = /مرض|تشخيص|دواء|علاج|دين|مذهب|سياس|حزب|جنس|كلمة مرور|باسورد|رقم مدني|بطاقة|حساب بنكي|سر/i;

  let state = load();

  function load() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
      return saved && typeof saved === "object" ? { transient: [], ...saved } : { transient: [] };
    } catch { return { transient: [] }; }
  }

  function save() {
    state.transient = (Array.isArray(state.transient) ? state.transient : []).slice(-MAX_TRANSIENT);
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }

  function clean(value, max = 150) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function norm(value) {
    return clean(value, 300).toLowerCase().replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[؟?!.,،؛:]/g, " ").replace(/\s+/g, " ").trim();
  }

  function isSafe(value) {
    const text = clean(value);
    return Boolean(text && text.length >= 3 && !blocked.test(text));
  }

  function transientFact(message) {
    const raw = clean(message, 180);
    const n = norm(raw);
    if (!isSafe(raw)) return "";
    if (/^(الحين|اليوم|توني|توّي|قاعد|قاعدة|بروح|بطلع|انا الحين|أنا الحين)/.test(n)) return raw;
    if (/ الحين | اليوم | توّي | توني /.test(` ${n} `) && raw.length <= 120) return raw;
    return "";
  }

  function rememberTransient(message) {
    const fact = transientFact(message);
    if (!fact) return false;
    const key = norm(fact);
    state.transient = state.transient.filter(item => norm(item.text) !== key);
    state.transient.push({ text: fact, at: Date.now() });
    state.transient = state.transient.filter(item => Date.now() - Number(item.at || 0) < 8 * 60 * 60 * 1000).slice(-MAX_TRANSIENT);
    save();
    return true;
  }

  function explicitRemember(message) {
    const raw = clean(message, 220);
    const match = raw.match(/(?:تذكري|احفظي|حفظي|لا تنسين)\s+(?:ان|إن|اني|إني)?\s*(.{3,140})/i);
    if (!match) return "";
    const fact = clean(match[1], 140);
    return isSafe(fact) ? fact : "";
  }

  function addGuestMemory(text) {
    try {
      const data = JSON.parse(localStorage.getItem(VNEXT_KEY) || "{}") || {};
      const memory = Array.isArray(data.memory) ? data.memory : [];
      const key = norm(text);
      if (!memory.some(item => norm(item) === key)) memory.push(clean(text, 140));
      data.memory = memory.slice(-12);
      localStorage.setItem(VNEXT_KEY, JSON.stringify(data));
      return true;
    } catch { return false; }
  }

  function saveExplicit(message) {
    const fact = explicitRemember(message);
    if (!fact) return false;
    queueMicrotask(async () => {
      try {
        if (window.BellaAccount?.isSignedIn?.() && window.BellaAccountMemory?.remember) await window.BellaAccountMemory.remember(fact);
        else addGuestMemory(fact);
      } catch {}
    });
    return true;
  }

  function enrichPayload(payload) {
    if (!payload || typeof payload !== "object") return payload;
    const message = payload.message || "";
    rememberTransient(message);
    saveExplicit(message);
    const now = Date.now();
    const active = state.transient
      .filter(item => now - Number(item.at || 0) < 8 * 60 * 60 * 1000)
      .map(item => clean(item.text))
      .filter(Boolean)
      .slice(-MAX_TRANSIENT);
    const memory = Array.isArray(payload.memory) ? payload.memory.slice(-12) : [];
    for (const fact of active) memory.push(`مؤقت للجلسة فقط: ${fact}`);
    return { ...payload, memory: memory.slice(-16), memoryLayer: { transientCount: active.length, policy: "durable-vs-session-v3" } };
  }

  function clearSession() {
    state = { transient: [] };
    save();
  }

  function snapshot() {
    return { transient: state.transient.map(item => item.text), policy: "temporary facts stay in sessionStorage; explicit durable memory uses Bella memory" };
  }

  window.BellaMemoryV3 = Object.freeze({ enrichPayload, rememberTransient, explicitRemember, clearSession, snapshot });
})();
