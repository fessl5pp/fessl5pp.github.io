const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const app = read('app.js');
const build = read('build.js');
const sw = read('sw.js');
const config = read('bella-config.js');
const controls = read('bella-owner-controls.js');
const chat = read('api/chat.js');
const dira = read('api/dira.js');
const guard = read('lib/bella-control.js');

for (const file of ['bella-config.js', 'bella-owner-controls.js', 'lib/bella-control.js']) {
  assert.ok(fs.existsSync(file), `${file} must exist`);
}

assert.ok(app.includes('bella-config.js'), 'boot must load public remote config');
assert.ok(app.includes('bella-owner-controls.js'), 'boot must load owner controls');
assert.ok(app.includes('?v=18'), 'remote controls release must bust module cache');
assert.ok(sw.includes('bella-config.js?v=18'), 'PWA must cache public config module');
assert.ok(sw.includes('bella-owner-controls.js?v=18'), 'PWA must cache owner controls module');
assert.ok(build.includes("owner: 'bella-config.js'"), 'build must validate BellaConfig ownership');
assert.ok(build.includes("owner: 'bella-owner-controls.js'"), 'build must validate owner-controls ownership');

assert.ok(config.includes('bella_public_config'), 'public client must read server config');
assert.ok(config.includes('games_enabled'), 'public config must gate games');
assert.ok(config.includes('radar_enabled'), 'public config must gate radar');
assert.ok(config.includes('maintenance_enabled'), 'public config must render maintenance state');
assert.ok(config.includes('bellaSystemBanner'), 'public config must render announcement/maintenance banner');
assert.ok(config.includes('wrapFunction("coffeeRadar"'), 'radar must be guarded');
assert.ok(config.includes('wrapFunction("startBoxGame"'), 'box game must be guarded');
assert.ok(config.includes('wrapFunction("startProverbGame"'), 'proverb game must be guarded');

assert.ok(controls.includes('bella_owner_config'), 'owner panel must load protected control config');
assert.ok(controls.includes('bella_owner_update_config'), 'owner panel must save through protected RPC');
assert.ok(controls.includes('p_ai_daily_limit'), 'owner panel must manage AI daily limit');
assert.ok(controls.includes('p_maintenance_enabled'), 'owner panel must manage maintenance mode');
assert.ok(controls.includes('p_announcement'), 'owner panel must manage user announcement');
assert.ok(controls.includes('BellaOwnerCenter?.isOwner'), 'owner controls must require verified owner state');

assert.ok(guard.includes('bella_claim_ai_request'), 'server guard must claim AI usage through Supabase');
assert.ok(guard.includes('control_unavailable'), 'server control outage must have explicit fail-open state');
assert.ok(chat.includes('claimBellaAi'), 'chat API must enforce the server control guard');
assert.ok(chat.includes('live_web_disabled'), 'chat must fall back when live web is disabled');
assert.ok(chat.includes('daily_limit'), 'chat must enforce daily AI limit');
assert.ok(chat.includes('maintenance'), 'chat must enforce maintenance mode');
assert.ok(dira.includes('claimBellaAi("live_web")'), 'Dira must enforce live web control before OpenAI');
assert.ok(dira.includes('live_web_disabled'), 'Dira must stop when live web is disabled');

for (const source of [config, controls]) {
  assert.ok(!/window\.send\s*=/.test(source), 'control modules must not own send');
  assert.ok(!/window\.getAIReply\s*=/.test(source), 'control modules must not own AI reply');
  assert.ok(!/window\.updateMood\s*=/.test(source), 'control modules must not own mood');
  assert.ok(!/window\.fetch\s*=/.test(source), 'control modules must not own network runtime');
}

console.log('Bella owner controls smoke tests passed: protected remote toggles, maintenance, announcements and server-enforced AI limits are wired safely.');
