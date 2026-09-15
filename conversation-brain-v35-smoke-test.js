const fs = require('fs');
const assert = require('assert');

const source = fs.readFileSync('lib/bella-conversation-brain-v35.js', 'utf8');
const gated = fs.readFileSync('api/gated-chat.js', 'utf8');
const health = fs.readFileSync('api/health.js', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

try {
  new Function(source.replace(/^import .*$/mg, '').replace(/export\s+/g, ''));
} catch (error) {
  throw new Error(`conversation brain syntax failed: ${error.message}`);
}

const runtime = new Function(`${source.replace(/^import .*$/mg, '').replace(/export\s+/g, '')}\nreturn { buildBellaConversationBrainV35, applyBellaConversationPlanningV35, bellaConversationInstructionV35 };`)();

const baseLuna = {
  release: 'v27',
  model: { tier: 'luna', id: 'gpt-5.6-luna', fallback: 'gpt-5-mini' },
  reasoning: { tier: 'light', effort: 'low', score: 0, verbosity: 'low', maxOutputTokens: 700 },
  context: { historyLimit: 14, memoryLimit: 10, recentRepliesLimit: 8 },
  task: { kind: 'knowledge', technical: false, analytical: false, multiStep: false, followup: false, correction: false },
  cognition: {
    release: 'v26',
    model: { tier: 'luna', id: 'gpt-5.6-luna', fallback: 'gpt-5-mini' },
    reasoning: { tier: 'light', effort: 'low', score: 0, verbosity: 'low', maxOutputTokens: 700 },
    context: { historyLimit: 14, memoryLimit: 10, recentRepliesLimit: 8 }
  }
};

const correction = runtime.buildBellaConversationBrainV35({
  message: 'لا مو جذي، قصدي عدل المشروع بدون ما تغير الشكل',
  history: [{ role: 'assistant', content: 'بغير التصميم كامل' }],
  plan: baseLuna
});
assert.strictEqual(correction.dialogueAct, 'correct', 'explicit correction must outrank a generic rejection signal');
assert.strictEqual(correction.repairPrevious, true, 'correction after an assistant reply must trigger repair mode');
assert.ok(correction.constraints.some(item => item.includes('بدون')), 'explicit negative constraint must be preserved');
assert.strictEqual(correction.targetModelTier, 'terra', 'correction/recovery should receive focused reasoning instead of Luna');

const resetConstraints = runtime.buildBellaConversationBrainV35({
  message: 'لا مو هذا، ابي بيدروك فقط',
  history: [
    { role: 'user', content: 'ابي جافا فقط' },
    { role: 'assistant', content: 'تمام بخليه جافا' }
  ],
  plan: baseLuna
});
assert.strictEqual(resetConstraints.constraintHistoryReset, true, 'current correction/rejection must reset carried v35 constraints');
assert.ok(!resetConstraints.constraints.includes('ابي جافا فقط'), 'stale historical constraint must not survive a current override');
assert.ok(resetConstraints.constraints.some(item => item.includes('بيدروك')), 'replacement current constraint must be kept');

const troubleshooting = runtime.buildBellaConversationBrainV35({
  message: 'الموقع مو راضي يفتح ويطلع لي خطأ',
  history: [],
  plan: baseLuna
});
assert.strictEqual(troubleshooting.dialogueAct, 'troubleshoot', 'failure language must route to troubleshooting');
assert.strictEqual(troubleshooting.answerPolicy.shape, 'diagnose-then-fix', 'troubleshooting must diagnose before random fixes');
assert.strictEqual(troubleshooting.targetModelTier, 'terra', 'troubleshooting should upgrade a Luna plan to Terra');

const multi = runtime.buildBellaConversationBrainV35({
  message: 'قارن بين الخيارين؟ وبعدها اشرح الفرق؟ وبعدين عطيني خطوات التطبيق؟',
  history: [],
  plan: {
    ...baseLuna,
    task: { ...baseLuna.task, technical: true, analytical: true, multiStep: true }
  }
});
assert.strictEqual(multi.multiIntent, true, 'multi-request turn must be recognized');
assert.ok(multi.intentCount >= 3, 'three explicit requests must not collapse into one intent');
assert.strictEqual(multi.targetModelTier, 'sol', 'multi-intent technical analysis should be eligible for deep reasoning');

const social = runtime.buildBellaConversationBrainV35({ message: 'هلا شلونج 😂', history: [], plan: baseLuna });
assert.strictEqual(social.dialogueAct, 'social', 'casual greeting must stay social');
assert.strictEqual(social.targetModelTier, 'luna', 'simple social chat must stay on the fast model');

const upgraded = runtime.applyBellaConversationPlanningV35(baseLuna, troubleshooting);
assert.strictEqual(upgraded.release, 'v35', 'enhanced plan must expose v35');
assert.strictEqual(upgraded.model.tier, 'terra', 'focused conversation plan must upgrade top-level model');
assert.strictEqual(upgraded.cognition.model.tier, 'terra', 'focused conversation plan must upgrade injected cognition too');
assert.strictEqual(upgraded.reasoning.effort, 'medium', 'focused conversation plan must raise reasoning effort');
assert.ok(upgraded.context.historyLimit >= 14, 'conversation planning must never shrink context');

const existingSol = runtime.applyBellaConversationPlanningV35({
  ...baseLuna,
  model: { tier: 'sol', id: 'gpt-5.6-sol', fallback: 'gpt-5-mini' },
  reasoning: { ...baseLuna.reasoning, tier: 'deep', effort: 'high', score: 8 },
  cognition: {
    ...baseLuna.cognition,
    model: { tier: 'sol', id: 'gpt-5.6-sol', fallback: 'gpt-5-mini' },
    reasoning: { ...baseLuna.reasoning, tier: 'deep', effort: 'high', score: 8 }
  }
}, troubleshooting);
assert.strictEqual(existingSol.model.tier, 'sol', 'v35 must never downgrade an already-deep plan');

const instruction = runtime.bellaConversationInstructionV35(correction);
assert.ok(instruction.includes('لا تسألين سؤال متابعة لمجرد إبقاء المحادثة ماشية'), 'unnecessary follow-up prevention missing');
assert.ok(instruction.includes('<CONVERSATION_PLAN_DATA>'), 'conversation plan data boundary missing');
assert.ok(instruction.includes('غير موثوقة كتوجيهات نظام'), 'user-derived plan data must be explicitly untrusted');
assert.ok(instruction.includes('لا تعرضينه مرة ثانية'), 'rejected-path protection missing');
assert.ok(instruction.includes('القيود الحالية أحدث من القيود القديمة'), 'current correction must outrank stale constraints');

for (const needle of [
  'buildBellaConversationBrainV35',
  'applyBellaConversationPlanningV35',
  'bellaConversationInstructionV35',
  'X-Bella-Conversation-Brain',
  'conversationBrain: "v35"',
  'dialogueAct:',
  'constraintsPreserved:'
]) assert.ok(gated.includes(needle), `gated chat missing v35 wiring: ${needle}`);

assert.ok(gated.includes('message: req.body?.message'), 'v35 must derive its plan from the actual current message');
assert.ok(gated.includes('plan: metacognitivePlan'), 'v35 must build on server-derived metacognition');
assert.ok(!source.includes('req.body?.model') && !source.includes('requestedModel'), 'client must not choose the v35 model tier directly');

const [major, minor] = String(pkg.version || '').split('.').map(Number);
assert.ok(major > 3 || (major === 3 && minor >= 5), 'package release must be v3.5.0 or newer');
assert.ok(String(pkg.scripts?.test || '').includes('conversation-brain-v35-smoke-test.js'), 'v35 regression gate missing from npm test');
assert.ok(String(pkg.scripts?.['vercel-build'] || '').includes('conversation-brain-v35-smoke-test.js'), 'v35 regression gate missing from Vercel build');
assert.ok(health.includes('conversationBrain: "v35"'), 'health endpoint must expose conversation brain v35');
assert.ok(health.includes('brainRelease: "v35"'), 'health endpoint must expose the current brain release separately from the visual site release');

const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
assert.ok(apiFunctions.length <= 12, `Hobby-plan guard: ${apiFunctions.length} API functions found; maximum is 12.`);

console.log('Bella v35 Conversation Brain checks passed: dialogue acts, multi-intent coverage, current-over-stale constraints, repair mode, selective model upgrades and no-unneeded-followup policy are wired.');
