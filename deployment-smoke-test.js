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
for (const source of ['/', '/index.html', '/sw.js']) {
  const rule = headerRule(source);
  const cache = rule?.headers?.find(header => header.key.toLowerCase() === 'cache-control')?.value || '';
  if (!/no-store/i.test(cache)) fail(`${source} must opt out of stale deployment caching.`);
}

const releaseHeader = headerRule('/')?.headers?.find(header => header.key.toLowerCase() === 'x-bella-release')?.value;
if (releaseHeader !== 'v13') fail('The production shell must expose Bella release v13.');

if (!app.includes('Bella v13 adaptive moments engine marker')) fail('app.js v13 release marker is missing.');
if (!app.includes('?v=16')) fail('Runtime modules must keep the validated v16 generation.');
if (!app.includes('bella-moments-ui.js')) fail('Moments intensity controls must load with the runtime.');
if (!sw.includes('bella-pwa-v15-release-13')) fail('Service worker cache generation was not rotated for v13.');
if (!sw.includes('?v=16')) fail('Service worker must precache the validated v16 runtime generation.');
if (!sw.includes('bella-moments-ui.js?v=16')) fail('Service worker must cache the moments controls.');
if (!sw.includes('cache: "no-store"')) fail('Navigation requests must bypass stale browser HTTP caches.');

if (!health.includes('release: "v13"')) fail('Deployment health endpoint must report release v13.');
if (!health.includes('VERCEL_GIT_COMMIT_SHA')) fail('Deployment health endpoint must report the active Git commit.');
if (!health.includes('Cache-Control')) fail('Deployment health endpoint must be non-cacheable.');

console.log('Bella v13 deployment regression checks passed: build gate, adaptive moments controls, PWA cache rotation and health endpoint are active.');
