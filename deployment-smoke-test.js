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

if (vercel.buildCommand !== 'npm run vercel-build') fail('Vercel must run the full regression gate before publishing.');
if (vercel.outputDirectory !== 'public') fail('Vercel must publish only the validated static output directory.');

const headerRule = source => (vercel.headers || []).find(rule => rule.source === source);
for (const source of ['/', '/index.html', '/sw.js', '/app.js']) {
  const rule = headerRule(source);
  const cache = rule?.headers?.find(header => header.key.toLowerCase() === 'cache-control')?.value || '';
  if (!/no-store/i.test(cache)) fail(`${source} must opt out of stale deployment caching.`);
}

const releaseHeader = headerRule('/')?.headers?.find(header => header.key.toLowerCase() === 'x-bella-release')?.value;
if (releaseHeader !== 'v23') fail('The production shell must expose Bella release v23.');

if (!app.includes('Bella v23 Adaptive Brain + Dynamic Reasoning + Relationship Vector + Knowledge Freshness + Correction Telemetry marker')) fail('app.js v23 release marker is missing.');
if (!app.includes('?v=23')) fail('Runtime modules must use the v23 cache generation.');
if (!app.includes('const coreModules') || !app.includes('const deferredModules')) fail('core/deferred performance split is missing.');
for (const moduleName of ['bella-brain-v2.js','bella-quality-v23.js','bella-memory-v3.js','bella-alive.js','bella-owner-dashboard-v2.js','bella-feature-controls-v3.js','bella-season-v20.js','bella-owner-ops-v20.js','bella-owner-control-plane-v21.js','bella-resilience-v22.js','bella-owner-resilience-v22.js']) {
  if (!app.includes(moduleName)) fail(`v23 app loader missing ${moduleName}.`);
  if (!sw.includes(`/${moduleName}?v=23`)) fail(`v23 service worker missing ${moduleName}.`);
}
if (!sw.includes('bella-pwa-v24-release-23')) fail('Service worker cache generation was not rotated for v23.');
if (!sw.includes('/app.js?v=11')) fail('Service worker must cache the exact app entry requested by index.html.');
if (!sw.includes('?v=23')) fail('Service worker must precache the v23 runtime generation.');
if (!sw.includes('cache: "no-store"')) fail('Navigation requests must bypass stale browser HTTP caches.');

if (!health.includes('release: "v23"')) fail('Deployment health endpoint must report release v23.');
if (!health.includes('adaptiveBrain: "v23"')) fail('Deployment health endpoint must expose the v23 adaptive brain layer.');
if (!health.includes('resilienceLab: "v22"')) fail('Deployment health endpoint must preserve v22 resilience diagnostics.');
if (!health.includes('VERCEL_GIT_COMMIT_SHA')) fail('Deployment health endpoint must report the active Git commit.');
if (!health.includes('Cache-Control')) fail('Deployment health endpoint must be non-cacheable.');
if (!chat.includes('routeBellaIntelligenceV23') || !chat.includes('reasoning: { effort: intelligence.reasoning.effort }')) fail('Dynamic reasoning router is not active in chat.');

console.log('Bella v23 deployment regression checks passed: adaptive reasoning, knowledge freshness, relationship vector, correction telemetry, v22 resilience and PWA cache rotation are active.');
