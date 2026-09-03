const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
assert.ok(fs.existsSync('bella-account-center.js'), 'account center module must exist');

const center = read('bella-account-center.js');
const app = read('app.js');
const build = read('build.js');
const sw = read('sw.js');

new Function(center);

assert.ok(app.indexOf('bella-account-memory.js') < app.indexOf('bella-account-center.js'), 'account center must load after cloud memory status is available');
assert.ok(app.indexOf('bella-account-center.js') < app.indexOf('bella-speed.js'), 'account center should load before later UI bridges');
assert.ok(app.includes('bella-account-center.js'), 'tracked app entry must load account center');
assert.ok(build.includes('bella-account-center.js'), 'build must syntax-check account center');
assert.ok(build.includes('window\\.BellaAccountCenter'), 'build ownership rules must include account center');
assert.ok(sw.includes('/bella-account-center.js?v=16'), 'PWA cache must include account center');

assert.ok(center.includes('window.BellaAccountCenter'), 'account center must expose a dedicated namespace');
assert.ok(center.includes('window.BellaAccount?.isSignedIn?.()'), 'account center must only decorate signed-in account UI');
assert.ok(center.includes('window.BellaAccountMemory?.status?.()'), 'account center must read cloud-memory status');
assert.ok(center.includes('data-bella-account-stats'), 'account center must render account statistics');
assert.ok(center.includes('data-bella-account-synced'), 'account center must show sync status');
assert.ok(center.includes('data-bella-account-joined'), 'account center must show account join date');
assert.ok(center.includes('data-bella-account-memory-count'), 'account center must show memory count');
assert.ok(center.includes('إدارة الذاكرة 🧠'), 'account center must link to memory controls');
assert.ok(center.includes('إعدادات بيلا ⚙️'), 'account center must link to settings');
assert.ok(center.includes('Level'), 'account center must show level');
assert.ok(center.includes('XP'), 'account center must show XP');
assert.ok(center.includes('رسالة'), 'account center must show message count');
assert.ok(center.includes('ذكرى'), 'account center must show memory count in stats');

assert.ok(!/window\.send\s*=(?!=)/.test(center), 'account center must never own send');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(center), 'account center must never own AI replies');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(center), 'account center must never own mood');
assert.ok(!/window\.fetch\s*=(?!=)/.test(center), 'account center must never replace fetch');
assert.ok(!center.includes('service_role'), 'account center must not contain Supabase service-role credentials');
assert.ok(!center.includes('sb_secret_'), 'account center must not contain Supabase secret credentials');

console.log('Bella account center smoke tests passed: signed-in dashboard, stats, sync metadata, memory/settings actions and ownership are valid.');
