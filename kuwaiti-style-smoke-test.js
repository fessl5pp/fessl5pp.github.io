const fs = require('fs');
const assert = require('assert');

const persona = fs.readFileSync('lib/bella-persona.js', 'utf8');
const lexicon = fs.readFileSync('lib/bella-kuwait-lexicon.js', 'utf8');

assert.ok(persona.includes('أنتِ "بيلا"، بنت كويتية أصلية، عفوية ولسانج متكتك وذكي.'), 'exact Bella Kuwaiti identity instruction must stay present');
assert.ok(persona.includes('أسلوبج كويتي بحت: كلام بنات الكويت اليومي، مو تمثيل ولا لغة مسلسلات قديمة.'), 'modern everyday Kuwaiti style rule must stay present');
assert.ok(persona.includes('تقطين حجي وسوالف ونغزات بذرابة وغشمرة بدون وقاحة'), 'light teasing and banter rule must stay present');
assert.ok(persona.includes('تسولفين بالواتساب أو تدزين فويس نوت لصديقتج'), 'WhatsApp/voice-note rhythm must stay present');
for (const token of ['شكو','من صجك','وي عاد','يا حافظ','امبيه','شسالفة','تكفى','بدّعت','فديتك/فديتج','لا تطالعني جذي','على راسي','يحليلك','شالوضع']) {
  assert.ok(persona.includes(token), `missing requested Kuwaiti vocabulary: ${token}`);
}
assert.ok(persona.includes('من صجك تسأل؟') && persona.includes('لا والله؟ توك تدري؟'), 'requested light teasing examples must stay present');
assert.ok(persona.includes('ههههههه') && persona.includes('ويييه') && persona.includes('يا حليلك'), 'fast emotional reaction examples must stay present');

assert.ok(persona.includes('وي عاد الحين تذكرت اليوع؟ اطلب لك شي خفيف ولا تقعد تتفلسف بنص الليل، تبي صمونة حلوم ولا نفتح باب مطاعم الوجبات وماتخلص؟'), 'hungry example must remain verbatim as a style reference');
assert.ok(persona.includes('منو له خلق أصلاً؟ بس عاد بسك دلع وقوم نام مبجر، باجر تقعد تتحلطم بالزحمة وشوارعنا بروحها مو ناقصة!'), 'work example must remain verbatim as a style reference');
assert.ok(persona.includes('امبيه شكو! من وين يايب هالسالفة تكفى؟ لا تفتي من عندك ترا واضحة.'), 'wrong-info teasing example must remain verbatim as a style reference');

for (const token of ['😂','🙄','💅🏼','🤦🏻‍♀️']) assert.ok(persona.includes(token), `missing requested feminine emoji guidance: ${token}`);
assert.ok(persona.includes('«شو»، «كتير»، «أوي»، «إزاي»، «عايزة»، «لسه»'), 'dialect leakage block must stay explicit');
assert.ok(persona.includes('«جذي» مو «كذا»') && persona.includes('«چنّه» مو «كأنه»'), 'Kuwaiti writing preferences must stay explicit');
assert.ok(persona.includes('وقت المرض، الوفاة، الخوف، الاكتئاب') && persona.includes('سؤال طبي/قانوني/مالي/سلامة'), 'teasing must shut off in serious/high-stakes contexts');
assert.ok(persona.includes('وينك مختفي'), 'approved simple return line must remain protected');

assert.ok(persona.includes('Kuwait Dialect Engine v2'), 'Dialect Engine compatibility marker must stay present');
for (const token of ['دز/يدز','عطاني سين','شطاري','شكو ماكو','لاهية','قز','فرّة','صافطة','مسفط','سيايير','هرن','سايد','أجياس','الكبت','جنطة','آوتفت','ماتشا','سبانش','V60','أسلمنت','كوز','ميدترم','فاينل','بريك','سكشن','كلاس']) {
  assert.ok(persona.includes(token), `missing contextual Kuwaiti token: ${token}`);
}
for (const rule of ['«جماعة» → «الربع/الناس»','«دولاب» → «الكبت»','«شنطة» → «جنطة»','«يرسل/أرسل» → «يدز/دز»','«يشوف» → «يطالع»']) {
  assert.ok(persona.includes(rule), `missing replacement rule: ${rule}`);
}
assert.ok(persona.includes('Privacy Guard — الخصوصية والتزبيد'), 'privacy guard marker must stay present');
assert.ok(persona.includes('لا تعطين عنوان ولا قطعة ولا معلومة مكان خاصة ولا تخترعينها'), 'exact-address privacy rule must stay present');
assert.ok(persona.includes('لا تدعين إن بيلا بمكان حقيقي الآن'), 'live-location fiction safeguard must stay present');
assert.ok(persona.includes('شعليك من القطعة تبي تدز الذبيحة؟ 😂'), 'approved playful privacy-deflection example must stay present');
assert.ok(persona.includes('روتين ومود يومي — Flavor مو تتبع'), 'time-of-day flavor marker must stay present');
assert.ok(persona.includes('الصبح: مود دوام/جامعة وبريك') && persona.includes('العصر: مود روّقان') && persona.includes('الليل: مود قز وطلعات'), 'morning/afternoon/night flavor rules must stay present');
assert.ok(persona.includes('لا تقولين إنج فعلًا في كافيه أو شارع محدد الآن'), 'routine must never become a real-time location claim');

// Complete owner dictionary gate: all 210 rows must be in source and dynamically wired into the persona.
const rowIds = [...lexicon.matchAll(/^"(\d+)\\t[0-5]\\t/gm)].map(m => Number(m[1]));
assert.strictEqual(rowIds.length, 210, 'complete owner lexicon must contain exactly 210 rows');
assert.deepStrictEqual(rowIds, Array.from({ length: 210 }, (_, i) => i + 1), 'owner lexicon IDs must be continuous 1..210');
assert.ok(lexicon.includes('BELLA_KUWAIT_LEXICON_COUNT'), 'lexicon must expose a runtime count');
assert.ok(lexicon.includes('bellaFindKuwaitLexicon') && lexicon.includes('bellaKuwaitLexiconInstruction'), 'lexicon must support exact-term lookup and contextual prompt injection');
assert.ok(persona.includes('import { bellaKuwaitLexiconInstruction } from "./bella-kuwait-lexicon.js";'), 'persona must import complete lexicon engine');
assert.ok(persona.includes('const lexiconHint = bellaKuwaitLexiconInstruction(message);') && persona.includes('${lexiconHint}'), 'every persona request must inject contextual lexicon guidance');
for (const token of ['ساحكة','سبهللة','قميضة','تزبيد','جمبزة','أهوجس','سفايف','حدّست','داعوس','مضاعد','تراجي','مرشوش','تنزييلات','هلاقة','نقصة','قرمة','جاي مخدر','عصير عوار قلب','تخبيص','كيرف','أوفيس أور']) {
  assert.ok(lexicon.includes(`\\t${token}\\t`), `missing owner lexicon term: ${token}`);
}

console.log('Bella exact Kuwaiti style smoke test passed: full 210/210 owner lexicon, contextual injection, privacy guard, routine flavor, dialect safety and serious-context safeguards are present.');