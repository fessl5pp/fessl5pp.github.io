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

const v23 = read('lib/bella-intelligence-v23.js');
const v26 = read('lib/bella-cognition-v26.js');
const v27 = read('lib/bella-metacognition-v27.js');
const gated = read('api/gated-chat.js');
const health = read('api/health.js');

const executable = [v23, v26, v27]
  .map(source => source.replace(/^import .*$/gm, '').replace(/export async function /g, 'async function ').replace(/export function /g, 'function '))
  .join('\n') + '\nthis.__brain={routeBellaMetacognitionV27,bellaMetacognitionInstructionV27};';
const sandbox = { URL, AbortController, setTimeout, clearTimeout };
vm.runInNewContext(executable, sandbox);
const brain = sandbox.__brain;
ok(brain && typeof brain.routeBellaMetacognitionV27 === 'function', 'v27 metacognitive router is unavailable.');

const social = brain.routeBellaMetacognitionV27({ message: 'هلا شلونج', history: [] });
ok(social.release === 'v27' && social.cognition?.release === 'v26', 'v27 must preserve the v26 cognitive plan.');
ok(social.model.tier === 'luna', 'social chat must stay on Luna.');
ok(social.critic.enabled === false, 'social chat must not pay critic latency/cost.');
ok(social.confidence.tier === 'high', 'simple social chat should remain high-confidence routing.');

const deep = brain.routeBellaMetacognitionV27({
  message: 'حلل لي هالكود بالتفصيل وحدد سبب الخطأ والحالات الطرفية وخطة الإصلاح: const x = foo.bar()',
  history: []
});
ok(deep.model.tier === 'sol', 'deep technical analysis must retain Sol routing.');
ok(deep.critic.enabled === true && deep.critic.tier === 'sol', 'deep technical analysis must select the strong critic.');
ok(deep.critic.model === 'gpt-5.6-sol', 'deep critic must use the trusted Sol model id.');

const correction = brain.routeBellaMetacognitionV27({
  message: 'لا مو جذي، قصدي ليش Supabase RLS يرجع صفر rows مع update؟',
  history: [{ role: 'assistant', content: 'يمكن المشكلة من insert policy' }]
});
ok(correction.task.correction === true, 'user correction signal must survive into v27.');
ok(correction.critic.enabled === true, 'complex technical correction must select the critic.');
ok(correction.assumptions.preserveUserCorrection === true, 'latest correction must override prior assumptions.');

const live = brain.routeBellaMetacognitionV27({ message: 'كم سعر الذهب اليوم؟', history: [] });
ok(live.freshness.useLiveWeb === true, 'freshness routing must remain active.');
ok(live.critic.enabled === false, 'live-web answers must skip the ungrounded second-pass critic.');

const ambiguous = brain.routeBellaMetacognitionV27({ message: 'هذا', history: [] });
ok(ambiguous.confidence.tier !== 'high', 'blocking ambiguity must lower confidence.');
ok(ambiguous.assumptions.preferQuestionOverGuess === true, 'blocking ambiguity must prefer one focused clarification over guessing.');

const instruction = brain.bellaMetacognitionInstructionV27(ambiguous);
must(instruction, 'لا تحولي الاحتمال إلى حقيقة', 'v27 must calibrate uncertainty.');
must(instruction, 'لا تعرضي سلسلة التفكير', 'v27 must keep private reasoning hidden.');
must(instruction, 'سؤالًا واحدًا محددًا', 'v27 must constrain clarification behavior.');

must(v27, 'reviewBellaAnswerV27', 'selective critic implementation is missing.');
must(v27, 'KEEP', 'critic must support no-op KEEP decisions.');
must(v27, 'FINAL:', 'critic must support corrected FINAL decisions.');
must(v27, 'new URL("https://api.openai.com/v1/responses")', 'critic call must remain isolated from the user-chat model patch.');
must(v27, 'store: false', 'critic calls must not enable OpenAI response storage.');
must(v27, '<REVIEW_INPUT>', 'critic input must be explicitly delimited as untrusted data.');

must(gated, 'routeBellaMetacognitionV27', 'gated chat must derive v27 plan server-side.');
must(gated, 'reviewBellaAnswerV27', 'gated chat must run the selective critic before sending selected replies.');
must(gated, 'stream: false', 'critic-selected replies must be buffered before delivery.');
must(gated, 'cognitivePlan: metacognitivePlan.cognition', 'v26 model routing must remain request-scoped under v27.');
must(gated, 'metacognitivePlan', 'v27 plan must remain request-scoped.');
ok(!gated.includes('req.body?.model') && !gated.includes('req.body.model'), 'client must never select the trusted model/critic tier.');

must(health, 'metacognitiveBrain: "v27"', 'health endpoint must expose v27 metacognition.');
must(health, 'selectiveCritic: "v27"', 'health endpoint must expose the v27 critic.');

const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
ok(apiFunctions.length <= 12, `Hobby-plan guard: ${apiFunctions.length} API functions found; maximum is 12.`);

console.log('Bella v27 metacognitive brain checks passed: confidence calibration, assumption tracking, selective buffered critic, correction priority, live-web critic isolation and v26 model routing compatibility are wired.');
