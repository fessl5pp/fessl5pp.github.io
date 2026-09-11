const fs = require('fs');

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing ${path}`);
  return fs.readFileSync(path, 'utf8');
}
function must(source, needle, message) {
  if (!source.includes(needle)) throw new Error(message);
}

const app = read('app.js');
const sw = read('sw.js');
const client = read('bella-resilience-v22.js');
const owner = read('bella-owner-resilience-v22.js');
const control = read('lib/bella-control.js');
const context = read('lib/bella-request-context-v22.js');
const gatedChat = read('api/gated-chat.js');
const health = read('api/health.js');
const vercel = read('vercel.json');
const migration = read('supabase/migrations/20260911133128_bella_resilience_lab_v22.sql');

must(app, 'Bella v22 Resilience Lab + Safe Mode + privacy-minimal Error Center + server-side Persona A/B experiments marker', 'v22 app release marker missing.');
must(app, 'bella-resilience-v22.js', 'v22 client resilience runtime is not loaded.');
must(app, 'bella-owner-resilience-v22.js', 'v22 owner resilience console is not loaded.');
must(app, '?v=22', 'v22 runtime cache generation missing.');

must(sw, 'bella-pwa-v23-release-22', 'v22 service worker cache was not rotated.');
must(sw, '/app.js?v=11', 'service worker must cache the exact app.js URL requested by index.html.');
for (const file of ['bella-resilience-v22.js','bella-owner-resilience-v22.js']) {
  must(sw, `/${file}?v=22`, `PWA cache missing ${file}.`);
}

for (const rpc of [
  'bella_public_resilience_v22',
  'bella_record_client_event_v22',
  'bella_owner_set_safe_mode_v22',
  'bella_owner_set_telemetry_v22',
  'bella_owner_upsert_experiment_v22',
  'bella_owner_prune_events_v22',
  'bella_owner_resilience_v22'
]) must(migration, rpc, `v22 migration missing ${rpc}.`);

for (const table of ['bella_resilience_config_v22','bella_experiments_v22','bella_client_events_v22']) {
  must(migration, `alter table public.${table} enable row level security`, `${table} must have RLS enabled.`);
  must(migration, `revoke all on table public.${table} from anon, authenticated`, `${table} must not be directly exposed to client roles.`);
}

must(migration, "security definer set search_path=''", 'v22 privileged RPCs must pin an empty search_path.');
must(migration, "p_detail->>'name'", 'event recorder must explicitly whitelist safe detail keys.');
if (migration.includes("p_detail->>'message'") || migration.includes("p_detail->>'stack'")) throw new Error('v22 telemetry must never persist error message or stack fields.');

must(client, 'bella_record_client_event_v22', 'client error telemetry is not connected.');
must(client, 'REPORT_COOLDOWN_MS', 'client telemetry dedupe/cooldown is missing.');
must(client, 'sampled()', 'client telemetry sampling is missing.');
if (/message\s*:\s*String\(detail/.test(client) || /stack\s*:\s*String\(detail/.test(client)) throw new Error('client telemetry must not send error messages or stacks.');
must(client, 'SAFE_BLOCKED', 'Safe Mode blocked feature set is missing.');
must(client, 'window.BellaResilienceV22', 'client resilience API is not exposed.');

must(context, 'AsyncLocalStorage', 'request-scoped experiment isolation must use AsyncLocalStorage.');
must(gatedChat, 'runBellaRequestContextV22', 'gated chat must execute inside the request-scoped v22 context.');
must(gatedChat, 'primeBellaResilienceRuntimeV22', 'gated chat must resolve the experiment before chat generation.');
must(control, 'getBellaRequestContextV22', 'OpenAI patch must read the request-scoped experiment context.');
must(control, 'Bella Persona Experiment v22', 'server-side experiment overlay injection is missing.');
must(control, 'tool?.type !== "web_search"', 'Safe Mode must remove live web search server-side.');
must(control, 'requestedKind !== "chat"', 'Safe Mode must keep core chat available while gating secondary AI modes.');

for (const rpc of ['bella_owner_set_safe_mode_v22','bella_owner_set_telemetry_v22','bella_owner_upsert_experiment_v22','bella_owner_prune_events_v22']) {
  must(owner, rpc, `owner resilience console missing ${rpc}.`);
}
must(owner, 'Error Center', 'owner Error Center UI missing.');
must(owner, 'Persona A/B Experiment', 'owner Persona experiment UI missing.');

must(health, 'release: "v22"', 'health endpoint must report v22.');
must(health, 'bella_owner_resilience_v22', 'owner diagnostics must verify the v22 resilience RPC.');
must(vercel, '"X-Bella-Release", "value": "v22"', 'Vercel release header must report v22.');

const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
if (apiFunctions.length > 12) throw new Error(`Hobby plan guard: ${apiFunctions.length} api functions found; maximum is 12.`);
if (fs.existsSync('api/resilience-v22.js') || fs.existsSync('api/owner-resilience-v22.js')) throw new Error('v22 must reuse existing functions instead of adding serverless endpoints.');

console.log('Bella v22 resilience checks passed: Safe Mode, privacy-minimal telemetry, request-scoped Persona A/B experiments, RLS, PWA cache and Hobby-plan limits are wired.');
