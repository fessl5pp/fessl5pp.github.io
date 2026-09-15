const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const threadSource = fs.readFileSync('lib/bella-goal-thread-v31.js', 'utf8');
const gated = fs.readFileSync('api/gated-chat.js', 'utf8');
const semantic = fs.readFileSync('lib/bella-semantic-memory-v30.js', 'utf8');
const health = fs.readFileSync('api/health.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const runnable = `${threadSource
  .replace(/export function buildBellaGoalThreadV31/g, 'function buildBellaGoalThreadV31')
  .replace(/export function bellaGoalThreadInstructionV31/g, 'function bellaGoalThreadInstructionV31')}\nthis.__v31={buildBellaGoalThreadV31,bellaGoalThreadInstructionV31};`;
const sandbox = { String, Number, Math, Array, Object, Set, RegExp };
vm.runInNewContext(runnable, sandbox);
const { buildBellaGoalThreadV31, bellaGoalThreadInstructionV31 } = sandbox.__v31;
assert.equal(typeof buildBellaGoalThreadV31, 'function', 'v31 thread planner must be executable');

const technicalHistory = [
  { role: 'user', content: 'صلح لي خطأ Supabase في تسجيل الدخول، بدون endpoint جديد وخلك على نفس الـ API' },
  { role: 'assistant', content: 'لقيت السبب وعدلت التحقق الأول.' }
];
const continued = buildBellaGoalThreadV31({ message: 'كمل', history: technicalHistory });
assert.equal(continued.mode, 'continue', 'كمل must resolve as continuation when history exists');
assert.equal(continued.goalKind, 'fix', 'continuation must inherit the prior technical goal');
assert.equal(continued.resolvedFromHistory, true, 'continuation must resolve from recent history');
assert.ok(continued.anchor.includes('Supabase'), 'continuation anchor must preserve the relevant prior user turn');
assert.ok(continued.retrievalQuery.includes('Supabase') && continued.retrievalQuery.includes('كمل'), 'memory retrieval query must combine anchor + current follow-up');
assert.ok(continued.constraints.some(x => /بدون endpoint/i.test(x)), 'explicit constraints must carry across the thread');
assert.equal(continued.confidence, 'high', 'clear continuation should resolve with high thread confidence');

const revised = buildBellaGoalThreadV31({
  message: 'لا مو جذي، قصدي بدون endpoint جديد',
  history: technicalHistory
});
assert.equal(revised.mode, 'revise', 'explicit correction must be classified as revise');
assert.equal(revised.resolvedFromHistory, true, 'revision must stay attached to the previous thread');
assert.ok(revised.constraints.some(x => /بدون endpoint/i.test(x)), 'new correction constraints must override/carry forward');

const reused = buildBellaGoalThreadV31({ message: 'نفسه بس اختصره', history: technicalHistory });
assert.equal(reused.mode, 'reuse', 'نفسه must reuse the recent referent');
assert.ok(reused.anchor.includes('Supabase'), 'reuse mode must retain its anchor');

const noHistory = buildBellaGoalThreadV31({ message: 'كمل', history: [] });
assert.equal(noHistory.mode, 'new', 'follow-up words without history must not fabricate a referent');
assert.equal(noHistory.resolvedFromHistory, false, 'no-history follow-up must stay unresolved');
assert.equal(noHistory.anchor, '', 'no-history follow-up must not invent an anchor');

const instruction = bellaGoalThreadInstructionV31(continued);
assert.ok(instruction.includes('Bella Goal & Thread Intelligence v31'), 'trusted v31 behavior instruction marker missing');
assert.ok(instruction.includes('لا تعيدي سؤالًا سبق أن أجاب عنه المستخدم'), 'v31 must explicitly avoid repeated clarification questions');
assert.ok(instruction.includes('بيانات مستخدم غير موثوقة'), 'v31 must keep derived goals/constraints untrusted');

assert.ok(!threadSource.includes('localStorage'), 'v31 goal/thread state must not persist to localStorage');
assert.ok(!threadSource.includes('sessionStorage'), 'v31 goal/thread state must not persist to sessionStorage');
assert.ok(!threadSource.includes('supabase.co') && !threadSource.includes('/rest/v1'), 'v31 goal/thread state must not persist to Supabase');

assert.ok(gated.includes('buildBellaGoalThreadV31'), 'gated chat must build v31 thread state');
assert.ok(gated.includes('planningMessage = goalThreadV31.resolvedFromHistory'), 'resolved follow-ups must route cognition using the expanded planning message');
assert.ok(gated.includes('req.bellaGoalThreadV31 = goalThreadV31'), 'request-scoped v31 state must be attached server-side');
assert.ok(gated.includes('bellaGoalThreadInstructionV31'), 'v31 behavior contract must reach the cognitive instruction layer');
assert.ok(gated.includes('X-Bella-Goal-Thread'), 'v31 diagnostic header missing');
assert.ok(gated.includes('threadResolvedFromHistory'), 'v31 response diagnostics must expose whether a reference was resolved');

assert.ok(semantic.includes('req?.bellaGoalThreadV31?.retrievalQuery'), 'semantic memory must use the v31 expanded query for follow-ups');
assert.ok(semantic.includes('threadExpanded'), 'semantic memory diagnostics must report thread-expanded retrieval');
assert.ok(health.includes('goalThreadIntelligence: "v31"'), 'health endpoint must expose v31 goal/thread intelligence');
assert.ok(health.includes('goalThreadPersistence: false'), 'health must explicitly disclose that v31 goal state is not persisted');
assert.ok(health.includes('threadExpandedMemoryRetrieval: true'), 'health must expose thread-aware memory retrieval');
assert.equal(pkg.version, '3.1.0', 'package release must be 3.1.0');

const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
assert.ok(apiFunctions.length <= 12, `Hobby plan guard: ${apiFunctions.length} API functions found; maximum is 12.`);

console.log('Bella v31 Goal & Thread Intelligence checks passed: follow-up resolution, constraint carryover, correction/reuse modes, expanded memory retrieval, no goal persistence and Hobby-plan limits are intact.');
