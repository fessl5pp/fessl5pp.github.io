const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
for (const file of ['app.js','bella-analytics.js','bella-owner-analytics.js','build.js','sw.js']) {
  assert.ok(fs.existsSync(file), `Missing analytics file: ${file}`);
}

const app = read('app.js');
const analytics = read('bella-analytics.js');
const ownerAnalytics = read('bella-owner-analytics.js');
const build = read('build.js');
const sw = read('sw.js');

assert.ok(app.indexOf('bella-account.js') < app.indexOf('bella-analytics.js'), 'usage analytics must load after account auth');
assert.ok(app.indexOf('bella-owner-center.js') < app.indexOf('bella-owner-analytics.js'), 'owner activity UI must load after owner authorization UI');
assert.ok(app.includes('?v=16'), 'analytics release must stay on the current loader generation');

assert.ok(analytics.includes('/rpc/record_bella_event'), 'analytics client must use the restricted event RPC');
assert.ok(analytics.includes('window.BellaAccount?.isSignedIn?.()'), 'analytics must only record signed-in usage');
assert.ok(analytics.includes('SESSION_WINDOW_MS = 30 * 60 * 1000'), 'session activity must be throttled');
assert.ok(analytics.includes('chat_sent'), 'analytics must track sent chat events');
assert.ok(analytics.includes('live_web'), 'analytics must track live-web events');
assert.ok(analytics.includes('featureFromButton'), 'analytics must classify feature usage without reading chat contents');
assert.ok(analytics.includes('window.BellaAnalytics = Object.freeze'), 'analytics must expose one isolated namespace');
assert.ok(!analytics.includes('service_role'), 'analytics must never contain service-role credentials');
assert.ok(!analytics.includes('sb_secret_'), 'analytics must never contain a Supabase secret key');
assert.ok(!/window\.send\s*=(?!=)/.test(analytics), 'analytics must never own send');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(analytics), 'analytics must never own AI replies');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(analytics), 'analytics must never own mood');
assert.ok(!/window\.fetch\s*=(?!=)/.test(analytics), 'analytics must never replace fetch');

assert.ok(ownerAnalytics.includes('bella_owner_analytics_summary'), 'owner analytics must load real activity summary');
assert.ok(ownerAnalytics.includes('bella_owner_activity'), 'owner analytics must load daily activity');
assert.ok(ownerAnalytics.includes('bella_owner_features'), 'owner analytics must load top feature usage');
assert.ok(ownerAnalytics.includes('window.BellaOwnerCenter?.isOwner?.()'), 'owner analytics UI must require verified owner state');
assert.ok(ownerAnalytics.includes('آخر 90 يوم'), 'owner dashboard must support 7/30/90 day windows');
assert.ok(ownerAnalytics.includes('بدون نصوص المحادثات'), 'owner analytics must disclose that chat contents are not exposed');
assert.ok(/window\.BellaOwnerAnalytics\s*=(?!=)/.test(ownerAnalytics), 'owner analytics must expose one isolated namespace');
assert.ok(!/window\.send\s*=(?!=)/.test(ownerAnalytics), 'owner analytics must never own send');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(ownerAnalytics), 'owner analytics must never own AI replies');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(ownerAnalytics), 'owner analytics must never own mood');
assert.ok(!/window\.fetch\s*=(?!=)/.test(ownerAnalytics), 'owner analytics must never replace fetch');

assert.ok(build.includes('bella-analytics.js'), 'build must syntax-check usage analytics');
assert.ok(build.includes('bella-owner-analytics.js'), 'build must syntax-check owner analytics');
assert.ok(sw.includes('/bella-analytics.js?v=16'), 'PWA must cache usage analytics');
assert.ok(sw.includes('/bella-owner-analytics.js?v=16'), 'PWA must cache owner activity dashboard');

console.log('Bella owner analytics smoke tests passed: privacy-safe events, owner-only activity, feature usage and core ownership are valid.');
