const fs = require('fs');
const vm = require('vm');

function fail(message) {
  console.error(`Bella v23 adaptive brain smoke failed: ${message}`);
  process.exit(1);
}
function ok(condition, message) { if (!condition) fail(message); }

const router = fs.readFileSync('lib/bella-intelligence-v23.js', 'utf8');
const chat = fs.readFileSync('api/chat.js', 'utf8');
const brain = fs.readFileSync('bella-brain-v2.js', 'utf8');
const quality = fs.readFileSync('bella-quality-v23.js', 'utf8');
const migration = fs.readFileSync('supabase/migrations/20260911155721_bella_adaptive_brain_v23.sql', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

const routerTestSource = `${router.replace(/export function /g, 'function ')}\nthis.__bellaV23={bellaFreshnessRouteV23,bellaReasoningRouteV23,routeBellaIntelligenceV23};`;
const routerSandbox = {};
vm.runInNewContext(routerTestSource, routerSandbox);
const route = routerSandbox.__bellaV23;
ok(route, 'router exports are unavailable');

ok(route.bellaReasoningRouteV23('هلا شلونج').effort === 'low', 'simple social chat must stay low reasoning');
ok(['medium','high'].includes(route.bellaReasoningRouteV23('حلل لي هالكود وحدد سبب الخطأ وخطة الإصلاح: const x = foo.bar()').effort), 'technical debugging must escalate reasoning');
ok(route.bellaFreshnessRouteV23('كم سعر الذهب اليوم؟').useLiveWeb === true, 'current price must use live web');
ok(route.bellaFreshnessRouteV23('من هو رئيس الوزراء الحالي؟').tier === 'required', 'current officeholder must require freshness');
ok(route.bellaFreshnessRouteV23('شنو عاصمة فرنسا؟').useLiveWeb === false, 'evergreen fact must not force web search');

ok(chat.includes('routeBellaIntelligenceV23'), 'chat does not use the v23 router');
ok(chat.includes('reasoning: { effort: intelligence.reasoning.effort }'), 'reasoning effort is not dynamic');
ok(chat.includes('search_context_size: intelligence.freshness.searchContextSize'), 'web search context is not freshness-aware');
ok(chat.includes('relationshipVector'), 'relationship vector is not passed to server context');
ok(chat.includes('X-Bella-Reasoning') && chat.includes('X-Bella-Freshness'), 'stream diagnostics headers missing');

const memory = new Map();
let correctionSignal = null;
const brainSandbox = {
  window: { BellaQualityV23: { recordCorrection: (kind, relation) => { correctionSignal = { kind, relation }; } } },
  localStorage: { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) },
  queueMicrotask: fn => fn(),
  Date,
  Math,
  JSON,
  Set,
  Object,
  Number,
  String,
  Array,
  RegExp
};
vm.runInNewContext(brain, brainSandbox);
const b = brainSandbox.window.BellaBrainV23;
ok(b && typeof b.relationshipVector === 'function', 'BellaBrainV23 relationship vector API missing');
for (let i = 0; i < 12; i++) b.record(i % 3 === 0 ? 'هههه امزح' : 'هلا');
b.record('لا مو جذي قصدي شي ثاني');
const snap = b.snapshot();
ok(snap.version === 4, 'brain state did not migrate to v4');
ok(snap.vector && Number.isFinite(snap.vector.familiarity) && Number.isFinite(snap.vector.warmth) && Number.isFinite(snap.vector.playfulness), 'relationship vector is invalid');
ok(correctionSignal && ['clarification','negation','explicit_wrong','correction'].includes(correctionSignal.kind), 'correction signal was not emitted');

ok(quality.includes('aggregate-only; no raw message text or user identifier'), 'privacy policy marker missing');
ok(!quality.includes('p_message') && !quality.includes('message_text'), 'quality client must not upload raw messages');
ok(migration.includes('bella_quality_metrics_v23'), 'quality metrics table missing');
ok(migration.includes('revoke all on table public.bella_quality_metrics_v23 from anon, authenticated'), 'direct table access is not revoked');
ok(migration.includes("set search_path = ''"), 'SECURITY DEFINER functions must pin empty search_path');
ok(!/message_text|raw_message|stack_trace/i.test(migration), 'migration must not persist raw chat/error content');

ok(app.includes('Bella v23 Adaptive Brain'), 'v23 app marker missing');
ok(app.includes('bella-quality-v23.js') && (app.includes('?v=23') || app.includes('?v=24')), 'v23 client runtime must remain loaded under current generation');
ok(sw.includes('bella-pwa-v24-release-23'), 'v23 cache generation marker must remain available for regression history');
ok(sw.includes('/bella-quality-v23.js?v=24') || sw.includes('/bella-quality-v23.js?v=23'), 'quality runtime is not precached under the current release.');

console.log('Bella v23 adaptive brain checks passed under the current release: dynamic reasoning, freshness routing, relationship vector and privacy-minimal correction telemetry remain wired.');
