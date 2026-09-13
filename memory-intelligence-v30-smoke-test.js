const fs = require('fs');
const vm = require('vm');

function read(path) {
  if (!fs.existsSync(path)) throw new Error(`Missing ${path}`);
  return fs.readFileSync(path, 'utf8');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const memoryV5 = read('bella-memory-v5.js');
const cloud = read('bella-account-memory-v30.js');
const semantic = read('lib/bella-semantic-memory-v30.js');
const migration = read('supabase/migrations/20260913115100_bella_memory_intelligence_v30.sql');
const gated = read('api/gated-chat.js');
const health = read('api/health.js');
const app = read('app.js');
const sw = read('sw.js');
const pkg = JSON.parse(read('package.json'));

const sandbox = {
  window: {
    BellaMemoryV4: {
      enrichPayload: payload => payload,
      importance: () => 60
    }
  }
};
vm.runInNewContext(memoryV5, sandbox);
const memory = sandbox.window.BellaMemoryV5;
assert(memory?.version === 5, 'Memory v5 did not install.');
assert(memory.maxCloudMemory === 48, 'Memory v5 cloud capacity must be 48.');
assert(memory.maxWorkingDurable === 12, 'Memory v5 prompt working set must stay 12.');

const positive = memory.analyzeMemory('أحب القهوة');
const negative = memory.analyzeMemory('ما أحب القهوة');
assert(positive.topicKey && positive.topicKey === negative.topicKey, 'Opposite preference memories must resolve to one topic.');
assert(positive.polarity === 1 && negative.polarity === -1, 'Preference polarity classification failed.');
assert(memory.analyzeMemory('اسمي فيصل').topicKey === 'identity:name', 'Identity topic classification failed.');
assert(memory.analyzeMemory('باجر عندي سفر').importance <= 48, 'Temporary-looking explicit memory must have lower importance.');
const distilled = memory.distillMemoryList(['أحب القهوة', 'ما أحب القهوة'], 12);
assert(distilled.length === 1 && /ما أحب القهوة/.test(distilled[0]), 'Newest contradictory memory must win the local working set.');

assert(cloud.includes('const MAX_MEMORY = 48'), 'v30 cloud memory must retain up to 48 durable memories.');
assert(cloud.includes('bella_memory_save_v30'), 'v30 cloud client must use smart save RPC.');
assert(cloud.includes('superseded_at'), 'v30 cloud sync must understand superseded memories.');
assert(cloud.includes('LEGACY_PROFILE_MAX = 12'), 'Legacy profile mirror must stay bounded to 12.');
assert(cloud.includes('window.BellaMemoryV5?.analyzeMemory'), 'Cloud save must use Memory v5 metadata.');

for (const column of ['topic_key','polarity','confidence','last_confirmed_at','superseded_at','superseded_by','superseded_reason','memory_version']) {
  assert(migration.includes(column), `v30 migration missing ${column}.`);
}
assert(migration.includes('bella_memory_save_v30'), 'v30 smart save RPC is missing.');
assert(migration.includes('bella_memory_hybrid_search_v30'), 'v30 hybrid search RPC is missing.');
assert(migration.includes('bella_memory_mark_recalled_v30'), 'v30 recall RPC is missing.');
assert((migration.match(/security invoker/g) || []).length >= 3, 'All v30 memory RPCs must remain SECURITY INVOKER.');
assert(!migration.includes('security definer'), 'v30 memory RPCs must not bypass RLS.');
assert(migration.includes("superseded_reason = case"), 'v30 must record contradiction/near-duplicate supersession.');
assert(migration.includes('sensitive memory is not allowed'), 'v30 server must enforce sensitive-memory rejection.');
assert(migration.includes("deleted_at = coalesce(m.deleted_at, now())"), 'Superseded memories must also be tombstoned for old-client compatibility.');

assert(semantic.includes('bella_memory_hybrid_search_v30'), 'Server retrieval must use v30 hybrid search.');
assert(semantic.includes('bella_memory_mark_recalled_v30'), 'Server retrieval must reinforce recalled memories.');
assert(semantic.includes('confidenceAware: true'), 'Server retrieval must expose confidence-aware behavior.');
assert(semantic.includes('contradictionAware: true'), 'Server retrieval must be contradiction-aware.');
assert(semantic.includes('MAX_RETRIEVED = 8'), 'v30 semantic retrieval should stay bounded.');
assert(semantic.includes('existing.slice(-6)'), 'Prompt memory merge must remain bounded rather than dumping cloud memory.');

assert(gated.includes('enrichBellaSemanticMemoryV30'), 'Gated chat must use Semantic Memory v30.');
assert(gated.includes('X-Bella-Memory-Intelligence'), 'Gated chat must expose v30 memory diagnostics.');
assert(health.includes('memoryIntelligence: "v30"'), 'Health must expose Memory Intelligence v30.');
assert(health.includes('memoryCloudCapacity: 48'), 'Health must expose v30 cloud capacity.');
assert(app.includes('"bella-memory-v5.js"'), 'Memory v5 is not in the browser graph.');
assert(app.includes('"bella-account-memory-v30.js"'), 'v30 account memory is not in the browser graph.');
assert(!app.includes('"bella-account-memory.js",'), 'Legacy account-memory runtime must not load alongside v30.');
assert(app.includes('?v=30'), 'Browser module generation must be v30.');
assert(sw.includes('bella-pwa-v31-release-30'), 'PWA cache generation must be v30.');
assert(sw.includes('/bella-memory-v5.js?v=30'), 'PWA must cache Memory v5.');
assert(sw.includes('/bella-account-memory-v30.js?v=30'), 'PWA must cache v30 cloud memory.');
assert(String(pkg.version) === '3.0.0', 'Package version must be 3.0.0 for v30.');
assert(String(pkg.scripts?.test || '').includes('memory-intelligence-v30-smoke-test.js'), 'v30 regression gate missing from npm test.');
assert(String(pkg.scripts?.['vercel-build'] || '').includes('memory-intelligence-v30-smoke-test.js'), 'v30 regression gate missing from Vercel build.');

console.log('Bella v30 Memory Intelligence checks passed: topic/polarity contradictions, 48-memory cloud capacity, 12-memory prompt bound, confidence/importance/confirmation/recall retrieval and RLS-safe RPCs are wired.');
