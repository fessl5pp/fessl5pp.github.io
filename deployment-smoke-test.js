const fs = require('fs');

function fail(message) {
  console.error(`Bella deployment regression failed: ${message}`);
  process.exit(1);
}
function currentAppGeneration(source) {
  return Number(source.match(/script\.src = `\/\$\{file\}\?v=(\d+)`/)?.[1] || 0);
}
function moduleGeneration(source, file) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = [...source.matchAll(new RegExp(`/${escaped}\\?v=(\\d+)`, 'g'))];
  return Math.max(0, ...matches.map(match => Number(match[1]) || 0));
}

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const pwaCore = sw.match(/const CORE = \[([\s\S]*?)\];/)?.[1] || '';
const health = fs.readFileSync('api/health.js', 'utf8');
const chat = fs.readFileSync('api/chat.js', 'utf8');
const gated = fs.readFileSync('api/gated-chat.js', 'utf8');
const cleanup = fs.readFileSync('code-cleanup-v25-smoke-test.js', 'utf8');

if (vercel.buildCommand !== 'npm run vercel-build') fail('Vercel must run the full regression gate before publishing.');
if (vercel.outputDirectory !== 'public') fail('Vercel must publish only the validated static output directory.');

const headerRule = source => (vercel.headers || []).find(rule => rule.source === source);
for (const source of ['/', '/index.html', '/sw.js', '/app.js']) {
  const rule = headerRule(source);
  const cache = rule?.headers?.find(header => header.key.toLowerCase() === 'cache-control')?.value || '';
  if (!/no-store/i.test(cache)) fail(`${source} must opt out of stale deployment caching.`);
}

const releaseHeader = headerRule('/')?.headers?.find(header => header.key.toLowerCase() === 'x-bella-release')?.value;
const shellRelease = Number(String(releaseHeader || '').match(/^v(\d+)$/)?.[1] || 0);
if (shellRelease < 25) fail(`The production shell must expose Bella release v25 or newer; got ${releaseHeader || 'missing'}.`);

if (!app.includes('Bella v25 Cleanup & Hardening')) fail('app.js v25 release marker is missing.');
const generation = currentAppGeneration(app);
if (generation < 25) fail(`Runtime modules must use cache generation v25 or newer; got ${generation || 'missing'}.`);
if (!app.includes('const coreModules') || !app.includes('const deferredModules')) fail('core/deferred performance split is missing.');

const coreModules = [
  'bella-brain-v2.js','bella-quality-v23.js','bella-context-v24.js','bella-memory-v3.js','bella-memory-v4.js','bella-memory-v5.js',
  'bella-alive.js','bella-feature-controls-v3.js','bella-season-v20.js','bella-resilience-v22.js'
];
for (const moduleName of coreModules) {
  if (!app.includes(moduleName)) fail(`current app loader missing ${moduleName}.`);
  if (moduleGeneration(pwaCore, moduleName) < 25) fail(`current service-worker core missing ${moduleName} under a v25-or-newer generation.`);
}

const lazyAdminModules = [
  'bella-owner-dashboard-v2.js','bella-owner-ops-v20.js','bella-owner-control-plane-v21.js','bella-owner-resilience-v22.js'
];
for (const moduleName of lazyAdminModules) {
  if (!app.includes(moduleName)) fail(`current deferred app loader missing ${moduleName}.`);
  if (moduleGeneration(pwaCore, moduleName) >= 25) fail(`${moduleName} must remain lazy and outside the normal-user PWA precache.`);
}
if (!app.includes('const adminModules = deferredModules.filter')) fail('v34 lazy-admin runtime split is missing.');
if (!app.includes('const schedule = () => loadBackground()')) fail('normal boot must not parse all owner/admin modules.');

if (!app.includes('bella-account-memory-v30.js')) fail('current app loader must use Bella account memory v30.');
if (moduleGeneration(pwaCore, 'bella-account-memory-v30.js') < 30) fail('service worker must precache Bella account memory v30.');
if (!sw.includes('bella-pwa-v26-release-25')) fail('Service worker must retain the v25 cache-generation history marker.');
if (!sw.includes('bella-pwa-v34-comprehensive-qa')) fail('Service worker must expose the v34 cache generation.');
if (!sw.includes('/app.js?v=11')) fail('Service worker must cache the exact app entry requested by index.html.');
if (!sw.includes('cache: "no-store"')) fail('Navigation requests must bypass stale browser HTTP caches.');

if (!health.includes('release: "v25"')) fail('Deployment health endpoint must preserve the stable shell release v25.');
if (!health.includes('cleanupHardening: "v25"')) fail('Deployment health endpoint must expose v25 cleanup hardening.');
if (!health.includes('databasePolicyHygiene: "v25"')) fail('Deployment health endpoint must expose v25 DB policy hygiene.');
if (!(health.includes('semanticMemory: "v24"') || health.includes('semanticMemory: "v30"'))) fail('Deployment health endpoint must expose semantic memory v24 or newer.');
if (!health.includes('memoryIntelligence: "v30"')) fail('Deployment health endpoint must expose Memory Intelligence v30.');
if (!health.includes('hybridContext: "v24"')) fail('Deployment health endpoint must preserve the v24 hybrid-context layer.');
if (!health.includes('contextualDialect: "v24"')) fail('Deployment health endpoint must preserve the v24 dialect selector.');
if (!health.includes('adaptiveBrain: "v23"')) fail('Deployment health endpoint must preserve the v23 adaptive brain layer.');
if (!health.includes('resilienceLab: "v22"')) fail('Deployment health endpoint must preserve v22 resilience diagnostics.');
if (!health.includes('VERCEL_GIT_COMMIT_SHA')) fail('Deployment health endpoint must report the active Git commit.');
if (!health.includes('Cache-Control')) fail('Deployment health endpoint must be non-cacheable.');
if (!chat.includes('routeBellaIntelligenceV23') || !chat.includes('reasoning: { effort: intelligence.reasoning.effort }')) fail('Dynamic reasoning router is not active in chat.');
if (!chat.includes('selectBellaDialectV24')) fail('Contextual dialect selector is not active in chat.');
if (!(gated.includes('enrichBellaSemanticMemoryV30') || gated.includes('enrichBellaSemanticMemoryV24'))) fail('Semantic memory enrichment is not active in gated chat.');
if (!cleanup.includes('Safe Mode must gate secondary AI before the usage-claim RPC')) fail('v25 Safe Mode quota regression protection is missing.');

console.log('Bella deployment regression checks passed: core runtime is precached, privileged admin runtime is lazy, and v22-v30 intelligence layers remain active.');
