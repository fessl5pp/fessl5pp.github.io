const fs = require('fs');

function fail(message) {
  console.error(`Bella deployment regression failed: ${message}`);
  process.exit(1);
}

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const health = fs.readFileSync('api/health.js', 'utf8');
const chat = fs.readFileSync('api/chat.js', 'utf8');
const gated = fs.readFileSync('api/gated-chat.js', 'utf8');

if (vercel.buildCommand !== 'npm run vercel-build') fail('Vercel must run the full regression gate before publishing.');
if (vercel.outputDirectory !== 'public') fail('Vercel must publish only the validated static output directory.');

const headerRule = source => (vercel.headers || []).find(rule => rule.source === source);
for (const source of ['/', '/index.html', '/sw.js', '/app.js']) {
  const rule = headerRule(source);
  const cache = rule?.headers?.find(header => header.key.toLowerCase() === 'cache-control')?.value || '';
  if (!/no-store/i.test(cache)) fail(`${source} must opt out of stale deployment caching.`);
}

const releaseHeader = headerRule('/')?.headers?.find(header => header.key.toLowerCase() === 'x-bella-release')?.value;
if (releaseHeader !== 'v24') fail('The production shell must expose Bella release v24.');

if (!app.includes('Bella v24 Semantic Memory + Hybrid Context + Memory Distiller + Temporal Decay + Contextual Dialect marker')) fail('app.js v24 release marker is missing.');
if (!app.includes('?v=24')) fail('Runtime modules must use the v24 cache generation.');
if (!app.includes('const coreModules') || !app.includes('const deferredModules')) fail('core/deferred performance split is missing.');
for (const moduleName of ['bella-brain-v2.js','bella-quality-v23.js','bella-context-v24.js','bella-memory-v3.js','bella-memory-v4.js','bella-alive.js','bella-owner-dashboard-v2.js','bella-feature-controls-v3.js','bella-season-v20.js','bella-owner-ops-v20.js','bella-owner-control-plane-v21.js','bella-resilience-v22.js','bella-owner-resilience-v22.js']) {
  if (!app.includes(moduleName)) fail(`v24 app loader missing ${moduleName}.`);
  if (!sw.includes(`/${moduleName}?v=24`)) fail(`v24 service worker missing ${moduleName}.`);
}
if (!sw.includes('bella-pwa-v25-release-24')) fail('Service worker cache generation was not rotated for v24.');
if (!sw.includes('/app.js?v=11')) fail('Service worker must cache the exact app entry requested by index.html.');
if (!sw.includes('?v=24')) fail('Service worker must precache the v24 runtime generation.');
if (!sw.includes('cache: "no-store"')) fail('Navigation requests must bypass stale browser HTTP caches.');

if (!health.includes('release: "v24"')) fail('Deployment health endpoint must report release v24.');
if (!health.includes('semanticMemory: "v24"')) fail('Deployment health endpoint must expose the v24 semantic-memory layer.');
if (!health.includes('hybridContext: "v24"')) fail('Deployment health endpoint must expose the v24 hybrid-context layer.');
if (!health.includes('contextualDialect: "v24"')) fail('Deployment health endpoint must expose the v24 dialect selector.');
if (!health.includes('adaptiveBrain: "v23"')) fail('Deployment health endpoint must preserve the v23 adaptive brain layer.');
if (!health.includes('resilienceLab: "v22"')) fail('Deployment health endpoint must preserve v22 resilience diagnostics.');
if (!health.includes('VERCEL_GIT_COMMIT_SHA')) fail('Deployment health endpoint must report the active Git commit.');
if (!health.includes('Cache-Control')) fail('Deployment health endpoint must be non-cacheable.');
if (!chat.includes('routeBellaIntelligenceV23') || !chat.includes('reasoning: { effort: intelligence.reasoning.effort }')) fail('Dynamic reasoning router is not active in chat.');
if (!chat.includes('selectBellaDialectV24')) fail('Contextual dialect selector is not active in chat.');
if (!gated.includes('enrichBellaSemanticMemoryV24')) fail('Semantic memory enrichment is not active in gated chat.');

console.log('Bella v24 deployment regression checks passed: v23 adaptive reasoning, pgvector semantic durable memory, local hybrid context, Memory v4, contextual dialect, v22 resilience and PWA cache rotation are active.');
