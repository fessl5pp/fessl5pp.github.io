const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const avatar = read('bella-avatar.js');
const app = read('app.js');
const sw = read('sw.js');
const build = read('build.js');

assert.ok(avatar.includes('window.BellaAvatar = Object.freeze'), 'avatar module must expose a read-only BellaAvatar namespace');
assert.ok(avatar.includes('heroAvatar') && avatar.includes('chatAvatar'), 'avatar module must decorate both hero and chat avatars');
assert.ok(avatar.includes('MutationObserver'), 'avatar module must follow mood class changes without replacing the mood engine');
assert.ok(avatar.includes('mood-angry') && avatar.includes('mood-cute') && avatar.includes('mood-happy') && avatar.includes('mood-chill'), 'avatar must support every canonical Bella mood');
assert.ok(avatar.includes('bella-kuwait-mark'), 'Bella visual identity must keep a subtle Kuwait signature');
assert.ok(avatar.includes('prefers-reduced-motion:reduce'), 'avatar animation must respect reduced-motion accessibility preferences');
assert.ok(avatar.includes('aria-label'), 'avatar must expose an accessible mood label');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(avatar), 'avatar module must never own Bella mood logic');
assert.ok(!/window\.send\s*=(?!=)/.test(avatar), 'avatar module must never own send flow');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(avatar), 'avatar module must never own AI flow');
assert.ok(!/window\.fetch\s*=(?!=)/.test(avatar), 'avatar module must never replace network fetch');
assert.ok(!avatar.includes('fetch('), 'visual identity must not add any network request');

assert.ok(app.indexOf('bella-vnext.js') < app.indexOf('bella-avatar.js'), 'avatar must load after canonical mood ownership');
assert.ok(app.indexOf('bella-avatar.js') < app.indexOf('bella-live-web.js'), 'avatar should decorate the core UI before optional live-web helpers');
assert.ok(sw.includes('/bella-avatar.js?v=16'), 'PWA shell must cache the avatar module');
assert.ok(build.includes("['bella-avatar.js', 'Mood-reactive Bella visual identity']"), 'build must syntax-check the avatar module');
assert.ok(build.includes("owner: 'bella-avatar.js'"), 'build must enforce BellaAvatar namespace ownership');

console.log('Bella avatar smoke tests passed: mood-reactive identity, accessibility, PWA caching and ownership boundaries are valid.');