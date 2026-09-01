(() => {
  "use strict";

  const STORAGE_KEY = "bella_context_v1";
  const SETTINGS_KEY = "bella_ui_settings_v1";
  const MAX_TURNS = 48;
  const MAX_CONTENT = 700;
  const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

  const errorPhrases = [
    "بيلا تكتب",
    "النت أو السيرفر طول شوي",
    "النت مقطوع الحين",
    "الربط مع الذكاء الاصطناعي تعطل شوي",
    "بيلا ما رجعت رد هالمرة",
    "صار شي بالربط الحين",
    "الواير لعب فيني",
    "بيلا تعيد المحاولة"
  ];

  const stopWords = new Set([
    "انا", "انت", "انتي", "هو", "هي", "هذا", "هذي", "هاذا", "اللي", "الي", "في", "من", "على", "عن",
    "مع", "ويا", "بس", "عاد", "يعني", "او", "ولا", "اي", "ايه", "مو", "ما", "لا", "ابي", "تبي", "شنو", "وش",
    "شلون", "كيف", "ليش", "صار", "صارت", "جذي", "كذا", "ترى", "والله", "صج", "مره", "مرة"
  ]);

  let state = load();
  let observer = null;

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

  function settings() {
    try {
      return { longContext: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch {
      return { longContext: true };
    }
  }

  function enabled() {
    return settings().longContext !== false;
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      const now = Date.now();
      const turns = Array.isArray(raw?.turns)
        ? raw.turns
            .filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string")
            .filter(x => !x.ts || now - Number(x.ts) < RETENTION_MS)
            .slice(-MAX_TURNS)
        : [];
      return { version: 1, turns };
    } catch {
      return { version: 1, turns: [] };
    }
  }

  function save() {
    if (!enabled()) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }

  function clear() {
    state = { version: 1, turns: [] };
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  function setEnabled(next) {
    if (!next) {
      clear();
      return;
    }
    save();
  }

  function tokens(value) {
    return normalize(value)
      .split(" ")
      .filter(x => x.length > 1 && !stopWords.has(x));
  }

  function trigramSet(value) {
    const text = normalize(value).replace(/\s+/g, " ");
    const out = new Set();
    if (text.length < 3) {
      if (text) out.add(text);
      return out;
    }
    for (let i = 0; i <= text.length - 3; i++) out.add(text.slice(i, i + 3));
    return out;
  }

  function setSimilarity(a, b) {
    if (!a.size || !b.size) return 0;
    let common = 0;
    for (const item of a) if (b.has(item)) common++;
    return common / Math.max(1, a.size + b.size - common);
  }

  function similarity(a, b) {
    const na = normalize(a);
    const nb = normalize(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    if (na.length >= 8 && (na.includes(nb) || nb.includes(na))) {
      const ratio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
      if (ratio >= 0.72) return Math.max(0.86, ratio);
    }
    const wordScore = setSimilarity(new Set(tokens(na)), new Set(tokens(nb)));
    const charScore = setSimilarity(trigramSet(na), trigramSet(nb));
    return Math.min(1, wordScore * 0.62 + charScore * 0.38);
  }

  function isNoise(role, text) {
    const clean = String(text || "").trim();
    if (!clean) return true;
    if (role === "assistant" && errorPhrases.some(x => clean.includes(x))) return true;
    return false;
  }

  function isClearCommand(text) {
    const n = normalize(text);
    return ["انس كل شي", "انسي كل شي", "امسحي ذاكرتج", "امسح الذاكره", "امسحي الذاكره"].some(x => n.includes(normalize(x)));
  }

  function recordTurn(role, text) {
    if (!enabled()) return;
    if (role !== "user" && role !== "assistant") return;
    const clean = String(text || "").replace(/\s+/g, " ").trim().slice(0, MAX_CONTENT);
    if (role === "user" && isClearCommand(clean)) {
      clear();
      return;
    }
    if (isNoise(role, clean)) return;

    const last = state.turns[state.turns.length - 1];
    if (last && last.role === role && normalize(last.content) === normalize(clean)) return;

    state.turns.push({ role, content: clean, ts: Date.now() });
    state.turns = state.turns.slice(-MAX_TURNS);
    save();
  }

  function cleanNodeText(node) {
    if (!node) return "";
    const copy = node.cloneNode(true);
    copy.querySelectorAll(".vnext-time,.source-row,.bella-error-actions").forEach(x => x.remove());
    return (copy.innerText || copy.textContent || "").trim();
  }

  function observeMessages() {
    if (observer || !enabled()) return;
    const box = document.getElementById("box");
    if (!box) return;

    const take = node => {
      if (!(node instanceof HTMLElement) || !node.classList.contains("m")) return;
      const role = node.classList.contains("user") ? "user" : node.classList.contains("bot") ? "assistant" : null;
      if (!role) return;
      queueMicrotask(() => recordTurn(role, cleanNodeText(node)));
    };

    box.querySelectorAll(".m").forEach(take);
    observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) take(node);
    });
    observer.observe(box, { childList: true });
  }

  function mergeBaseHistory(baseHistory) {
    const merged = state.turns.map((x, i) => ({ role: x.role, content: x.content, order: i }));
    let order = merged.length;
    for (const item of Array.isArray(baseHistory) ? baseHistory : []) {
      if (!item || !["user", "assistant"].includes(item.role) || !item.content) continue;
      const content = String(item.content).trim().slice(0, MAX_CONTENT);
      if (isNoise(item.role, content)) continue;
      const recentMatch = merged.slice(-18).some(x => x.role === item.role && normalize(x.content) === normalize(content));
      if (!recentMatch) merged.push({ role: item.role, content, order: order++ });
    }
    return merged;
  }

  function buildHistory(currentText, baseHistory = []) {
    if (!enabled()) return Array.isArray(baseHistory) ? baseHistory.slice(-14) : [];

    let merged = mergeBaseHistory(baseHistory);
    const current = normalize(currentText);
    if (merged.length && merged[merged.length - 1].role === "user" && normalize(merged[merged.length - 1].content) === current) merged.pop();
    if (merged.length <= 14) return merged.map(({ role, content }) => ({ role, content: content.slice(0, 900) }));

    const recentStart = Math.max(0, merged.length - 10);
    const recent = merged.slice(recentStart);
    const older = merged.slice(0, recentStart);
    const ranked = older
      .map((item, index) => ({
        item,
        index,
        score: similarity(currentText, item.content) + (item.role === "user" ? 0.035 : 0) + (index / Math.max(1, older.length)) * 0.035
      }))
      .filter(x => x.score >= 0.12)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const selected = [...ranked.map(x => x.item), ...recent]
      .sort((a, b) => a.order - b.order)
      .slice(-14);

    return selected.map(({ role, content }) => ({ role, content: content.slice(0, 900) }));
  }

  function getRecentReplies(baseReplies = []) {
    if (!enabled()) return Array.isArray(baseReplies) ? baseReplies.slice(-8) : [];
    const candidates = [
      ...state.turns.filter(x => x.role === "assistant").map(x => x.content),
      ...(Array.isArray(baseReplies) ? baseReplies : [])
    ].filter(Boolean);

    const unique = [];
    for (let i = candidates.length - 1; i >= 0 && unique.length < 10; i--) {
      const value = String(candidates[i]).slice(0, 260);
      if (isNoise("assistant", value)) continue;
      if (unique.some(existing => similarity(existing, value) >= 0.82)) continue;
      unique.push(value);
    }
    return unique.reverse().slice(-8);
  }

  function repeatInfo(text) {
    const userTurns = state.turns.filter(x => x.role === "user").slice(-12);
    const scores = userTurns.map(x => similarity(text, x.content)).sort((a, b) => b - a);
    const high = scores.filter(x => x >= 0.92).length;
    const near = scores.filter(x => x >= 0.78).length;
    return { high, near, best: scores[0] || 0, shouldUseAI: high >= 1 || near >= 2 };
  }

  function shouldUseAIForRepeat(text) {
    if (!enabled()) return false;
    return repeatInfo(text).shouldUseAI;
  }

  function addPrivacyNote(modal) {
    if (!modal || modal.querySelector(".bella-context-privacy")) return;
    const card = modal.querySelector(".vnext-card");
    if (!card) return;
    const note = document.createElement("p");
    note.className = "bella-context-privacy";
    note.textContent = "إذا كانت ذاكرة سياق السوالف مفعلة، ينحفظ آخر سياق مختصر محلياً على هالجهاز لمدة محدودة عشان بيلا ما تنسى نص السالفة. تقدر تطفيها من الإعدادات أو تمسح الذاكرة بأي وقت.";
    const button = card.querySelector("button");
    if (button) card.insertBefore(note, button);
    else card.appendChild(note);
  }

  const uiObserver = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof HTMLElement)) continue;
        if (node.id === "bellaPrivacy") addPrivacyNote(node);
      }
    }
  });

  function start() {
    if (!enabled()) clear();
    observeMessages();
    if (document.body) uiObserver.observe(document.body, { childList: true });
  }

  window.BellaContext = Object.freeze({
    buildHistory,
    getRecentReplies,
    repeatInfo,
    shouldUseAIForRepeat,
    similarity,
    recordTurn,
    clear,
    setEnabled,
    isEnabled: enabled,
    size: () => state.turns.length
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
