(() => {
  "use strict";

  const base = window.BellaMemoryV4 || window.BellaMemoryV3;
  if (!base?.enrichPayload) return;

  const MAX_WORKING_DURABLE = 12;
  const MAX_CLOUD_MEMORY = 48;

  function clean(value, max = 180) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function normalize(value) {
    return clean(value, 260).toLowerCase()
      .replace(/[أإآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").replace(/[ؤئ]/g, "ء")
      .replace(/[؟?!.,،؛:]/g, " ").replace(/\s+/g, " ").trim();
  }

  function subjectKey(value) {
    return normalize(value)
      .replace(/^(?:ان|اني|اني|انا)\s+/, "")
      .replace(/\b(?:مره|وايد|جدا|جداً|حيل|صج)\b/g, " ")
      .replace(/\s+/g, " ").trim().slice(0, 72);
  }

  function analyzeMemory(value) {
    const text = clean(value, 160);
    const n = normalize(text);
    let category = "general";
    let topicKey = "";
    let polarity = 0;
    let importance = Number(base.importance?.(text) || 60);

    let match = n.match(/^اسمي\s+(.{2,60})$/);
    if (match) {
      category = "identity";
      topicKey = "identity:name";
      importance = 98;
    } else if ((match = n.match(/^(?:عمري|العمر عندي)\s+(.{1,30})$/))) {
      category = "identity";
      topicKey = "identity:age";
      importance = 92;
    } else if ((match = n.match(/^(?:تخصصي|ادرس|قاعد ادرس)\s+(.{2,80})$/))) {
      category = "education";
      topicKey = "education:study";
      importance = 90;
    } else if ((match = n.match(/^(?:وظيفتي|اشتغل|قاعد اشتغل)\s+(.{2,80})$/))) {
      category = "work";
      topicKey = "work:job";
      importance = 90;
    } else if ((match = n.match(/^(?:ما احب|ماحب|ما افضل|مافضل|اكره|مو عاجبني)\s+(.{2,90})$/))) {
      const subject = subjectKey(match[1]);
      category = "preference";
      topicKey = subject ? `preference:${subject}` : "";
      polarity = -1;
      importance = Math.max(78, importance);
    } else if ((match = n.match(/^(?:احب|افضل|يعجبني)\s+(.{2,90})$/))) {
      const subject = subjectKey(match[1]);
      category = "preference";
      topicKey = subject ? `preference:${subject}` : "";
      polarity = 1;
      importance = Math.max(78, importance);
    } else {
      if (/ماينكرافت|روبلوكس|فورتنايت|العاب|العب/.test(n)) category = "gaming";
      else if (/قهو|ماتشا|شاي|مجبوس|شاورما|مطعم|اكل/.test(n)) category = "food";
      else if (/افنيوز|مارينا|بحر|مكان|منطقه|طلعه/.test(n)) category = "places";
    }

    if (/(?:اليوم|الحين|الان|باجر|هالاسبوع|هذا الاسبوع)/.test(n)) importance = Math.min(importance, 48);

    return {
      text,
      category,
      topicKey: clean(topicKey, 120),
      polarity,
      importance: Math.max(20, Math.min(100, Math.round(importance))),
      confidence: 92,
      explicit: true
    };
  }

  function memoryKey(value) {
    return normalize(value).slice(0, 180);
  }

  function distillMemoryList(items, max = MAX_WORKING_DURABLE) {
    const source = (Array.isArray(items) ? items : []).map(item => clean(item)).filter(Boolean);
    const newest = [];
    const seenTopics = new Set();
    const seenExact = new Set();

    for (let index = source.length - 1; index >= 0; index--) {
      const text = source[index];
      const exact = memoryKey(text);
      if (!exact || seenExact.has(exact)) continue;
      seenExact.add(exact);

      const meta = analyzeMemory(text);
      if (meta.topicKey) {
        if (seenTopics.has(meta.topicKey)) continue;
        seenTopics.add(meta.topicKey);
      }
      newest.push({ text, index, meta });
    }

    const shortlist = newest
      .map(row => ({
        ...row,
        score: row.meta.importance * 0.72 + (row.index / Math.max(1, source.length - 1)) * 28
      }))
      .sort((a, b) => b.score - a.score || b.index - a.index)
      .slice(0, Math.max(1, max))
      .sort((a, b) => a.index - b.index)
      .map(row => row.text);

    return shortlist;
  }

  function enrichPayload(payload) {
    const enriched = base.enrichPayload(payload);
    if (!enriched || typeof enriched !== "object") return enriched;
    const all = Array.isArray(enriched.memory) ? enriched.memory : [];
    const transient = all.filter(item => String(item || "").startsWith("مؤقت للجلسة فقط:"));
    const durable = all.filter(item => !String(item || "").startsWith("مؤقت للجلسة فقط:"));
    const working = distillMemoryList(durable, MAX_WORKING_DURABLE);
    return {
      ...enriched,
      memory: [...working, ...transient.slice(-4)].slice(-16),
      memoryLayer: {
        ...(enriched.memoryLayer || {}),
        version: "v5",
        topicAware: true,
        contradictionAware: true,
        durableInput: durable.length,
        durableWorkingSet: working.length,
        cloudCapacity: MAX_CLOUD_MEMORY,
        temporalDecay: "confirmation-recency + semantic-retrieval-decay"
      }
    };
  }

  const api = Object.freeze({
    ...base,
    enrichPayload,
    distillMemoryList,
    analyzeMemory,
    maxCloudMemory: MAX_CLOUD_MEMORY,
    maxWorkingDurable: MAX_WORKING_DURABLE,
    policy: "explicit durable facts only; topic-aware newest fact wins; contradictions are superseded, not silently merged; sensitive memory remains blocked",
    version: 5
  });

  window.BellaMemoryV5 = api;
  window.BellaMemoryV4 = api;
  window.BellaMemoryV3 = api;
})();
