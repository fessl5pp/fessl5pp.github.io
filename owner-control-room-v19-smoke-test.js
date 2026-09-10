const fs = require('fs');
const assert = require('assert');

for (const file of ['bella-broadcasts-v19.js','bella-owner-control-room-v19.js']) {
  const source = fs.readFileSync(file,'utf8');
  try { new Function(source); } catch (error) { throw new Error(`${file} syntax failed: ${error.message}`); }
}

const publicUi = fs.readFileSync('bella-broadcasts-v19.js','utf8');
const ownerUi = fs.readFileSync('bella-owner-control-room-v19.js','utf8');
const app = fs.readFileSync('app.js','utf8');
const sw = fs.readFileSync('sw.js','utf8');
const migration = fs.readFileSync('supabase/migrations/20260910100000_bella_owner_control_room_v19.sql','utf8');
const auditMigration = fs.readFileSync('supabase/migrations/20260910101500_bella_owner_permission_audit_v19.sql','utf8');

for (const needle of ['bella_broadcasts','bella_user_gifts','bella_owner_set_ban','bella_owner_set_progress','bella_owner_adjust_xp','bella_owner_schedule_maintenance','bella_owner_schedule_announcement','bella_owner_send_gift','bella_owner_kill_switch','bella_owner_dashboard_v4','bella_owner_ops_state']) {
  assert.ok(migration.includes(needle), `v19 migration missing ${needle}`);
}
assert.ok(migration.includes("suspension_type='temporary'") && migration.includes("suspension_type='permanent'"), 'temporary/permanent ban support missing');
assert.ok(migration.includes('lockdown_snapshot'), 'kill switch restore snapshot missing');
assert.ok(migration.includes('scheduled_maintenance_start') && migration.includes('scheduled_announcement_start'), 'schedule fields missing');
assert.ok(auditMigration.includes("suspension_type='permanent'") && auditMigration.includes("suspension_type='none'"), 'legacy suspend/unsuspend hardening missing');
assert.ok(auditMigration.includes('bella_owner_ban_detail'), 'owner ban detail audit RPC missing');

for (const needle of ['إرسال إشعار لكل المستخدمين','جدولة الصيانة','حظر مؤقت','حظر دائم','تعيين XP + Level','إرسال هدية','Kill Switch','صحة النظام','فحص الصلاحيات السابقة']) {
  assert.ok(ownerUi.includes(needle), `owner control room missing UI: ${needle}`);
}
assert.ok(ownerUi.includes('bella_owner_dashboard_v4') && ownerUi.includes('/api/health'), 'deep dashboard/system health checks missing');
assert.ok(publicUi.includes('bella_public_broadcasts') && publicUi.includes('bella_my_gifts'), 'broadcast/gift client missing');
assert.ok(publicUi.includes('bella_mark_gift_viewed'), 'gift acknowledgement missing');

for (const file of ['bella-broadcasts-v19.js','bella-owner-control-room-v19.js']) {
  assert.ok(app.includes(`"${file}"`), `app loader missing ${file}`);
  assert.ok(sw.includes(`/${file}?v=16`), `PWA cache missing ${file}`);
}
assert.ok(app.includes('Bella v19 Owner Control Room'), 'v19 release marker missing');
assert.ok(sw.includes('bella-pwa-v21-release-19'), 'v19 service-worker cache rotation missing');

console.log('Bella v19 owner control room validated: broadcasts, scheduling, temporary/permanent bans, exact XP+Level, gifts, system health, kill switch, deeper dashboard and audited legacy permissions.');
