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
assert.ok(app.includes('?v=15'), 'account-memory release must use the v15 loader generation');
assert.ok(build.includes('bella-account-memory.js'), 'build must syntax-check account memory sync');
assert.ok(sw.includes('/bella-account-memory.js?v=15'), 'PWA cache must include account memory v2');
assert.ok(memorySync.includes('syncExactMemory'), 'account memory sync must expose exact cross-device synchronization');
assert.ok(memorySync.includes('bella_memories'), 'memory v2 must use a dedicated RLS-protected cloud memory table');
assert.ok(memorySync.includes('SNAPSHOT_KEY'), 'memory v2 must track a per-user last synchronized set');
assert.ok(memorySync.includes('deleted_at'), 'memory v2 must use tombstones so another device cannot resurrect deleted memories');
assert.ok(memorySync.includes('tombstoneKey'), 'individual memory deletion must create a cloud tombstone');
assert.ok(memorySync.includes('tombstoneAll'), 'clear-all must create cloud tombstones');
assert.ok(memorySync.includes('patchLegacyProfileMemory'), 'legacy profile memory must be kept canonical during migration');
assert.ok(memorySync.includes('remember,'), 'signed-in users must be able to explicitly add a cloud memory');
assert.ok(memorySync.includes('forget,'), 'signed-in users must be able to explicitly remove one cloud memory');
assert.ok(memorySync.includes('clear,'), 'signed-in users must be able to clear cloud memory');
assert.ok(memorySync.includes('احفظيها ☁️'), 'memory panel must expose an explicit cloud-memory add control');
assert.ok(memorySync.includes('متزامنة بين أجهزتك'), 'memory panel must explain cross-device synchronization');
assert.ok(memorySync.includes('finishEmailConfirmation'), 'confirmed email sessions must reload after cloud profile bootstrap');
assert.ok(memorySync.includes('searchParams.delete("account")'), 'confirmation reload must remove the one-time account marker');
assert.ok(memorySync.includes('sb_publishable_'), 'memory sync may only use the browser-safe publishable key');
assert.ok(!memorySync.includes('service_role'), 'memory sync must never contain a service-role key');
assert.ok(!memorySync.includes('sb_secret_'), 'memory sync must never contain a secret key');
assert.ok(!/window\.send\s*=(?!=)/.test(memorySync), 'memory sync must never own send');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(memorySync), 'memory sync must never own AI replies');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(memorySync), 'memory sync must never own mood');
assert.ok(!/window\.fetch\s*=(?!=)/.test(memorySync), 'memory sync must never replace fetch');

console.log('Bella account memory smoke tests passed: v2 tombstones, explicit memory controls, cross-device sync and chat ownership stay safe.');
