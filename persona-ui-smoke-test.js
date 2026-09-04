const fs = require('fs');
const assert = require('assert');

for (const file of ['lib/bella-persona.js', 'api/chat.js', 'bella-ui.js', 'bella-routing.js', 'bella-moments.js', 'index.html']) {
  assert.ok(fs.existsSync(file), `Missing Bella persona/UI file: ${file}`);
}

const persona = fs.readFileSync('lib/bella-persona.js', 'utf8');
const chat = fs.readFileSync('api/chat.js', 'utf8');
const ui = fs.readFileSync('bella-ui.js', 'utf8');
const routing = fs.readFileSync('bella-routing.js', 'utf8');
const moments = fs.readFileSync('bella-moments.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

new Function(routing);
new Function(moments);

assert.ok(persona.includes('12/11/2004'), 'Bella persona must keep the canonical birthday');
assert.ok(persona.includes('قولي «مطيرية» فقط'), 'tribe answer must stop at Mutair on the first question');
assert.ok(persona.includes('قولي «مويهية» فقط'), 'tribe follow-up must reveal Muwayhiyah only after the Mutair follow-up');
assert.ok(persona.includes('عيب ما أصرّح'), 'deeper lineage must stay private instead of being invented');
assert.ok(persona.includes('بوسيني'), 'persona must recognize a simple kiss request as social intent');
assert.ok(persona.includes('مواااح'), 'kiss intent must have a natural in-character response direction');
assert.ok(persona.includes('إذا المستخدم سأل مباشرة وبوضوح هل أنتي إنسانة حقيقية أو ذكاء اصطناعي'), 'Bella must stay truthful when directly asked about being human/AI');
assert.ok(persona.includes('لا تفتحي رد اجتماعي عادي بتعريف تقني'), 'Bella must not inject technical identity disclaimers into ordinary social replies');

assert.ok(chat.includes('bellaPersonaInstruction'), 'chat API must load the canonical Bella persona');
assert.ok(chat.includes('.slice(-20)'), 'chat API must keep a larger recent conversation window for short-reference understanding');
assert.ok(chat.includes('تربطين الرسالة بآخر سياق') && chat.includes('خصوصًا الرسائل القصيرة والضمائر'), 'chat API must explicitly reason over recent conversational context');

assert.ok(routing.includes('return normalizeText(msg).length > 0'), 'every non-empty normal chat message must prefer AI');
assert.ok(routing.includes('window.dictionaryReply = function bellaAIOnlyDictionary() { return null; }'), 'legacy phrase dictionary must not answer normal chat');
assert.ok(routing.includes('window.angryServiceBlock = function bellaAIOnlyAngryService() { return null; }'), 'legacy angry canned replies must not intercept chat');
assert.ok(routing.includes('window.fazaaReply = function bellaAIOnlyFazaaReply() { return null; }'), 'legacy fazaa canned replies must not intercept normal chat');
assert.ok(routing.includes('ambientMomentsPreserved: true'), 'ambient rumors/moments must remain intentionally enabled');
assert.ok(routing.includes('bellaNoLegacySuggestions'), 'legacy suggestion word banks must remain retired');

assert.ok(app.includes('bella-moments.js'), 'moments module must load in the app');
assert.ok(sw.includes('/bella-moments.js?v=16'), 'moments module must be available in the PWA cache');
assert.ok(moments.includes('window.BellaMoments'), 'moments module must expose one coordinated controller');
assert.ok(moments.includes('rumorBanks') && moments.includes('toastBanks'), 'rumors and top-right comments must share the moments system');
assert.ok(moments.includes('Date.now() < seriousUntil'), 'ambient jokes must pause during serious conversations');
assert.ok(moments.includes('يقولون بيلا مسوية ملف سري حق أكثر كلمة تكتبها') && moments.includes('يقولون اللي يدخل بيلا كل يوم يصير من الربع'), 'favorite original rumor copy must stay in the upgraded deck');
assert.ok(moments.includes('toast: 8500'), 'high-intensity top-right moments need a cooldown without feeling slow');
assert.ok(moments.includes('rumorMin: 30000') && moments.includes('rumorJitter: 16000'), 'high-intensity rumors must run frequently with varied timing');
assert.ok(moments.includes('rumorBanks.legendary') && moments.includes('awardXP'), 'rare and legendary rumor interactions must stay active');

assert.ok(index.includes('openBellaSettings()">الإعدادات ⚙️'), 'settings must stay next to the main chat entry');
assert.ok(index.includes('openBellaActivities()">فعاليات بيلا 🎮'), 'home must expose one dedicated activities entry');
assert.ok(!index.includes('openRadarPlus()">رادار القز+ 📡'), 'radar must not remain as a separate home action');
assert.ok(!index.includes('startKuwaitiChallenge()">تحدي كويتي 🧩'), 'games must not remain scattered across home actions');
assert.ok(index.includes('aria-label="فعاليات بيلا"'), 'chat header must expose the dedicated activities hub');

assert.ok(ui.includes('window.openBellaActivities'), 'UI module must own the activities hub');
assert.ok(ui.includes('📡 الرادار والسوالف'), 'activities hub must group radar/dira together');
assert.ok(ui.includes('🎮 الألعاب'), 'activities hub must group games together');
assert.ok(ui.includes('startBoxGame'), 'activities hub must include box game');
assert.ok(ui.includes('startProverbGame'), 'activities hub must include proverb game');
assert.ok(ui.includes('bellaThemeSettings'), 'theme control must move under settings');
assert.ok(ui.includes('bellaMemorySettings'), 'memory control must be reachable from settings');
assert.ok(ui.includes('bellaMomentsEnabled'), 'settings must expose ambient moments control');
assert.ok(ui.includes('window.BellaMoments?.setEnabled?.'), 'moments toggle must control the unified ambient system');
assert.ok(!ui.includes('bellaRandomSuggestions'), 'old suggestion-bank toggle must be removed from settings');

assert.ok(ui.includes('button.dataset.bellaAccountButton === "1"'), 'home cleanup must preserve the account button');
assert.ok(ui.includes('ensureAccountHomeAction'), 'UI must restore a missing account entry automatically');
assert.ok(ui.includes('bellaAccountSettings'), 'account must be reachable from settings');
assert.ok(ui.includes('window.BellaAccount?.open?.()'), 'settings account action must open the account center');
assert.ok(ui.includes('bellaSettingsAdmin'), 'settings must include a protected management section');
assert.ok(ui.includes('window.BellaOwnerCenter?.refresh?.()'), 'owner access must be re-verified before showing management');
assert.ok(ui.includes('bellaOwnerSettings'), 'owner center must be reachable from settings for authorized owners');
assert.ok(ui.includes('window.BellaModeratorCenter?.refresh?.()'), 'moderator access must be re-verified before showing moderation');
assert.ok(ui.includes('bellaModeratorSettings'), 'moderator center must be reachable from settings for authorized staff');

console.log('Bella AI-first/persona/UI smoke tests passed: normal chat uses AI, legacy suggestion banks stay retired, adaptive moments stay active, and protected account/admin access remains wired.');
