const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
for (const file of ['bella-moderator-center.js','bella-owner-users.js','app.js','sw.js','build.js']) {
  assert.ok(fs.existsSync(file), `Missing moderator center file: ${file}`);
}

const moderator = read('bella-moderator-center.js');
const ownerUsers = read('bella-owner-users.js');
const app = read('app.js');
const sw = read('sw.js');
const build = read('build.js');

assert.ok(moderator.includes('is_bella_moderator'), 'moderator center must verify server-side staff access');
assert.ok(moderator.includes('bella_moderator_users'), 'moderator center must use the privacy-limited user list');
assert.ok(moderator.includes('bella_moderator_user_detail'), 'moderator center must use privacy-limited account detail');
assert.ok(moderator.includes('bella_moderator_manage_user'), 'moderator center must route actions through the limited moderator RPC');
assert.ok(moderator.includes('bella_moderator_audit'), 'moderator center must expose the moderator own-action audit');
assert.ok(moderator.includes('row.manageable') && moderator.includes('row.staff_role === "moderator"'), 'protected staff accounts must be visibly non-manageable');
assert.ok(moderator.includes('سبب الإيقاف') && moderator.includes('length < 3'), 'moderator suspension must require a written reason');
assert.ok(moderator.includes('ما نعرض الإيميلات أو نص المحادثات'), 'moderator center must disclose the privacy boundary');
assert.ok(!/row\.email/.test(moderator), 'moderator UI must not render user email addresses');
assert.ok(!moderator.includes('bella_owner_manage_user'), 'moderator UI must never call owner mutation RPCs');
assert.ok(!moderator.includes('set_role'), 'moderator UI must not change staff roles');
assert.ok(!moderator.includes('service_role') && !moderator.includes('sb_secret_'), 'moderator UI must not contain Supabase secret credentials');
assert.ok(/window\.BellaModeratorCenter\s*=(?!=)/.test(moderator), 'moderator center must expose one namespace');
assert.ok(!/window\.send\s*=(?!=)/.test(moderator), 'moderator center must not own send flow');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(moderator), 'moderator center must not own AI flow');

assert.ok(ownerUsers.includes('set_role') && ownerUsers.includes('bella_owner_manage_user'), 'staff role assignment must remain owner-owned');
assert.ok(app.indexOf('bella-owner-users.js') < app.indexOf('bella-moderator-center.js'), 'moderator center must load after owner user management');
assert.ok(sw.includes('/bella-moderator-center.js?v=16'), 'PWA cache must include moderator center');
assert.ok(build.includes("owner: 'bella-moderator-center.js'"), 'build validator must enforce moderator center namespace ownership');

console.log('Bella moderator center smoke tests passed: limited staff access, protected accounts, reasoned moderation, audit and privacy boundaries are wired.');