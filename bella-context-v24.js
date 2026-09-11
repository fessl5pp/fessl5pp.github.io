(() => {
  "use strict";

  const STORAGE_KEY = "bella_context_v1";
  const MAX_CONTEXT = 14;
  const RECENT_KEEP = 8;
  const OLDER_KEEP = 6;
  const HALF_LIFE_DAYS = 5;

  const base = window.BellaContext;
  if (!base?.buildHistory || !base?.similarity) return;

  function normalize(value) {
    return String(value || "").toLowerCase()
      .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ؤئ]/g, "ء")
      .replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }

  const conceptGroups = [
    ["coffee", /قهو|كافيه|لاتيه|اسبريسو|كابتشينو|coffee|cafe/],
    ["food", /اكل|مطعم|مجبوس|شاورما|برغر|بيتزا|غدا|عشا|food|restaurant/],
    ["gaming", /ماينكرافت|روبلوكس|لعبه|لعبة|قيم|قيمز|اكس بوكس|بلايستيشن|minecraft|roblox|game|gaming/],
    ["study", /جامعه|جامعة|دكتور|محاضره|محاضرة|اختبار|دراسه|دراسة|تخصص|واجب|study|university/],
    ["work", /دوام|شغل|وظيفه|وظيفة|مدير|راتب|مكتب|work|job/],
    ["tech", /كود|برمجه|برمجة|api|github|vercel|supabase|موقع|سيرفر|database|code|server/],
    ["travel", /سفر|رحله|رحلة|طيران|فندق|مطار|travel|flight|hotel/],
    ["emotion", /زعلان|متضايق|تعبان|خايف|مستانس|فرحان|مقهور|حزين|قلق|sad|happy|worried/],
    ["people", /خوي|صديق|صديقه|صديقة|اهلي|أهلي|اخوي|اختي|friend|brother|sister/],
    ["places", /افنيوز|مارينا|بحر|مجمع|منطقه|منطقة|مكان|كويت|avenues|mall|place/]
  ];

  function concepts(value) {
    const text = normalize(value);
    const out = new Set();
    for (const [key, pattern] of conceptGroups) if (pattern.test(text)) out.add(key);
    return out;
  }

  function conceptSimilarity(a, b) {
    const aa = concepts(a);
    const bb = concepts(b);
    if (!aa.size || !bb.size) return 0;
    let common = 0;
    for (const item of aa) if (bb.has(item)) common++;
    return common / Math.max(aa.size, bb.size);
  }

  function temporalScore(ts, orderRatio = 0) {
    const time = Number(ts || 0);
    if (!Number.isFinite(time) || time <= 0) return Math.max(0, Math.min(1, orderRatio));
    const ageDays = Math.max(0, (Date.now() - time) / 86400000);
    return Math.pow(0.5, ageDays / HALF_LIFE_DAYS);
  }

  function storedTurns() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return Array.isArray(raw?.turns)
        ? raw.turns.filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string").slice(-56)
        : [];
    } catch { return []; }
  }

  function mergeHistory(baseHistory = []) {
    const out = [];
    const push = item => {
      if (!item || !["user", "assistant"].includes(item.role) || !item.content) return;
      const content = String(item.content).trim().slice(0, 900);
      const key = `${item.role}|${normalize(content)}`;
      if (!content || out.slice(-20).some(x => x.key === key)) return;
      out.push({ role: item.role, content, ts: Number(item.ts || 0), key, order: out.length });
    };
    for (const item of storedTurns()) push(item);
    for (const item of Array.isArray(baseHistory) ? baseHistory : []) push(item);
    return out;
  }

  function buildHistory(currentText, baseHistory = []) {
    if (base.isEnabled?.() === false) return Array.isArray(baseHistory) ? baseHistory.slice(-MAX_CONTEXT) : [];
    const current = normalize(currentText);
    const merged = mergeHistory(baseHistory);
    if (merged.length && merged[merged.length - 1].role === "user" && normalize(merged[merged.length - 1].content) === current) merged.pop();
    if (merged.length <= MAX_CONTEXT) return merged.map(({ role, content }) => ({ role, content }));

    const recentStart = Math.max(0, merged.length - RECENT_KEEP);
    const recent = merged.slice(recentStart);
    const older = merged.slice(0, recentStart);
    const ranked = older.map((item, index) => {
      const lexical = base.similarity(currentText, item.content);
      const conceptual = conceptSimilarity(currentText, item.content);
      const temporal = temporalScore(item.ts, (index + 1) / Math.max(1, older.length));
      const userSignal = item.role === "user" ? 0.025 : 0;
      const score = lexical * 0.58 + conceptual * 0.25 + temporal * 0.145 + userSignal;
      return { item, score, lexical, conceptual, temporal };
    })
      .filter(x => x.score >= 0.115 || x.conceptual >= 0.5 || x.lexical >= 0.18)
      .sort((a, b) => b.score - a.score)
      .slice(0, OLDER_KEEP);

    const selected = [...ranked.map(x => x.item), ...recent]
      .sort((a, b) => a.order - b.order)
      .slice(-MAX_CONTEXT)
      .map(({ role, content }) => ({ role, content }));
    return selected.length ? selected : base.buildHistory(currentText, baseHistory);
  }

  const api = Object.freeze({
    ...base,
    buildHistory,
    hybridContextV24: true,
    conceptSimilarity,
    temporalScore,
    diagnostics: () => ({ release: "v24", storedTurns: storedTurns().length, recentKeep: RECENT_KEEP, olderKeep: OLDER_KEEP, halfLifeDays: HALF_LIFE_DAYS })
  });

  window.BellaContextV24 = api;
  window.BellaContext = api;
})();
