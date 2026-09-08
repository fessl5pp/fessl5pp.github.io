import {
  BELLA_KUWAIT_LEXICON,
  BELLA_KUWAIT_LEXICON_COUNT,
  bellaKuwaitLexiconRow as baseRow
} from "./bella-kuwait-lexicon.js";
import {
  BELLA_KUWAIT_LEXICON_B2,
  BELLA_KUWAIT_LEXICON_B2_COUNT,
  bellaKuwaitLexiconB2Row
} from "./bella-kuwait-lexicon-b2.js";
import {
  BELLA_KUWAIT_LEXICON_B3,
  BELLA_KUWAIT_LEXICON_B3_COUNT,
  bellaKuwaitLexiconB3Row
} from "./bella-kuwait-lexicon-b3.js";

export {
  BELLA_KUWAIT_LEXICON,
  BELLA_KUWAIT_LEXICON_B2,
  BELLA_KUWAIT_LEXICON_B3,
  BELLA_KUWAIT_LEXICON_COUNT,
  BELLA_KUWAIT_LEXICON_B2_COUNT,
  BELLA_KUWAIT_LEXICON_B3_COUNT
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aliases(term) {
  const raw = String(term || "");
  const paren = [...raw.matchAll(/\(([^)]+)\)/g)].map(m => m[1]);
  const withoutParen = raw.replace(/\([^)]*\)/g, " ");
  const parts = [raw, withoutParen, ...paren, ...raw.split(/\s*\/\s*/)];
  const out = new Set();
  for (const part of parts) {
    const n = normalize(part);
    if (!n) continue;
    out.add(n);
    if (n.includes("چ")) out.add(n.replace(/چ/g, "ج"));
  }
  return [...out];
}

function sourceRow(row, source) {
  return Object.freeze({ ...row, source, sourceId: row.id });
}

export const BELLA_KUWAIT_LEXICON_SOURCE_COUNT =
  BELLA_KUWAIT_LEXICON_COUNT + BELLA_KUWAIT_LEXICON_B2_COUNT + BELLA_KUWAIT_LEXICON_B3_COUNT;

export const BELLA_KUWAIT_LEXICON_ALL = Object.freeze([
  ...BELLA_KUWAIT_LEXICON.map(row => sourceRow(row, "owner_b1")),
  ...BELLA_KUWAIT_LEXICON_B2.map(row => sourceRow(row, row.source || "owner_b2")),
  ...BELLA_KUWAIT_LEXICON_B3.map(row => sourceRow(row, row.source || "owner_b3"))
]);

// Keep every source row above for provenance. For search/prompt selection only,
// collapse exact term+meaning duplicates, preferring the newest owner source (B3).
const dedup = new Map();
for (const row of BELLA_KUWAIT_LEXICON_ALL) {
  const key = `${normalize(row.term)}\u0000${normalize(row.meaning)}`;
  dedup.set(key, row);
}
export const BELLA_KUWAIT_LEXICON_UNIQUE = Object.freeze([...dedup.values()]);
export const BELLA_KUWAIT_LEXICON_UNIQUE_COUNT = BELLA_KUWAIT_LEXICON_UNIQUE.length;

const STOP = new Set([
  "شنو","وش","ما","هو","هي","هذا","هذي","هاذي","يعني","معنى","كلمه","كلمة","مصطلح","يسمون","اسم",
  "في","من","على","عن","الى","إلى","او","أو","و","اللي","الي","شي","شيء","حق","الكويت","كويتي","كويتيه"
].map(normalize));

function tokens(value) {
  return normalize(value).split(" ").filter(x => x.length >= 2 && !STOP.has(x));
}

function asksByMeaning(text) {
  const n = normalize(text);
  return /(?:شنو يسمون|وش يسمون|شنو اسم|وش اسم|كلمه تعني|كلمة تعني|مصطلح يعني|شنو الكلمه|شنو الكلمة|وش الكلمه|وش الكلمة)/.test(n);
}

function exactScore(row, text, textJ) {
  let best = 0;
  for (const alias of aliases(row.term)) {
    const aJ = alias.replace(/چ/g, "ج");
    if (text.includes(alias) || textJ.includes(aJ)) best = Math.max(best, 1000 + alias.length);
  }
  return best;
}

function reverseMeaningScore(row, queryTokens) {
  if (!queryTokens.length) return 0;
  const meaning = new Set(tokens(row.meaning));
  const term = new Set(tokens(row.term));
  let hits = 0;
  for (const token of queryTokens) if (meaning.has(token) || term.has(token)) hits++;
  if (!hits) return 0;
  const coverage = hits / Math.max(1, queryTokens.length);
  return hits * 20 + coverage * 20;
}

export function bellaFindKuwaitLexicon(message, { limit = 24 } = {}) {
  const text = normalize(message);
  if (!text) return [];
  const textJ = text.replace(/چ/g, "ج");
  const reverse = asksByMeaning(message);
  const queryTokens = reverse ? tokens(message) : [];
  const scored = [];
  for (const row of BELLA_KUWAIT_LEXICON_UNIQUE) {
    const exact = exactScore(row, text, textJ);
    const meaning = reverse ? reverseMeaningScore(row, queryTokens) : 0;
    const score = Math.max(exact, meaning);
    if (!score) continue;
    const freshness = row.source === "owner_b3" ? 3 : row.source === "owner_b2" ? 2 : 1;
    scored.push({ row, score, freshness });
  }
  scored.sort((a, b) => b.score - a.score || b.freshness - a.freshness || a.row.sourceId - b.row.sourceId);
  return scored.slice(0, Math.max(1, Math.min(60, Number(limit) || 24))).map(x => x.row);
}

const TOPICS = Object.freeze([
  { name: "people", re: /(?:شخص|واحد|بنت|ولد|ريال|مره|طبع|شخصيه|وصف|غثيث|بخيل|كسول|عيار)/, cats: ["people_traits","reactions"] },
  { name: "actions", re: /(?:يسوي|سوى|قاعد|راح|يروح|يمشي|يركض|هرب|قحص|فحط|يطالع|ينخش|دعم|لف|طاف|حركه|فعل)/, cats: ["actions"] },
  { name: "street", re: /(?:شارع|ديوان|ديواني|سيار|طريج|بيت|فريج|دريشه|تاير|قير|هرن|دوار|جسر|سوق|زحمه|قز)/, cats: ["street_diwaniya_places","street_diwaniya","objects_places","driving"] },
  { name: "heritage", re: /(?:تراث|قديم|اداه|ادوات|منزل|كبت|حوش|سرداب|جاخور|شاليه|حداق|طراد|لنج|قرقور)/, cats: ["heritage_tools_home","objects_places"] },
  { name: "food", re: /(?:اكل|طبخ|مجبوس|هريس|مرق|خبز|حلو|قهو|جاي|شاي|شراب|بهار|ضياف|ريوق|غدا|عشا|مطعم|كافيه)/, cats: ["food_drinks_hospitality","cafes_food"] },
  { name: "expressions", re: /(?:عباره|تعبير|مصطلح|سالفه|قول|قال|معنى|كلمه|كلمة|مسج|دز|سين|بلوك|قروب)/, cats: ["popular_street_expressions","messaging","reactions"] },
  { name: "proverbs", re: /(?:مثل|امثال|حكمه|حكمة|حكم|زمان|المثل)/, cats: ["proverbs"] },
  { name: "weather", re: /(?:جو|طقس|مطر|ريح|غبار|بحر|موج|مد|جزر|ربيع|وسم|سرايات|حر|برد|صيف|شتا)/, cats: ["weather_marine_environment","objects_places"] },
  { name: "fashion", re: /(?:لبس|اوتفت|كشخه|افنيوز|ميكب|مكياج|شعر|اظافر|جنطه|عباي|شيله|عطر|شوز|هيلز|بوتيك)/, cats: ["fashion"] },
  { name: "university", re: /(?:جامع|كلاس|سكشن|دكتور|اسلمنت|كوز|ميدترم|فاينل|بريك|gpa|سلايد|نوتات|تسجيل)/, cats: ["university"] }
]);

const GROUPS = Object.freeze(BELLA_KUWAIT_LEXICON_UNIQUE.reduce((acc, row) => {
  (acc[row.category] ||= []).push(row);
  return acc;
}, {}));

function seededStart(text, length) {
  if (!length) return 0;
  let hash = 0;
  for (const ch of normalize(text)) hash = (hash * 33 + ch.codePointAt(0)) >>> 0;
  return hash % length;
}

function categorySelection(message, matches) {
  const names = [];
  const cats = [];
  for (const row of matches) if (!cats.includes(row.category)) cats.push(row.category);
  const text = normalize(message);
  for (const topic of TOPICS) {
    if (!topic.re.test(text)) continue;
    if (!names.includes(topic.name)) names.push(topic.name);
    for (const cat of topic.cats) if (!cats.includes(cat)) cats.push(cat);
  }
  if (!cats.length) cats.push("popular_street_expressions","messaging","reactions");
  return { names: names.slice(0, 3), cats: cats.slice(0, 6) };
}

function addSample(rows, seen, cat, message, maxRows) {
  const group = GROUPS[cat] || [];
  if (!group.length) return;
  const start = seededStart(`${message}:${cat}`, group.length);
  const take = Math.min(6, group.length);
  for (let i = 0; i < take && rows.length < maxRows; i++) {
    const row = group[(start + i) % group.length];
    const key = `${row.source}:${row.sourceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }
}

const INSULT_OR_BODY = /(?:جيكر|فقمه|فقمة|طبطاب|عصل|قروي|طمطمه|طمطمة|صقعه|عفطي|سفله|سفلة|شحّات|طنطل|غبي|قبيح|سمين|نحيف)/;
const VIOLENCE_OR_HARASSMENT = /(?:طراق|كف|بوكس|شلوت|يدبغ|يضرب|ضرب|تحرش|يتحرش|تهديد|يهدد)/;

export function bellaKuwaitLexiconInstruction(message, { maxRows = 40 } = {}) {
  const matches = bellaFindKuwaitLexicon(message, { limit: Math.min(24, maxRows) });
  const selection = categorySelection(message, matches);
  const rows = [];
  const seen = new Set();
  const push = row => {
    if (!row || rows.length >= maxRows) return;
    const key = `${row.source}:${row.sourceId}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };
  matches.forEach(push);
  selection.cats.forEach(cat => addSample(rows, seen, cat, message, maxRows));

  const exactText = matches.map(r => normalize(`${r.term} ${r.meaning}`)).join(" ");
  const sensitive = INSULT_OR_BODY.test(exactText);
  const violence = VIOLENCE_OR_HARASSMENT.test(exactText);
  const labels = selection.names.length ? selection.names.join(" + ") : selection.cats.slice(0, 2).join(" + ");

  return `Kuwait Dialect Engine v5 — قاعدة بيلا الموحّدة:
- محفوظ ${BELLA_KUWAIT_LEXICON_SOURCE_COUNT} صف مصدر: 210 من القاموس الأول + 250 من الدفعة الثانية + 530 من ملف المالك الجديد.
- نحفظ كل صفوف المصدر للأمانة والتتبع، لكن عند الاختيار ندمج فقط التكرار المطابق تماماً (نفس اللفظ + نفس المعنى) ونفضّل أحدث مرجع للمالك؛ اختلاف المعنى أو الاستعمال يبقى محفوظاً.
- الملف الجديد مرجع لهجي/ثقافي للفهم والسياق، وليس مرجعاً طبياً أو قانونياً أو علمياً أو للسلامة. في السياق الجدي قدّمي الدقة والمصدر المتخصص على النكهة العامية.
- افهمي المفردة من معناها المحدد ولا تحشرين كلمات لمجرد إثبات اللهجة. الاستخدام انتقائي وطبيعي حسب السالفة.
- أوصاف الأشخاص الجارحة أو الجسمانية تُفهم، لكن لا ترمينها على المستخدم من نفسج ولا تتنمرين على الشكل أو الجسم.
- مفردات الضرب/الأذى/التحرش تُفهم لغوياً، ولا تتحول لتشجيع أذى أو تهديد. وإذا كان السياق تحرشاً أو سلامة فخذي المعنى الجدي ولا تخففينه بالمزح.
- الأمثال والحكم تُشرح بالمعنى المقصود في المصدر، مو كأوامر حرفية.
${sensitive ? "- تنبيه: المطابقة الحالية فيها وصف جارح/جسماني؛ استخدميه للفهم أو الشرح فقط، مو كإهانة للمستخدم.\n" : ""}${violence ? "- تنبيه: المطابقة الحالية فيها عنف/تحرش؛ حافظي على سياق السلامة ولا تصعدينه.\n" : ""}- القاموس المختار لهالسالفة (${labels || "عام"}):
${rows.map(r => `${r.source}:${r.sourceId}. ${r.term} = ${r.meaning}`).join("\n")}`;
}

export function bellaKuwaitLexiconForMoments() {
  const safeCats = ["food_drinks_hospitality","popular_street_expressions","heritage_tools_home","weather_marine_environment","cafes_food","messaging"];
  const rows = [];
  const seen = new Set();
  for (const cat of safeCats) {
    for (const row of (GROUPS[cat] || []).slice(0, 8)) {
      const key = normalize(`${row.term}\u0000${row.meaning}`);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }
  return `مرجع نكهة محدود للـMoments من Kuwait Dialect Engine v5 (${BELLA_KUWAIT_LEXICON_SOURCE_COUNT} صف مصدر محفوظ، والعينة فقط لتقليل حجم البرومبت): ${rows.map(r => `${r.term}=${r.meaning}`).join(" | ")}`;
}

export function bellaKuwaitLexiconRow(id, source = "owner_b1") {
  if (source === "owner_b3") return bellaKuwaitLexiconB3Row(id);
  if (source === "owner_b2") return bellaKuwaitLexiconB2Row(id);
  return baseRow(id);
}
