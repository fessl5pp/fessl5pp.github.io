(() => {
  "use strict";

  const base = window.BellaGameBankV2;
  if (!base) return;

  function uniqueBy(items, keyFn, limit) {
    const seen = new Set();
    const out = [];
    for (const item of Array.isArray(items) ? items : []) {
      const key = String(keyFn(item) || "").trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item);
      if (out.length >= limit) break;
    }
    return Object.freeze(out);
  }

  const rumors = uniqueBy(base.rumors, item => item.text, 200);
  const wisdoms = uniqueBy(base.wisdoms, item => item.text, 100);
  const proverbs = uniqueBy(base.proverbs, item => item.start, 100);
  const boxes = uniqueBy(base.boxes, item => item.answer, 100);
  const kuwaitQuestions = uniqueBy(base.kuwaitQuestions, item => item.q, 100);

  if (rumors.length !== 200) throw new Error(`Bella rumor bank expected 200 unique rows, got ${rumors.length}`);
  if (wisdoms.length !== 100) throw new Error(`Bella wisdom bank expected 100 unique rows, got ${wisdoms.length}`);
  if (proverbs.length !== 100) throw new Error(`Bella proverb bank expected 100 unique rows, got ${proverbs.length}`);

  window.BellaGameBankV2 = Object.freeze({
    ...base,
    version: 3,
    counts: Object.freeze({
      rumors: rumors.length,
      wisdoms: wisdoms.length,
      proverbs: proverbs.length,
      boxes: boxes.length,
      kuwaitQuestions: kuwaitQuestions.length
    }),
    rumors,
    wisdoms,
    proverbs,
    boxes,
    kuwaitQuestions
  });
})();
