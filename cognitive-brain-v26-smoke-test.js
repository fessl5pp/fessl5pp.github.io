const fs = require('fs');
const vm = require('vm');

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing ${path}`);
  return fs.readFileSync(path, 'utf8');
}
function ok(condition, message) {
  if (!condition) throw new Error(message);
}
function must(source, needle, message) {
  if (!source.includes(needle)) throw new Error(message);
}

const legacyRouter = read('lib/bella-intelligence-v23.js');
const cognition = read('lib/bella-cognition-v26.js');
const gated = read('api/gated-chat.js');
const control = read('lib/bella-control.js');
const health = read('api/health.js');

const source = `${legacyRouter.replace(/export function /g, 'function ')}\n${cognition.replace(/^import .*$/m, '').replace(/export function /g, 'function ')}\nthis.__brain={routeBellaCognitionV26,bellaCognitionInstructionV26};`;
const sandbox = {};
vm.runInNewContext(source, sandbox);
const brain = sandbox.__brain;
ok(brain && typeof brain.routeBellaCognitionV26 === 'function', 'v26 cognition router is unavailable.');

const social = brain.routeBellaCognitionV26({ message: 'هلا شلونج', history: [] });
ok(social.model.tier === 'luna' && social.model.id === 'gpt-5.6-luna', 'simple social chat must use Luna.');
ok(social.reasoning.effort === 'low', 'simple social chat must keep low reasoning.');

const focused = brain.routeBellaCognitionV26({
  message: 'طيب ليش صار جذي؟',
  history: [{ role: 'user', content: 'الموقع يعطيني خطأ بعد تسجيل الدخول' }, { role: 'assistant', content: 'خلنا نفحص السبب' }]
});
ok(focused.model.tier === 'terra', 'context-heavy follow-up should use Terra.');
ok(focused.ambiguity.useHistoryToResolve === true, 'short follow-up should resolve its referent from history.');

const deep = brain.routeBellaCognitionV26({ message: 'حلل لي هالكود وحدد سبب الخطأ والحالات الطرفية وخطة الإصلاح: const x = foo.bar()', history: [] });
ok(deep.model.tier === 'sol' && deep.model.id === 'gpt-5.6-sol', 'deep technical analysis must use Sol.');
ok(deep.verification.mode === 'self-check', 'deep technical analysis must enable strong self-check.');

const fresh = brain.routeBellaCognitionV26({ message: 'كم سعر الذهب اليوم؟', history: [] });
ok(fresh.freshness.useLiveWeb === true, 'current price must keep live-web freshness routing.');
ok(fresh.verification.mode === 'web', 'fresh claims must require external verification mode.');

const instruction = brain.bellaCognitionInstructionV26(deep);
must(instruction, 'هل جاوبت المطلوب؟', 'cognitive instruction must require answer-to-request verification.');
must(instruction, 'لا تعرضي سلسلة التفكير الداخلية', 'cognitive instruction must keep hidden reasoning private.');
must(instruction, 'الحالات الطرفية', 'technical cognition must check edge cases.');

must(gated, 'routeBellaCognitionV26', 'gated chat must derive the cognitive plan server-side.');
must(gated, 'cognitivePlan }, () => chatHandler', 'cognitive plan must stay request-scoped via AsyncLocalStorage.');
must(gated, 'X-Bella-Cognitive-Brain', 'v26 cognition diagnostics header is missing.');
must(gated, 'X-Bella-Model-Tier', 'model tier diagnostics header is missing.');

must(control, 'applyCognitiveBrainV26', 'OpenAI request patch does not apply the v26 brain.');
for (const model of ['gpt-5.6-luna','gpt-5.6-terra','gpt-5.6-sol']) must(cognition, model, `missing adaptive model ${model}.`);
must(control, 'body.model = plan.model.id', 'server-side model selection is not active.');
must(control, 'fetchOpenAiWithFallback', 'model availability fallback is missing.');
must(control, 'gpt-5-mini', 'existing model fallback must remain available.');
ok(!gated.includes('req.body?.model') && !gated.includes('req.body.model'), 'client must never choose the trusted model tier.');

must(health, 'cognitiveBrain: "v26"', 'health endpoint must expose the v26 cognitive brain.');

const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
ok(apiFunctions.length <= 12, `Hobby-plan guard: ${apiFunctions.length} API functions found; maximum is 12.`);

console.log('Bella v26 cognitive brain checks passed: adaptive Luna/Terra/Sol model routing, intent/ambiguity planning, private self-check, freshness verification, model fallback and request-scoped trust boundaries are wired.');
