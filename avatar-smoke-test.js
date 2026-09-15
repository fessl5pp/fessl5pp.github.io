const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const avatar = read('bella-avatar.js');
const app = read('app.js');
const sw = read('sw.js');
const build = read('build.js');
const staticRelease = read('prepare-static.js');
const runtimeGeneration = app.match(/script\.src\s*=\s*`\/\$\{file\}\?v=(\d+)`/)?.[1];

assert.ok(avatar.includes('window.BellaAvatar = Object.freeze'), 'avatar module must expose a read-only BellaAvatar namespace');
assert.ok(avatar.includes('heroAvatar') && avatar.includes('chatAvatar'), 'avatar module must decorate both hero and chat avatars');
assert.ok(avatar.includes('MutationObserver'), 'avatar module must follow mood class changes without replacing the mood engine');
assert.ok(avatar.includes('mood-angry') && avatar.includes('mood-cute') && avatar.includes('mood-happy') && avatar.includes('mood-chill'), 'avatar must support every canonical Bella mood');
assert.ok(avatar.includes('version: 10'), 'Bella avatar must use the approved portrait-based v10 identity');
assert.ok(avatar.includes('/bella-avatar-v10.webp'), 'Bella avatar must use the approved v10 portrait asset');
assert.ok(avatar.includes('bella-avatar-photo'), 'Bella avatar must render the portrait asset instead of the old CSS-drawn face');
assert.ok(avatar.includes('prefers-reduced-motion:reduce'), 'avatar motion must respect reduced-motion accessibility preferences');
assert.ok(avatar.includes('pointer:coarse'), 'avatar must keep mobile GPU-light behavior');
assert.ok(avatar.includes('aria-label'), 'avatar must expose an accessible mood label');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(avatar), 'avatar module must never own Bella mood logic');
assert.ok(!/window\.send\s*=(?!=)/.test(avatar), 'avatar module must never own send flow');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(avatar), 'avatar module must never own AI flow');
assert.ok(!/window\.fetch\s*=(?!=)/.test(avatar), 'avatar module must never replace network fetch');
assert.ok(!avatar.includes('fetch('), 'visual identity must not add any network request');
assert.ok(fs.existsSync('bella-avatar-v10.webp'), 'approved Bella v10 portrait asset must exist in the repository');

assert.ok(app.indexOf('bella-vnext.js') < app.indexOf('bella-avatar.js'), 'avatar must load after canonical mood ownership');
assert.ok(app.indexOf('bella-avatar.js') < app.indexOf('bella-live-web.js'), 'avatar should decorate the core UI before optional live-web helpers');
assert.ok(runtimeGeneration, 'active runtime generation must be detectable');
assert.ok(sw.includes(`/bella-avatar.js?v=${runtimeGeneration}`), 'PWA shell must cache the avatar module at the active generation');
assert.ok(build.includes("'bella-avatar.js'"), 'complete build graph must include the avatar module');
assert.ok(build.includes("'bella-avatar.js', 'avatar'"), 'build must enforce BellaAvatar namespace ownership');
assert.ok(staticRelease.includes('referenceSource.includes(file)'), 'static release must discover referenced image assets from runtime source');

console.log('Bella avatar smoke tests passed: approved portrait v10, mood-reactive identity, accessibility, mobile performance and ownership boundaries are valid.');
