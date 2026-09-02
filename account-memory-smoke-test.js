const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
assert.ok(fs.existsSync('bella-account-memory.js'), 'account memory sync module must exist');

const memorySync = read('bella-account-memory.js');
const app = read('app.js');
const build = read('build.js');
const sw = read('sw.js');

assert.ok(app.indexOf('bella-vnext.js') < app.indexOf('bella-account-memory.js'), 'account memory sync must load after vNext owns the memory UI');
assert.ok(app.indexOf('bella-account-memory.js') < app.indexOf('bella-speed.js'), 'account memory sync must load before later UI bridges');
assert.ok(build.includes('bella-account-memory.js'), 'build must syntax-check account memory sync');
assert.ok(sw.includes('/bella-account-memory.js?v=14'), 'PWA cache must include account memory sync');
assert.ok(memorySync.includes('syncExactMemory'), 'account memory sync must expose exact deletion synchronization');
assert.ok(memorySync.includes('method: "PATCH"'), 'memory deletion sync must patch the profile directly');
assert.ok(memorySync.includes('body: JSON.stringify({ memory })'), 'memory deletion sync must treat the current local list as authoritative');
assert.ok(memorySync.includes('[data-del],#clearBellaMemory'), 'individual and full memory deletion must sync to cloud');
assert.ok(memorySync.includes('sb_publishable_'), 'memory sync may only use the browser-safe publishable key');
assert.ok(!memorySync.includes('service_role'), 'memory sync must never contain a service-role key');
assert.ok(!memorySync.includes('sb_secret_'), 'memory sync must never contain a secret key');
assert.ok(!/window\.send\s*=(?!=)/.test(memorySync), 'memory sync must never own send');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(memorySync), 'memory sync must never own AI replies');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(memorySync), 'memory sync must never own mood');
assert.ok(!/window\.fetch\s*=(?!=)/.test(memorySync), 'memory sync must never replace fetch');

console.log('Bella account memory smoke tests passed: cloud deletions stay deleted without taking over chat ownership.');
