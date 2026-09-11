const fs = require('fs');

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing ${path}`);
  return fs.readFileSync(path, 'utf8');
}
function must(source, needle, message) {
  if (!source.includes(needle)) throw new Error(message);
}

const app = read('app.js');
const controls = read('bella-feature-controls-v3.js');
const owner = read('bella-owner-control-plane-v21.js');
const preview = read('api/owner-persona-preview.js');
const diagnostics = read('api/owner-diagnostics.js');
const ownerAccess = read('lib/bella-owner-access.js');
const migration = read('supabase/migrations/20260911090000_bella_control_plane_v21.sql');

must(app, 'bella-owner-control-plane-v21.js', 'v21 owner module is not loaded.');
must(app, '?v=21', 'v21 runtime generation is missing.');

must(controls, 'bella_public_ops_v21', 'public controls must use v21 rollout RPC.');
must(controls, 'bella_rollout_subject_v21', 'stable rollout subject is missing.');
must(controls, 'rolloutPercent', 'client rollout percentage support is missing.');
must(controls, 'scheduledMode', 'client scheduled state support is missing.');

for (const rpc of ['bella_owner_set_feature_rollout_v21','bella_owner_schedule_feature_v21','bella_owner_clear_feature_schedule_v21']) {
  must(owner, rpc, `owner control plane missing ${rpc}.`);
  must(migration, rpc, `database migration missing ${rpc}.`);
}
must(owner, '/api/owner-persona-preview', 'persona preview UI is not connected.');
must(owner, '/api/owner-diagnostics', 'diagnostics UI is not connected.');

must(ownerAccess, 'is_bella_owner', 'owner API guard must verify Supabase owner status.');
must(preview, 'requireBellaOwner', 'persona preview must require owner access.');
must(preview, 'MAX_PREVIEWS', 'persona preview rate limit is missing.');
must(preview, 'store: false', 'persona preview should not store model requests.');
must(diagnostics, 'requireBellaOwner', 'diagnostics must require owner access.');
must(diagnostics, 'Boolean(process.env.OPENAI_API_KEY)', 'diagnostics should only report OpenAI configuration status.');
if (/OPENAI_API_KEY\s*[:=]\s*process\.env\.OPENAI_API_KEY/.test(diagnostics)) throw new Error('Diagnostics must never return the OpenAI key.');

must(migration, 'rollout_percent', 'rollout percent column is missing.');
must(migration, 'scheduled_mode', 'scheduled feature mode is missing.');
must(migration, 'hashtextextended', 'deterministic beta bucketing is missing.');
must(migration, 'v21_feature_rollout', 'rollout actions must be audited.');
must(migration, 'rollback_available', 'v21 rollout/schedule changes must support rollback.');

console.log('Bella v21 control plane smoke checks passed: percentage rollouts, scheduling, preview lab, diagnostics, owner guards and rollback are wired.');