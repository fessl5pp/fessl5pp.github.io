const fs = require('fs');

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing ${path}`);
  return fs.readFileSync(path, 'utf8');
}
function must(source, needle, message) {
  if (!source.includes(needle)) throw new Error(message);
}
function ok(condition, message) {
  if (!condition) throw new Error(message);
}

const migration = read('supabase/migrations/20260913112954_bella_brain_quality_telemetry_v29.sql');
const telemetry = read('lib/bella-brain-telemetry-v29.js');
const gated = read('api/gated-chat.js');
const control = read('lib/bella-control.js');
const health = read('api/health.js');
const pkg = JSON.parse(read('package.json'));

// Storage is aggregate-only and hidden from the Data API surface.
must(migration, 'private.bella_brain_quality_v29', 'v29 aggregate table must live in private schema.');
must(migration, 'alter table private.bella_brain_quality_v29 enable row level security', 'v29 table must keep RLS defense in depth.');
must(migration, 'revoke all on private.bella_brain_quality_v29 from public, anon, authenticated', 'direct brain telemetry table access must stay revoked.');

// Recorder is authenticated-only and may observe auth.uid() only transiently; identifiers are never stored.
must(migration, 'v_uid := auth.uid()', 'v29 recorder must require an authenticated Supabase identity.');
must(migration, 'if v_uid is null then', 'v29 recorder must reject guests at the database boundary.');
must(migration, 'revoke all on function public.bella_record_brain_quality_v29', 'public recorder execute privilege must be revoked by default.');
must(migration, 'grant execute on function public.bella_record_brain_quality_v29', 'authenticated recorder grant is missing.');
for (const forbidden of ['p_message', 'p_history', 'p_memory', 'p_user_id', 'p_ip', 'user_name']) {
  ok(!migration.includes(forbidden), `v29 migration must not accept/store ${forbidden}.`);
  ok(!telemetry.includes(`${forbidden}:`), `v29 telemetry payload must not send ${forbidden}.`);
}

// Owner-only aggregate read path.
must(migration, 'bella_owner_brain_quality_v29', 'owner brain quality RPC is missing.');
must(migration, 'if not public.is_bella_owner()', 'owner brain quality RPC must runtime-check Bella ownership.');
must(migration, 'revoke all on function public.bella_owner_brain_quality_v29(integer) from public, anon', 'anon must not execute owner telemetry RPC.');

// Runtime instrumentation: routes, critic results, latency and live-web outcome are request-scoped.
must(gated, 'createBellaBrainTelemetryStateV29', 'gated chat must create v29 telemetry state.');
must(gated, 'markBellaBrainCriticV29', 'critic outcome instrumentation is missing.');
must(gated, 'markBellaBrainResponseV29', 'response outcome instrumentation is missing.');
must(gated, 'recordBellaBrainQualityV29', 'aggregate recorder is not wired into gated chat.');
must(gated, 'brainTelemetryV29', 'telemetry state must stay request-scoped.');
must(gated, 'X-Bella-Brain-Telemetry', 'v29 telemetry diagnostic header is missing.');
must(telemetry, 'signed-in aggregate telemetry only', 'privacy boundary comment is missing.');
must(telemetry, 'access?.signedIn !== true', 'guest telemetry must stay disabled.');
must(telemetry, 'p_latency_ms', 'latency aggregation is missing.');
must(telemetry, 'p_critic_latency_ms', 'critic latency aggregation is missing.');

// Model availability fallback must be measured without exposing model control to the client.
must(control, 'markModelFallbackV29', 'model fallback telemetry hook is missing.');
must(control, 'telemetry.fallbackUsed = true', 'fallback usage must be recorded in request context.');
ok(!gated.includes('req.body?.model') && !gated.includes('req.body.model'), 'client must never choose trusted model tiers.');

// Health/owner diagnostics expose only aggregates.
must(health, 'brain_quality_v29', 'owner diagnostics must query v29 aggregate telemetry.');
must(health, 'brainQualityTelemetry: "v29"', 'public health must expose v29 telemetry wiring.');
must(health, 'signed-in-aggregate-only', 'public health must disclose telemetry sampling scope.');
must(health, 'brainQualityRawTextStored: false', 'public health must declare raw text is not stored.');

const [major, minor] = String(pkg.version || '0.0.0').split('.').map(Number);
ok(major > 2 || (major === 2 && minor >= 9), `package release must be 2.9.0 or newer; got ${pkg.version}.`);
const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
ok(apiFunctions.length <= 12, `Hobby-plan guard: ${apiFunctions.length} API functions found; maximum is 12.`);

console.log('Bella v29 brain quality telemetry checks passed: aggregate-only signed-in metrics, latency, critic revisions, model mix/fallback tracking, owner-only reads and privacy boundaries are wired.');