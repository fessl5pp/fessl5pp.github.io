const fs = require('fs');
const assert = require('assert');

const persona = fs.readFileSync('lib/bella-persona.js', 'utf8');
const chat = fs.readFileSync('api/chat.js', 'utf8');
const routing = fs.readFileSync('bella-routing.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const moments = fs.readFileSync('bella-moments.js', 'utf8');

assert.ok(persona.includes('ملف شخصية بيلا الرسمي'), 'canonical persona profile must exist');
assert.ok(persona.includes('تاريخ الميلاد الثابت للشخصية: 12/11/2004'), 'Bella fixed persona birth date must remain defined');
assert.ok(persona.includes('مطيرية') && persona.includes('مويهية'), 'Bella persona ancestry flow must remain defined');
assert.ok(persona.includes('لا تخترعين أي نسب') || persona.includes('لا تخترعين فرع أدق'), 'persona must block invented deeper lineage');
assert.ok(persona.includes('اسم الشخصية داخل التجربة هو بيلا'), 'Bella must not invent a civil identity');
assert.ok(persona.includes('لا تدعين إن بيلا بمكان حقيقي الآن'), 'Bella must not invent a live physical location');
assert.ok(persona.includes('قاعدة v15 الأساسية'), 'natural Kuwaiti writing baseline must remain explicit');
assert.ok(persona.includes('لا «تقلدين» اللهجة الكويتية'), 'Kuwaiti dialect must be treated as Bella natural voice');
assert.ok(persona.includes('Kuwait Dialect Engine v2'), 'contextual Kuwaiti lexicon engine must remain present');
assert.ok(persona.includes('دز/يدز') && persona.includes('الكبت') && persona.includes('قز'), 'core Kuwaiti contextual vocabulary must remain available');
assert.ok(persona.includes('لغة خدمة العملاء') || persona.includes('خدمة العملاء'), 'robotic customer-service language must remain discouraged');
assert.ok(persona.includes('عادة صفر إلى اثنين تكفي'), 'emoji use must stay restrained');
assert.ok(persona.includes('لا تبدين كل مرة بـ«امبيه»'), 'reply openings must vary instead of becoming repetitive');
assert.ok(persona.includes('«شو»، «كتير»، «أوي»، «إزاي»، «عايزة»، «لسه»'), 'persona must explicitly block Levantine/Egyptian leakage in Bella-authored chat');
assert.ok(persona.includes('«جذي» على «كذا»') && persona.includes('«چنّه»'), 'Kuwaiti orthography preference must be explicit');
assert.ok(persona.includes('الاستثناء فقط إذا كنتِ تقتبسين أو تترجمين'), 'other dialect words must remain allowed only when quoting/translating/explaining');
assert.ok(persona.includes('النغزة تجي حول الجواب، مو بدل الجواب'), 'playful teasing must never replace the actual answer');

assert.ok(chat.includes('bellaPersonaInstruction'), 'chat API must load the canonical Bella persona');
assert.ok(chat.includes('.slice(-20)'), 'chat API must keep a larger recent conversation window for short-reference understanding');
assert.ok((chat.includes('تربطين الرسالة بآخر سياق') || chat.includes('اربطي الرسالة بآخر سياق')) && chat.includes('خصوصًا الرسائل القصيرة والضمائر'), 'chat API must explicitly reason over recent conversational context');

assert.ok(routing.includes('return normalizeText(msg).length > 0'), 'every non-empty normal chat message must prefer AI');
assert.ok(routing.includes('window.dictionaryReply = function bellaAIOnlyDictionary() { return null; }'), 'legacy phrase dictionary must not answer normal chat');
assert.ok(routing.includes('window.angryServiceBlock = function bellaAIOnlyAngryService() { return null; }'), 'legacy angry canned replies must not intercept chat');
assert.ok(routing.includes('window.fazaaReply = function bellaAIOnlyFazaaReply() { return null; }'), 'legacy fazaa canned replies must not intercept normal chat');
assert.ok(routing.includes('ambientMomentsPreserved: true'), 'ambient rumors/moments must remain intentionally enabled');
assert.ok(routing.includes('bellaNoLegacySuggestions'), 'legacy suggestion word banks must remain retired');

assert.ok(app.includes('bella-moments.js'), 'moments module must load in the app');
assert.ok(sw.includes('/bella-moments.js?v=16') || sw.includes('/bella-moments.js?v=23'), 'moments module must be available in the PWA cache');
assert.ok(moments.includes('window.BellaMoments'), 'moments module must expose one coordinated controller');
assert.ok(moments.includes('rumorBanks') && moments.includes('toastBanks'), 'rumors and top-right comments must share the moments system');
assert.ok(moments.includes('Date.now() < seriousUntil'), 'ambient jokes must pause during serious conversations');
assert.ok(moments.includes('يقولون بيلا مسوية ملف سري حق أكثر كلمة تكتبها') && moments.includes('يقولون اللي يدخل بيلا كل يوم يصير من الربع'), 'favorite original rumor copy must stay in the upgraded deck');
assert.ok(moments.includes('toast: 8500'), 'high-intensity top-right moments need a cooldown without feeling slow');
assert.ok(moments.includes('rumorMin: 30000') && moments.includes('rumorJitter: 16000'), 'high-intensity rumors must run frequently with varied timing');

console.log('Bella persona/UI smoke tests passed: canonical persona, natural Kuwaiti voice, AI-first context and ambient moments are intact.');
