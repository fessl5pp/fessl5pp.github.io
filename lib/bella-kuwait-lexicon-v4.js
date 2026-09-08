import {
  BELLA_KUWAIT_LEXICON,
  BELLA_KUWAIT_LEXICON_COUNT,
  bellaFindKuwaitLexicon as findBase,
  bellaKuwaitLexiconInstruction as baseInstruction,
  bellaKuwaitLexiconForMoments as baseMoments,
  bellaKuwaitLexiconRow as baseRow
} from "./bella-kuwait-lexicon.js";
import {
  BELLA_KUWAIT_LEXICON_B2,
  BELLA_KUWAIT_LEXICON_B2_COUNT,
  bellaFindKuwaitLexiconB2,
  bellaKuwaitLexiconB2Instruction,
  bellaKuwaitLexiconB2ForMoments,
  bellaKuwaitLexiconB2Row
} from "./bella-kuwait-lexicon-b2.js";

export { BELLA_KUWAIT_LEXICON, BELLA_KUWAIT_LEXICON_B2, BELLA_KUWAIT_LEXICON_COUNT, BELLA_KUWAIT_LEXICON_B2_COUNT };
export const BELLA_KUWAIT_LEXICON_SOURCE_COUNT = BELLA_KUWAIT_LEXICON_COUNT + BELLA_KUWAIT_LEXICON_B2_COUNT;
export const BELLA_KUWAIT_LEXICON_ALL = Object.freeze([
  ...BELLA_KUWAIT_LEXICON.map(row => Object.freeze({ ...row, source: "owner_b1", sourceId: row.id })),
  ...BELLA_KUWAIT_LEXICON_B2.map(row => Object.freeze({ ...row, sourceId: row.id }))
]);

export function bellaFindKuwaitLexicon(message) {
  return [...findBase(message), ...bellaFindKuwaitLexiconB2(message)];
}

export function bellaKuwaitLexiconInstruction(message, options = {}) {
  const base = baseInstruction(message, options);
  const b2 = bellaKuwaitLexiconB2Instruction(message, options);
  return `${base}\n\n${b2}\n\nKuwait Dialect Engine v4 — قاعدة الدمج:\n- عندج الآن 460 مدخل مصدر: 210 من القاموس الأول + 250 من الدفعة الثانية.\n- لا تعدّين التكرارات ككلمات مختلفة؛ اعتبريها معاني/استخدامات إضافية لنفس اللفظ.\n- إذا تعارض معنى عامي مع سياق طبي/قانوني/سلامة أو معنى حديث واضح، السياق الجدي والدقة مقدّمين على المزح.\n- اللهجة تبقى طبيعية: الفهم واسع، لكن الاستخدام انتقائي حسب السالفة.`;
}

export function bellaKuwaitLexiconForMoments() {
  return `${baseMoments()}\n${bellaKuwaitLexiconB2ForMoments()}`;
}

export function bellaKuwaitLexiconRow(id, source = "owner_b1") {
  return source === "owner_b2" ? bellaKuwaitLexiconB2Row(id) : baseRow(id);
}
