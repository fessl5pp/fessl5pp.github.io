const fs = require('fs');
const vm = require('vm');

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing ${path}`);
  return fs.readFileSync(path, 'utf8');
}
function json(path) { return JSON.parse(read(path)); }

const corpus = json('evals/bella-v28-cases.json');
const rubric = json('evals/bella-v28-rubric.json');
const v23 = read('lib/bella-intelligence-v23.js');
const v26 = read('lib/bella-cognition-v26.js');
const v27 = read('lib/bella-metacognition-v27.js');
const persona = read('lib/bella-persona.js');
const gated = read('api/gated-chat.js');

const executable = [v23, v26, v27]
  .map(source => source
    .replace(/^import .*$/gm, '')
    .replace(/export async function /g, 'async function ')
    .replace(/export function /g, 'function '))
  .join('\n') + '\nthis.__brain={routeBellaMetacognitionV27};';

const sandbox = { URL, AbortController, setTimeout, clearTimeout };
vm.runInNewContext(executable, sandbox);
const brain = sandbox.__brain;
if (!brain || typeof brain.routeBellaMetacognitionV27 !== 'function') {
  throw new Error('Bella v28 eval harness cannot load the v27 brain.');
}

function checkExpectation(plan, expect) {
  const failures = [];
  const eq = (actual, expected, label) => {
    if (actual !== expected) failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  };
  if ('modelTier' in expect) eq(plan.model?.tier, expect.modelTier, 'modelTier');
  if (Array.isArray(expect.modelTierOneOf) && !expect.modelTierOneOf.includes(plan.model?.tier)) failures.push(`modelTier: expected one of ${expect.modelTierOneOf.join(',')}, got ${plan.model?.tier}`);
  if ('criticEnabled' in expect) eq(plan.critic?.enabled === true, expect.criticEnabled, 'criticEnabled');
  if ('liveWeb' in expect) eq(plan.freshness?.useLiveWeb === true, expect.liveWeb, 'liveWeb');
  if ('social' in expect) eq(plan.task?.social === true, expect.social, 'social');
  if ('correction' in expect) eq(plan.task?.correction === true, expect.correction, 'correction');
  if ('technical' in expect) eq(plan.task?.technical === true, expect.technical, 'technical');
  if ('sensitive' in expect) eq(plan.task?.sensitive === true, expect.sensitive, 'sensitive');
  if ('taskKind' in expect) eq(plan.task?.kind, expect.taskKind, 'taskKind');
  if ('verification' in expect) eq(plan.verification?.mode, expect.verification, 'verification');
  if ('confidenceNot' in expect && plan.confidence?.tier === expect.confidenceNot) failures.push(`confidence: must not be ${expect.confidenceNot}`);
  if ('confidenceCalibrated' in expect) eq(plan.confidence?.mustCalibrateLanguage === true, expect.confidenceCalibrated, 'confidenceCalibrated');
  if ('historyResolve' in expect) eq(plan.ambiguity?.useHistoryToResolve === true, expect.historyResolve, 'historyResolve');
  return failures;
}

if (!Array.isArray(corpus.cases) || corpus.cases.length < 90) {
  throw new Error(`Bella v28 corpus is too small: ${corpus.cases?.length || 0}; minimum is 90.`);
}

const results = [];
for (const testCase of corpus.cases) {
  const plan = brain.routeBellaMetacognitionV27({ message: testCase.message, history: testCase.history || [] });
  const failures = checkExpectation(plan, testCase.expect || {});
  results.push({ id: testCase.id, category: testCase.category, passed: failures.length === 0, failures, plan: {
    taskKind: plan.task?.kind,
    modelTier: plan.model?.tier,
    critic: plan.critic?.enabled === true,
    liveWeb: plan.freshness?.useLiveWeb === true,
    confidence: plan.confidence?.tier,
    ambiguity: plan.ambiguity?.tier
  }});
}

const byCategory = new Map();
for (const row of results) {
  const bucket = byCategory.get(row.category) || { total: 0, passed: 0 };
  bucket.total += 1;
  if (row.passed) bucket.passed += 1;
  byCategory.set(row.category, bucket);
}

const failures = results.filter(x => !x.passed);
const passed = results.length - failures.length;
const overall = passed / results.length;
const categoryScores = {};
let thresholdFailure = false;

for (const [category, bucket] of [...byCategory.entries()].sort()) {
  const score = bucket.passed / bucket.total;
  const minimum = Number(rubric.categoryMinimums?.[category] ?? 1);
  categoryScores[category] = { passed: bucket.passed, total: bucket.total, score, minimum };
  if (score < minimum) thresholdFailure = true;
}
if (overall < Number(rubric.overallMinimum || 1)) thresholdFailure = true;

const hardContracts = {
  kuwaiti_identity: persona.includes('بنت كويتية شابة'),
  anti_fabrication: persona.includes('لا تخترعين'),
  natural_dialect: persona.includes('لا «تقلدين» اللهجة الكويتية'),
  hidden_reasoning_privacy: v27.includes('لا تعرضي سلسلة التفكير'),
  critic_store_false: v27.includes('store: false'),
  server_side_routing: gated.includes('routeBellaMetacognitionV27') && !gated.includes('req.body?.model') && !gated.includes('req.body.model')
};
for (const contract of rubric.hardContracts || []) {
  if (hardContracts[contract] !== true) thresholdFailure = true;
}

console.log(`Bella v28 eval corpus: ${passed}/${results.length} passed (${(overall * 100).toFixed(1)}%).`);
for (const [category, score] of Object.entries(categoryScores)) {
  console.log(`  ${category}: ${score.passed}/${score.total} (${(score.score * 100).toFixed(1)}%, min ${(score.minimum * 100).toFixed(0)}%)`);
}
console.log(`  hard contracts: ${Object.values(hardContracts).filter(Boolean).length}/${Object.keys(hardContracts).length}`);

if (failures.length) {
  console.error('Bella v28 failed scenarios:');
  for (const row of failures.slice(0, 30)) console.error(`- ${row.id}: ${row.failures.join('; ')} | ${JSON.stringify(row.plan)}`);
  if (failures.length > 30) console.error(`... plus ${failures.length - 30} more failures.`);
}

if (thresholdFailure) {
  throw new Error(`Bella v28 evaluation gate failed: overall ${(overall * 100).toFixed(1)}%, required ${(Number(rubric.overallMinimum || 1) * 100).toFixed(0)}%.`);
}

console.log('Bella v28 evaluation gate passed: category floors and hard persona/safety contracts are intact.');
