const fs = require('fs');
const assert = require('assert');

for (const file of ['lib/bella-persona.js', 'api/chat.js', 'bella-ui.js', 'index.html']) {
  assert.ok(fs.existsSync(file), `Missing Bella v11 file: ${file}`);
}

const persona = fs.readFileSync('lib/bella-persona.js', 'utf8');
const chat = fs.readFileSync('api/chat.js', 'utf8');
const ui = fs.readFileSync('bella-ui.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

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
assert.ok(chat.includes('اربطين الرسالة بآخر سياق'), 'chat API must explicitly reason over recent conversational context');

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

console.log('Bella v11 persona/UI smoke tests passed: staged identity, natural social intent, context continuity and grouped activities are wired.');
