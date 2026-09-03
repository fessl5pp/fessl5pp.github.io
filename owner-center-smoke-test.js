const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
assert.ok(fs.existsSync('bella-owner-center.js'), 'owner center module must exist');

const owner = read('bella-owner-center.js');
const app = read('app.js');
const build = read('build.js');
const sw = read('sw.js');

assert.ok(app.indexOf('bella-account-center.js') < app.indexOf('bella-owner-center.js'), 'owner center must load after signed-in account center');
assert.ok(app.indexOf('bella-owner-center.js') < app.indexOf('bella-speed.js'), 'owner center must load before later UI bridges');
assert.ok(build.includes('bella-owner-center.js'), 'build must syntax-check owner center');
assert.ok(sw.includes('/bella-owner-center.js?v=16'), 'PWA cache must include owner center');

assert.ok(owner.includes('rpc("is_bella_owner")'), 'owner visibility must be verified by a server-side owner RPC');
assert.ok(owner.includes('rpc("bella_owner_summary")'), 'owner center must use protected summary RPC');
assert.ok(owner.includes('rpc("bella_owner_users"'), 'owner center must use protected account-list RPC');
assert.ok(owner.includes('🛡️ مركز المالك'), 'owner UI must use the requested Arabic owner-center name');
assert.ok(owner.includes('OWNER ONLY'), 'owner dashboard must visibly identify privileged access');
assert.ok(owner.includes('نصوص المحادثات نفسها مو معروضة هنا'), 'owner center must disclose that chat contents are not exposed');
assert.ok(owner.includes('كل الحسابات'), 'owner center must show account totals');
assert.ok(owner.includes('نشطون 7 أيام'), 'owner center must show recent active accounts');
assert.ok(owner.includes('الرسائل'), 'owner center must show message counters');
assert.ok(owner.includes('الذكريات'), 'owner center must show cloud-memory totals');
assert.ok(owner.includes('XP إجمالي'), 'owner center must show progress totals');
assert.ok(owner.includes('ابحث بالاسم أو الإيميل'), 'owner account list must support search');
assert.ok(owner.includes('PAGE_SIZE = 25'), 'owner account list must paginate instead of loading every account at once');

assert.ok(owner.includes('sb_publishable_'), 'owner client may only use the browser-safe Supabase publishable key');
assert.ok(!owner.includes('service_role'), 'owner client must never contain a Supabase service-role key');
assert.ok(!owner.includes('sb_secret_'), 'owner client must never contain a Supabase secret key');
assert.ok(!/window\.send\s*=(?!=)/.test(owner), 'owner center must never own send flow');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(owner), 'owner center must never own AI reply flow');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(owner), 'owner center must never own mood');
assert.ok(!/window\.fetch\s*=(?!=)/.test(owner), 'owner center must never replace network fetch');
assert.ok(/window\.BellaOwnerCenter\s*=(?!=)/.test(owner), 'owner center must expose one isolated namespace');

console.log('Bella owner center smoke tests passed: owner-only RPC gating, analytics, searchable accounts, privacy and chat ownership are valid.');
