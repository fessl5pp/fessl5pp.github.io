const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const visual = read('bella-visual-v32.css');
const vnextCss = read('bella-vnext.css');
const avatar = read('bella-avatar.js');
const sw = read('sw.js');
const staticRelease = read('prepare-static.js');
const pkg = JSON.parse(read('package.json'));

assert.ok(vnextCss.startsWith("@import url('/bella-visual-v32.css?v=32');"), 'v32 visual system must be loaded before legacy vNext rules.');
assert.ok(visual.includes('Bella v32 — Visual System'), 'v32 visual stylesheet marker missing.');
assert.ok(visual.includes('@media (min-width:760px)'), 'desktop app-shell treatment is missing.');
assert.ok(visual.includes('@media (max-width:759px)'), 'mobile full-screen treatment is missing.');
assert.ok(visual.includes('@media (prefers-reduced-motion:reduce)'), 'v32 design must respect reduced motion.');
assert.ok(visual.includes('button:focus-visible') && visual.includes('input:focus-visible'), 'keyboard focus treatment is missing.');
assert.ok(visual.includes('.chat-win') && visual.includes('.msg-box') && visual.includes('.input-area'), 'chat surface redesign is incomplete.');
assert.ok(visual.includes('.hero') && visual.includes('.top-island') && visual.includes('.badges-wrap'), 'landing surface redesign is incomplete.');
assert.ok(visual.includes('.vnext-card') && visual.includes('.bella-activities-card'), 'modal/tool surfaces must share the v32 visual language.');

assert.ok(avatar.includes('version: 9'), 'Bella avatar identity must be v9 for the v32 redesign.');
for (const marker of ['bella-portrait','bella-hair-back','bella-hair-front','bella-iris','bella-earring','bella-kuwait-mark']) {
  assert.ok(avatar.includes(marker), `v32 avatar is missing ${marker}.`);
}
assert.ok(avatar.includes('mood-angry') && avatar.includes('mood-cute') && avatar.includes('mood-happy') && avatar.includes('mood-chill'), 'v32 avatar must remain mood-reactive.');
assert.ok(avatar.includes('aria-label'), 'v32 avatar must keep accessible identity labels.');
assert.ok(!avatar.includes('fetch('), 'visual avatar must never add network requests.');

assert.ok(sw.includes('/bella-visual-v32.css?v=32'), 'PWA must cache the v32 visual layer.');
assert.ok(staticRelease.includes("'bella-visual-v32.css'"), 'static release must ship the v32 visual stylesheet.');
assert.ok(staticRelease.includes("read('bella-visual-v32.css')"), 'asset reference graph must include the v32 stylesheet.');

const [major, minor] = String(pkg.version || '').split('.').map(Number);
assert.ok(major > 3 || (major === 3 && minor >= 2), 'package release must be v3.2.0 or newer.');
assert.ok(String(pkg.scripts?.test || '').includes('visual-redesign-v32-smoke-test.js'), 'v32 visual regression gate must run in npm test.');
assert.ok(String(pkg.scripts?.['vercel-build'] || '').includes('visual-redesign-v32-smoke-test.js'), 'v32 visual regression gate must run before Vercel deploy.');

const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
assert.ok(apiFunctions.length <= 12, `Hobby-plan guard: ${apiFunctions.length} API functions found; maximum is 12.`);

console.log('Bella v32 visual redesign checks passed: unified responsive shell, desktop/mobile chat, accessible controls, mood-reactive avatar v9, PWA/static shipping and Hobby-plan limits are intact.');
