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

const migration = read('supabase/migrations/20260913084908_bella_v25_policy_hygiene.sql');
const vnext = read('bella-vnext.js');
const control = read('lib/bella-control.js');
const build = read('build.js');
const prepare = read('prepare-static.js');
const app = read('app.js');
const sw = read('sw.js');
const health = read('api/health.js');
const chat = read('api/chat.js');
const vercel = JSON.parse(read('vercel.json'));
const pkg = JSON.parse(read('package.json'));

// Supabase policy hygiene: statement-scoped auth checks and one SELECT policy per role/action.
must(migration, 'user_id = (select auth.uid())', 'gift RLS must cache auth.uid() once per statement.');
must(migration, 'bella_broadcasts_authenticated_select_v25', 'broadcast authenticated SELECT policy is missing.');
must(migration, 'bella_content_authenticated_select_v25', 'content authenticated SELECT policy is missing.');
must(migration, 'to anon', 'public SELECT policies must stay explicitly anonymous-facing.');
ok(!migration.includes('create index'), 'v25 must not add speculative indexes to currently tiny/empty tables.');

// Durable memory must remain explicit opt-in only.
must(vnext, 'rememberMatch', 'explicit remember command parser is missing.');
ok(!vnext.includes('const likes = ['), 'implicit preference-to-durable-memory learning must stay removed.');
ok(!vnext.includes('for (const [key, mem] of likes)'), 'ordinary conversation must not auto-save inferred likes.');

// Safe Mode must block secondary AI before the usage claim RPC to avoid double charging/quota consumption.
const preflight = control.indexOf('if (requestedKind !== "chat")');
const claimRpc = control.indexOf('bella_claim_ai_request');
ok(preflight >= 0 && claimRpc >= 0 && preflight < claimRpc, 'Safe Mode preflight must happen before bella_claim_ai_request.');
must(control, 'Safe Mode must gate secondary AI before the usage-claim RPC', 'Safe Mode quota-protection invariant is undocumented.');

// Build/release graph must be derived from app.js so dead modules cannot silently ship.
must(build, "appModuleList(app, 'coreModules')", 'build must derive core modules from app.js.');
must(build, "appModuleList(app, 'deferredModules')", 'build must derive deferred modules from app.js.');
must(prepare, "appModuleList(app, 'coreModules')", 'static output must derive core assets from app.js.');
must(prepare, 'unreferenced Bella JS shipped', 'static release must reject unreferenced Bella modules.');
ok(!fs.existsSync('bella-feature-controls-v2.js'), 'superseded feature-controls-v2 must stay deleted.');
ok(!fs.existsSync('moments-v3-smoke-test.js'), 'obsolete Moments v3 smoke test must stay deleted.');

// v25 shell/runtime release wiring. The chat intelligence implementation remains v24 by design.
ok(pkg.version === '2.5.0', 'package release must be 2.5.0.');
must(app, 'Bella v25 Cleanup & Hardening', 'v25 app marker is missing.');
must(app, '?v=25', 'v25 runtime cache generation is missing.');
must(sw, 'bella-pwa-v26-release-25', 'v25 service-worker cache rotation is missing.');
must(sw, '?v=25', 'service worker must precache the v25 runtime generation.');
must(health, 'release: "v25"', 'health endpoint must report v25.');
must(health, 'cleanupHardening: "v25"', 'health endpoint must expose the v25 cleanup/hardening layer.');
must(health, 'databasePolicyHygiene: "v25"', 'health endpoint must expose v25 DB policy hygiene.');
must(chat, 'X-Bella-Release", "v24"', 'v24 chat intelligence layer marker must stay stable until that layer itself changes.');
const releaseHeader = (vercel.headers || []).find(rule => rule.source === '/')?.headers?.find(header => String(header.key || '').toLowerCase() === 'x-bella-release')?.value;
ok(releaseHeader === 'v25', 'Vercel shell release header must report v25.');

const apiFunctions = fs.readdirSync('api').filter(name => name.endsWith('.js'));
ok(apiFunctions.length <= 12, `Hobby-plan guard: ${apiFunctions.length} API functions found; maximum is 12.`);

console.log('Bella v25 cleanup & hardening checks passed: policy hygiene, explicit memory, Safe Mode quota protection, dead-code-resistant build graph and release wiring are valid.');
