const fs = require('fs');
const assert = require('assert');

const persona = fs.readFileSync('lib/bella-persona.js', 'utf8');

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

console.log('Bella exact Kuwaiti style smoke test passed: requested rhythm, vocabulary, examples, dialect guard and serious-context safeguards are present.');
