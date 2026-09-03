const fs = require('fs');

function fail(message) {
  console.error(`Bella deployment regression failed: ${message}`);
  process.exit(1);
}

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');
const health = fs.readFileSync('api/health.js', 'utf8');

if (vercel.buildCommand !== 'npm run vercel-build') {
  fail('Vercel must run the full regression gate before publishing.');
}
if (vercel.outputDirectory !== 'public') {
  fail('Vercel must publish only the validated static output directory.');
}

const headerRule = source => (vercel.headers || []).find(rule => rule.source === source);
for (const source of ['/', '/index.html', '/sw.js']) {
  const rule = headerRule(source);
  const cache = rule?.headers?.find(header => header.key.toLowerCase() === 'cache-control')?.value || '';
  if (!/no-store/i.test(cache)) fail(`${source} must opt out of stale deployment caching.`);
}

const releaseHeader = headerRule('/')?.headers?.find(header => header.key.toLowerCase() === 'x-bella-release')?.value;
if (releaseHeader !== 'v10') fail('The production shell must expose Bella release v10.');

if (!app.includes('Bella v10 deployment-security release marker')) fail('app.js release marker is missing.');
if (!app.includes('?v=16')) fail('Runtime modules must keep the validated v16 generation.');
if (!sw.includes('bella-pwa-v12-release-10')) fail('Service worker cache generation was not rotated.');
if (!sw.includes('?v=16')) fail('Service worker must precache the validated v16 runtime generation.');
if (!sw.includes('cache: "no-store"')) fail('Navigation requests must bypass stale browser HTTP caches.');

if (!health.includes('release: "v10"')) fail('Deployment health endpoint must report release v10.');
if (!health.includes('VERCEL_GIT_COMMIT_SHA')) fail('Deployment health endpoint must report the active Git commit.');
if (!health.includes('Cache-Control')) fail('Deployment health endpoint must be non-cacheable.');

console.log('Bella deployment regression checks passed: build gate, static output, release headers, cache rotation and health endpoint are active.');
