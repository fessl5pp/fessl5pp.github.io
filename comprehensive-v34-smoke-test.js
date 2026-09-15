const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const app = read('app.js');
const ui = read('bella-ui.js');
const avatar = read('bella-avatar.js');
const sw = read('sw.js');
const e2e = read('tests/e2e/bella.spec.js');
const pkg = JSON.parse(read('package.json'));

assert.ok(app.includes('Bella v34 Comprehensive QA'), 'v34 release marker missing.');
assert.ok(app.includes('const scriptPromises = new Map()'), 'module loader must dedupe duplicate script requests.');
assert.ok(app.includes('scriptPromises.has(file)'), 'module loader dedupe guard missing.');
assert.ok(app.includes('scriptPromises.delete(file)'), 'failed script loads must remain retryable.');
assert.ok(app.includes('const backgroundModules = deferredModules.filter'), 'background/deferred split missing.');
assert.ok(app.includes('const adminModules = deferredModules.filter'), 'admin lazy-load split missing.');
assert.ok(app.includes('const schedule = () => loadBackground()'), 'normal boot must warm background modules only.');
assert.ok(!app.includes('const schedule = () => loadDeferred()'), 'owner/admin modules must not auto-load for every visitor.');
assert.ok(app.includes('parallel-fetch-ordered-execution+lazy-admin'), 'v34 boot diagnostics strategy missing.');
assert.ok(ui.includes('await window.__bellaLoadDeferred?.()'), 'settings must load admin modules on demand before permission checks.');
assert.ok(ui.includes('if (!modal.isConnected) return;'), 'async management refresh must not mutate a closed modal.');

const coreMatch = sw.match(/const CORE = \[([\s\S]*?)\];/);
assert.ok(coreMatch, 'PWA CORE list missing.');
const pwaCore = coreMatch[1];
assert.ok(sw.includes('bella-pwa-v34-comprehensive-qa'), 'PWA cache generation must be v34.');
assert.ok(pwaCore.includes('/bella-avatar-v10.webp'), 'approved Bella avatar must be precached.');
assert.ok(!pwaCore.includes('/bella-owner-center.js'), 'owner center must not be precached for normal users.');
assert.ok(!pwaCore.includes('/bella-moderator-center.js'), 'moderator center must not be precached for normal users.');
assert.ok(!pwaCore.includes('/bella-moments-cloud.js'), 'background cloud moments should cache on first use, not during install.');
assert.ok(sw.includes('Promise.allSettled(CORE.map(url => cache.add(url)))'), 'PWA install needs partial-cache recovery after a transient asset failure.');

assert.ok(avatar.includes('--bella-photo-scale'), 'avatar crop needs a stable scale variable.');
assert.ok(avatar.includes('transform:scale(var(--bella-photo-scale))'), 'avatar image must use stable container-specific crop.');
assert.ok(avatar.includes('img.loading = isHero ? "eager" : "lazy"'), 'hero/chat avatar loading priorities are not optimized.');
assert.ok(avatar.includes('img.fetchPriority = isHero ? "high" : "low"'), 'avatar fetch priority is missing.');
assert.ok(avatar.includes('data-bella-avatar-error'), 'avatar needs a visible fallback state on image failure.');
for (const mood of ['mood-happy', 'mood-cute', 'mood-angry']) {
  const rule = avatar.match(new RegExp(`\\.${mood.replace('-', '\\-')} \\.bella-avatar-photo\\{([^}]*)\\}`));
  assert.ok(rule, `${mood} photo rule missing.`);
  assert.ok(!rule[1].includes('transform:'), `${mood} must not change avatar crop/scale.`);
}

assert.ok(e2e.includes('approved Bella avatar v10 loads and keeps a stable crop across moods'), 'browser E2E must cover avatar v10.');
assert.ok(e2e.includes('has no horizontal layout overflow'), 'browser E2E must cover mobile overflow.');
assert.ok(e2e.includes('script[data-bella-module^="bella-owner-"]'), 'browser E2E must verify lazy owner bundles.');
assert.ok(!e2e.includes('#heroAvatar .bella-face'), 'stale CSS-face E2E assertion must stay removed.');

const [major, minor] = String(pkg.version || '').split('.').map(Number);
assert.ok(major > 3 || (major === 3 && minor >= 4), 'package release must be v3.4.0 or newer.');
assert.ok(String(pkg.scripts?.test || '').includes('comprehensive-v34-smoke-test.js'), 'v34 gate must run in npm test.');
assert.ok(String(pkg.scripts?.['vercel-build'] || '').includes('comprehensive-v34-smoke-test.js'), 'v34 gate must run before Vercel deploy.');

const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
assert.ok(apiFunctions.length <= 12, `Hobby-plan guard: ${apiFunctions.length} API functions found; maximum is 12.`);

console.log('Bella v34 comprehensive QA checks passed: deduped runtime loading, lazy admin, fresh resilient PWA cache, stable avatar v10 and browser regression coverage are locked in.');
