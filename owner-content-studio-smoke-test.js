const fs = require('fs');
const assert = require('assert');

const files = [
  'bella-content-cloud.js',
  'bella-feature-controls-v2.js',
  'bella-game-mind.js',
  'bella-owner-content-studio.js',
  'bella-owner-power-v2.js',
  'api/content-generate.js'
];
for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  try { new Function(source.replace(/^export default /m, 'const __default = ')); }
  catch (error) { throw new Error(`${file} syntax failed: ${error.message}`); }
}

const cloud = fs.readFileSync('bella-content-cloud.js','utf8');
const studio = fs.readFileSync('bella-owner-content-studio.js','utf8');
const power = fs.readFileSync('bella-owner-power-v2.js','utf8');
const mind = fs.readFileSync('bella-game-mind.js','utf8');
const api = fs.readFileSync('api/content-generate.js','utf8');
const app = fs.readFileSync('app.js','utf8');
const sw = fs.readFileSync('sw.js','utf8');
const migration = fs.readFileSync('supabase/migrations/20260909084000_bella_owner_content_studio_v17.sql','utf8');

assert.ok(migration.includes('bella_content_items'), 'content table migration missing');
assert.ok(migration.includes("status in ('draft','pending','approved','rejected')"), 'review status contract missing');
assert.ok(migration.includes('bella_owner_update_config_v2'), 'advanced owner config RPC missing');
assert.ok(migration.includes('bella_owner_grant_xp'), 'owner XP grant missing');
assert.ok(migration.includes('bella_owner_reset_ai_usage'), 'owner AI reset missing');
assert.ok(migration.includes("status='approved' and enabled=true"), 'public content RLS must expose approved+enabled only');

assert.ok(api.includes('Owner access required'), 'AI generator must require owner');
assert.ok(api.includes('content_ai_enabled'), 'AI generator must respect owner feature toggle');
assert.ok(api.includes('reviewRequired:true'), 'AI generator must mark review requirement');
assert.ok(studio.includes('status:"pending",enabled:false'), 'AI suggestions must enter pending disabled');
assert.ok(studio.includes('اعتماد ونشر'), 'studio must require explicit publish action');
assert.ok(studio.includes('حفظ مسودة') && studio.includes('حفظ ونشر'), 'manual draft/publish controls missing');
assert.ok(studio.includes('تعديل') && studio.includes('إيقاف') && studio.includes('حذف'), 'content management actions missing');

assert.ok(cloud.includes('bella_content_items?select='), 'live game content cloud missing');
assert.ok(cloud.includes('status=eq.approved&enabled=eq.true'), 'live cloud must fetch approved enabled only');
assert.ok(cloud.includes('window.BellaGameBankV2=Object.freeze(live)'), 'live bank overlay missing');

for (const key of ['leaderboard_enabled','content_ai_enabled','wisdom_game_enabled','proverb_game_enabled','rumor_list_enabled','box_game_enabled','kuwait_quiz_enabled']) {
  assert.ok(power.includes(key), `owner power toggle missing: ${key}`);
}
assert.ok(power.includes('إدارة XP') && power.includes('تصفير عداد AI'), 'advanced owner actions missing');
assert.ok(mind.includes('سياق لعب اختياري:'), 'game-aware Bella context missing');
assert.ok(mind.includes('لا تذكر هالمعلومة إلا إذا ركبت طبيعي'), 'game context anti-annoyance rule missing');
assert.ok(mind.includes('state.turns-state.lastInjectedTurn>=8'), 'game context cooldown missing');

for (const file of ['bella-content-cloud.js','bella-feature-controls-v2.js','bella-game-mind.js']) {
  assert.ok(app.includes(`"${file}"`), `core loader missing ${file}`);
  assert.ok(sw.includes(`/${file}?v=16`), `PWA cache missing ${file}`);
}
for (const file of ['bella-owner-content-studio.js','bella-owner-power-v2.js']) {
  assert.ok(app.includes(`"${file}"`), `deferred loader missing ${file}`);
  assert.ok(sw.includes(`/${file}?v=16`), `PWA cache missing ${file}`);
}
assert.ok(sw.includes('bella-pwa-v19-release-17'), 'v17 cache rotation missing');

console.log('Bella v17 owner Content Studio validated: manual CRUD, AI pending-review flow, approved live cloud content, granular owner controls, XP tools and game-aware chat context.');
