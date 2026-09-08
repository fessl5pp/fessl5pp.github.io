// Bella Kuwait Dialect Engine v5 — owner dictionary batch 3.
// Source: owner-provided "Kuwaiti_Street_Dictionary_500.pdf".
// The source itself contains 530 continuous entries (1..530). Preserve source wording/meaning; apply Bella safety/style rules at usage time.
import data01 from "./bella-kuwait-lexicon-b3-data-01.js";
import data02 from "./bella-kuwait-lexicon-b3-data-02.js";
import data03 from "./bella-kuwait-lexicon-b3-data-03.js";
import data04 from "./bella-kuwait-lexicon-b3-data-04.js";
import data05 from "./bella-kuwait-lexicon-b3-data-05.js";
import data06 from "./bella-kuwait-lexicon-b3-data-06.js";

const CATS = Object.freeze(["people_traits", "actions", "street_diwaniya_places", "heritage_tools_home", "food_drinks_hospitality", "popular_street_expressions", "proverbs", "weather_marine_environment"]);
const DATA = Object.freeze([...data01,...data02,...data03,...data04,...data05,...data06]);

export const BELLA_KUWAIT_LEXICON_B3 = Object.freeze(DATA.map(([id, cat, term, meaning]) =>
  Object.freeze({ id: Number(id), source: "owner_b3", category: CATS[Number(cat)], term, meaning })
));
export const BELLA_KUWAIT_LEXICON_B3_COUNT = BELLA_KUWAIT_LEXICON_B3.length;
export const BELLA_KUWAIT_LEXICON_B3_CATEGORIES = CATS;

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
  const base = raw.replace(/\([^)]*\)/g, " ");
  const slash = raw.split(/\s*\/\s*/);
  const variants = [raw, base, ...paren, ...slash];
  const out = new Set();
  for (const item of variants) {
    const normalized = normalize(item);
    if (!normalized) continue;
    out.add(normalized);
    if (normalized.includes("چ")) out.add(normalized.replace(/چ/g, "ج"));
  }
  return [...out];
}

export function bellaFindKuwaitLexiconB3(message) {
  const text = normalize(message);
  if (!text) return [];
  const textJ = text.replace(/چ/g, "ج");
  return BELLA_KUWAIT_LEXICON_B3.filter(row =>
    aliases(row.term).some(alias => text.includes(alias) || textJ.includes(alias.replace(/چ/g, "ج")))
  );
}

const TOPICS = Object.freeze([
  ["people_traits", /(?:شخص|واحد|بنت|ولد|ريال|مره|طبع|شخصيه|وصف|غثيث|كشخه|بخيل|كسول|عيار|جمبازي|لوتي)/],
  ["actions", /(?:يسوي|سوى|قاعد|راح|يروح|يمشي|يركض|هرب|قحص|فحط|يطالع|ينخش|دعم|لف|طاف|حركه|فعل)/],
  ["street_diwaniya_places", /(?:شارع|ديوان|ديواني|دواني|سيار|طريج|بيت|فريج|دريشه|تاير|قير|هرن|دوار|جسر|مكان|سوق)/],
  ["heritage_tools_home", /(?:تراث|قديم|اداه|ادوات|بيت|منزل|كبت|حوش|سرداب|جاخور|شاليه|بحر|صيد|حداق|طراد|لنج|قرقور)/],
  ["food_drinks_hospitality", /(?:اكل|طبخ|مجبوس|هريس|مرق|خبز|حلو|قهو|جاي|شاي|شراب|بهار|ضياف|ريوق|غدا|عشا)/],
  ["popular_street_expressions", /(?:عباره|تعبير|مصطلح|سالفه|قول|قال|شنو يعني|معنى|كلمه|كلمة|بالشارع)/],
  ["proverbs", /(?:مثل|امثال|حكمه|حكمة|حكم|زمان|يقولون|المثل)/],
  ["weather_marine_environment", /(?:جو|طقس|مطر|ريح|غبار|بحر|موج|مد|جزر|ربيع|وسم|سرايات|حر|برد|صيف|شتا)/]
]);

const GROUPS = Object.freeze(Object.fromEntries(CATS.map(cat => [
  cat,
  BELLA_KUWAIT_LEXICON_B3.filter(row => row.category === cat)
])));

function detectCategories(message, matches) {
  const text = normalize(message);
  const out = [];
  for (const row of matches) if (!out.includes(row.category)) out.push(row.category);
  for (const [cat, re] of TOPICS) if (re.test(text) && !out.includes(cat)) out.push(cat);
  if (!out.length) out.push("popular_street_expressions", "people_traits");
  return out.slice(0, 2);
}

function seededStart(text, length) {
  if (!length) return 0;
  let hash = 0;
  for (const ch of normalize(text)) hash = (hash * 33 + ch.codePointAt(0)) >>> 0;
  return hash % length;
}

function addCategorySample(rows, seen, category, message, maxRows) {
  const group = GROUPS[category] || [];
  if (!group.length) return;
  const start = seededStart(message + category, group.length);
  const take = Math.min(10, group.length);
  for (let i = 0; i < take && rows.length < maxRows; i++) {
    const row = group[(start + i) % group.length];
    const key = `${row.source}:${row.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      rows.push(row);
    }
  }
}

export function bellaKuwaitLexiconB3Instruction(message, { maxRows = 30 } = {}) {
  const matches = bellaFindKuwaitLexiconB3(message);
  const cats = detectCategories(message, matches);
  const rows = [];
  const seen = new Set();
  const push = row => {
    if (!row || rows.length >= maxRows) return;
    const key = `${row.source}:${row.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  matches.forEach(push);
  cats.forEach(cat => addCategorySample(rows, seen, cat, message, maxRows));

  return `Kuwait Dialect Engine v5 — قاموس المالك الثالث: 530/530 مدخل من الملف الجديد محفوظ داخل النظام.
- هذا المرجع للفهم اللهجي والسياق والاختيار الطبيعي؛ لا تحشرين الكلمات في كل رد.
- حافظي على معنى المصدر كما هو عند شرح المفردة، وإذا احتاج المستخدم تحققاً تاريخياً/علمياً/طبياً/قانونياً فالمصدر الخارجي المتخصص مقدّم.
- أوصاف الأشخاص والعبارات الجارحة تُفهم لغوياً، لكن لا ترمينها على المستخدم من نفسج ولا تستخدمينها للتنمر.
- مفردات الضرب/الأذى أو الأمثال ذات الصورة العنيفة لا تتحول إلى تشجيع أذى أو تهديد؛ افهميها كسياق لغوي/مجازي حسب المصدر.
- الأمثال والحكم تُشرح بمعناها المقصود في القاموس، مو كأوامر حرفية.
- فئات الملف الثمانية محفوظة: أوصاف وطباع، أفعال، شارع/ديوانية/أماكن، تراث وأدوات ومنزل، أكل وضيافة، تعبيرات شارع، أمثال، وطقس/بحر/بيئة.
- القاموس المختار لهالسالفة (${cats.join(" + ")}):
${rows.map(r => `B3-${r.id}. ${r.term} = ${r.meaning}`).join("\n")}`;
}

export function bellaKuwaitLexiconB3ForMoments() {
  const safeCats = ["food_drinks_hospitality", "popular_street_expressions", "heritage_tools_home", "weather_marine_environment"];
  const rows = safeCats.flatMap(cat => (GROUPS[cat] || []).slice(0, 12));
  return `مرجع نكهة إضافي من قاموس المالك الثالث (530 مدخل محفوظ؛ عينة آمنة للـMoments فقط): ${rows.map(r => `${r.term}=${r.meaning}`).join(" | ")}`;
}

export function bellaKuwaitLexiconB3Row(id) {
  return BELLA_KUWAIT_LEXICON_B3.find(row => row.id === Number(id)) || null;
}
