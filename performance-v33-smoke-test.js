const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const app = read('app.js');
const css = read('bella-vnext.css');
const pkg = JSON.parse(read('package.json'));

assert.ok(app.includes('Bella v33 Performance Polish'), 'v33 performance release marker missing.');
assert.ok(app.includes('script.async = false'), 'core script execution order must remain deterministic.');
assert.ok(app.includes('Promise.all(list.map(file => loadScript(file)))'), 'core modules must fetch concurrently instead of serially.');
assert.ok(!app.includes('chain = chain.then(() => loadScript(file))'), 'serial 42-module waterfall must not return.');
assert.ok(app.includes('parallel-fetch-ordered-execution'), 'local boot diagnostics must expose the v33 loading strategy.');
assert.ok(app.includes('setTimeout(() => window.requestIdleCallback(schedule, { timeout: 3500 }), 1200)'), 'deferred owner modules need a post-boot quiet window.');
assert.ok(app.includes('setTimeout(schedule, 2500)'), 'fallback deferred loading must not compete with first paint.');

assert.ok(css.includes('Bella v33 Performance Polish'), 'v33 mobile performance CSS marker missing.');
assert.ok(css.includes('(hover:none) and (pointer:coarse)'), 'touch-device performance mode missing.');
assert.ok(css.includes('backdrop-filter:none!important'), 'mobile GPU-heavy backdrop filters must be disabled.');
assert.ok(css.includes('.bella-identity-avatar::before{animation:none!important'), 'avatar aura animation must be disabled on touch devices.');
assert.ok(css.includes('body::before{display:none!important}'), 'decorative full-screen grid must be removed on touch devices.');
assert.ok(css.includes('@media (max-width:430px)'), 'small-phone performance fallback missing.');
assert.ok(css.includes('.bella-identity-avatar::before{display:none!important}'), 'small phones must avoid the avatar blur layer entirely.');

const [major, minor] = String(pkg.version || '').split('.').map(Number);
assert.ok(major > 3 || (major === 3 && minor >= 3), 'package release must be v3.3.0 or newer.');
assert.ok(String(pkg.scripts?.test || '').includes('performance-v33-smoke-test.js'), 'v33 performance gate missing from npm test.');
assert.ok(String(pkg.scripts?.['vercel-build'] || '').includes('performance-v33-smoke-test.js'), 'v33 performance gate missing from Vercel build.');

const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
assert.ok(apiFunctions.length <= 12, `Hobby-plan guard: ${apiFunctions.length} API functions found; maximum is 12.`);

console.log('Bella v33 Performance Polish checks passed: parallel ordered core loading, delayed admin work and touch/Safari GPU-light rendering are locked in.');
