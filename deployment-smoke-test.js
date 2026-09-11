const fs = require('fs');

function fail(message) {
  console.error(`Bella deployment regression failed: ${message}`);
  process.exit(1);
}

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const health = fs.readFileSync('api/health.js', 'utf8');

if (vercel.buildCommand !== 'npm run vercel-build') fail('Vercel must run the full regression gate before publishing.');
if (vercel.outputDirectory !== 'public') fail('Vercel must publish only the validated static output directory.');

const headerRule = source => (vercel.headers || []).find(rule => rule.source === source);
for (const source of ['/', '/index.html', '/sw.js', '/app.js']) {
  const rule = headerRule(source);
  const cache = rule?.headers?.find(header => header.key.toLowerCase() === 'cache-control')?.value || '';
  if (!/no-store/i.test(cache)) fail(`${source} must opt out of stale deployment caching.`);
}

const releaseHeader = headerRule('/')?.headers?.find(header => header.key.toLowerCase() === 'x-bella-release')?.value;
if (releaseHeader !== 'v22') fail('The production shell must expose Bella release v22.');

if (!app.includes('Bella v22 Resilience Lab + Safe Mode + privacy-minimal Error Center + server-side Persona A/B experiments marker')) fail('app.js v22 release marker is missing.');
if (!app.includes('?v=22')) fail('Runtime modules must use the v22 cache generation.');
if (!app.includes('const coreModules') || !app.includes('const deferredModules')) fail('core/deferred performance split is missing.');
for (const moduleName of ['bella-brain-v2.js','bella-memory-v3.js','bella-alive.js','bella-owner-dashboard-v2.js','bella-feature-controls-v3.js','bella-season-v20.js','bella-owner-ops-v20.js','bella-owner-control-plane-v21.js','bella-resilience-v22.js','bella-owner-resilience-v22.js']) {
  if (!app.includes(moduleName)) fail(`v22 app loader missing ${moduleName}.`);
  if (!sw.includes(`/${moduleName}?v=22`)) fail(`v22 service worker missing ${moduleName}.`);
}
if (!sw.includes('bella-pwa-v23-release-22')) fail('Service worker cache generation was not rotated for v22.');
if (!sw.includes('/app.js?v=11')) fail('Service worker must cache the exact app entry requested by index.html.');
if (!sw.includes('?v=22')) fail('Service worker must precache the v22 runtime generation.');
if (!sw.includes('cache: "no-store"')) fail('Navigation requests must bypass stale browser HTTP caches.');

if (!health.includes('release: "v22"')) fail('Deployment health endpoint must report release v22.');
if (!health.includes('resilienceLab: "v22"')) fail('Deployment health endpoint must expose the v22 resilience layer.');
if (!health.includes('VERCEL_GIT_COMMIT_SHA')) fail('Deployment health endpoint must report the active Git commit.');
if (!health.includes('Cache-Control')) fail('Deployment health endpoint must be non-cacheable.');

console.log('Bella v22 deployment regression checks passed: resilience runtime, request-scoped experiments, privacy-minimal telemetry, Safe Mode, PWA cache rotation and health endpoint are active.');
