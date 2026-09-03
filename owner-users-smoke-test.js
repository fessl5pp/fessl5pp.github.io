const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
for (const file of ['bella-owner-users.js','bella-auth-bridge.js','lib/bella-account-access.js','api/gated-chat.js','api/gated-dira.js','app.js','sw.js','vercel.json']) {
  assert.ok(fs.existsSync(file), `Missing owner user management file: ${file}`);
}

const users = read('bella-owner-users.js');
const bridge = read('bella-auth-bridge.js');
const access = read('lib/bella-account-access.js');
const gatedChat = read('api/gated-chat.js');
const gatedDira = read('api/gated-dira.js');
const app = read('app.js');
const sw = read('sw.js');
const vercel = read('vercel.json');

assert.ok(users.includes('bella_owner_users_v2'), 'owner UI must use the v2 protected user list');
assert.ok(users.includes('bella_owner_user_detail'), 'owner UI must load protected account detail');
assert.ok(users.includes('bella_owner_manage_user'), 'owner UI must manage account state through protected RPC');
assert.ok(users.includes('bella_owner_audit'), 'owner UI must expose the admin audit log');
assert.ok(users.includes('suspend') && users.includes('unsuspend') && users.includes('set_role'), 'owner UI must support suspend, restore and role changes');
assert.ok(users.includes('ما نعرض نص المحادثات'), 'owner UI must keep chat-content privacy disclosure');
assert.ok(/window\.BellaOwnerUsers\s*=(?!=)/.test(users), 'owner user management must expose one namespace');
assert.ok(!/window\.send\s*=(?!=)/.test(users), 'owner user management must not own send flow');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(users), 'owner user management must not own AI flow');
assert.ok(!users.includes('service_role') && !users.includes('sb_secret_'), 'owner UI must not contain Supabase secret credentials');

assert.ok(bridge.includes('bella_account_session_v1'), 'auth bridge must read the existing account session');
assert.ok(bridge.includes('/api/chat') && bridge.includes('/api/dira'), 'auth bridge must scope auth only to Bella API routes');
assert.ok(bridge.includes('Authorization'), 'auth bridge must attach the signed-in bearer token');
assert.ok(/window\.BellaAuthBridge\s*=(?!=)/.test(bridge), 'auth bridge must expose a debug namespace');

assert.ok(access.includes('bella_account_status'), 'server access gate must validate signed-in account status through Supabase');
assert.ok(access.includes('account_suspended'), 'server access gate must return a deterministic suspended-account control');
assert.ok(!access.includes('service_role') && !access.includes('sb_secret_'), 'server access gate must not embed secret credentials');
assert.ok(gatedChat.includes('checkBellaAccountAccess') && gatedChat.includes('chatHandler'), 'chat route must gate signed-in account access before existing chat behavior');
assert.ok(gatedDira.includes('checkBellaAccountAccess') && gatedDira.includes('diraHandler'), 'Dira route must gate signed-in account access before existing search behavior');

assert.ok(app.indexOf('bella-auth-bridge.js') < app.indexOf('bella-runtime.js'), 'auth bridge must load before runtime captures the network transport');
assert.ok(app.indexOf('bella-owner-center.js') < app.indexOf('bella-owner-users.js'), 'owner user management must load after owner verification');
assert.ok(sw.includes('/bella-auth-bridge.js?v=16') && sw.includes('/bella-owner-users.js?v=16'), 'PWA cache must include owner user management modules');
assert.ok(vercel.includes('"source": "/api/chat"') && vercel.includes('"destination": "/api/gated-chat"'), 'Vercel must route chat through the account gate');
assert.ok(vercel.includes('"source": "/api/dira"') && vercel.includes('"destination": "/api/gated-dira"'), 'Vercel must route Dira through the account gate');

console.log('Bella owner user management smoke tests passed: owner-only account controls, audit log, suspended-account cloud/API gating and privacy boundaries are wired.');
