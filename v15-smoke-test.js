const fs = require('fs');
const assert = require('assert');
function read(path) { return fs.readFileSync(path, 'utf8'); }

const brain = read('bella-brain-v2.js');
const context = read('bella-context.js');
const memory = read('bella-memory-v3.js');
const alive = read('bella-alive.js');
const feedback = read('bella-moments-feedback.js');
const activities = read('bella-ai-activities.js');
const activityApi = read('api/activity-generate.js');
const gatedActivity = read('api/gated-activity.js');
const persona = read('lib/bella-persona.js');
const style = read('bella-style.js');
const auth = read('bella-auth-bridge.js');
const app = read('app.js');
const sw = read('sw.js');
const vercel = JSON.parse(read('vercel.json'));
const security = read('supabase/migrations/20260905080207_harden_bella_rpc_grants_v15.sql');
const voiceApi = read('api/voice.js');
const voiceV2 = read('bella-voice-v2.js');

assert.ok(brain.includes('classifyIntent') && brain.includes('relationshipSnapshot'), 'Brain v2 must classify intent and relationship');
assert.ok(brain.includes('followup_short') && brain.includes('من الربع'), 'Brain v2 must understand short followups and relationship stages');
assert.ok(brain.includes('relationshipScore') && brain.includes('teasingLevel') && brain.includes('applyRelationshipStyle'), 'Relationship model must retain closeness compatibility and adaptive teasing/style');
assert.ok(brain.includes('assumeRomance: false') && brain.includes('teasingLevel') && (brain.includes('نغزة ${intent.serious ? 0 : relationship.teasingLevel}/3') || brain.includes('relationshipVector')), 'Relationship model must avoid automatic romance and expose teasing/vector signals');
assert.ok(brain.includes('if (intent.serious)') && brain.includes('style.humor = 0'), 'Relationship model must disable teasing in serious contexts');

assert.ok(context.includes('antiRepeatProfile') && context.includes('openingKey') && context.includes('endingKey'), 'Anti-Repetition v2 must track reply openings and endings');
assert.ok(context.includes('recentOpenings') && context.includes('hotOpenings') && context.includes('hotLaughter'), 'Anti-Repetition v2 must detect repeated openings and laughter patterns');
assert.ok(context.includes('افتتاحيات بيلا الأخيرة') && context.includes('ضحكات/إيموجيز تكررت مؤخرًا'), 'Recent reply context must surface repetition signals to the chat model');
assert.ok(context.includes('similarity(existing, value) >= 0.78'), 'Anti-Repetition v2 must reject near-duplicate recent replies aggressively');

assert.ok(memory.includes('sessionStorage') && memory.includes('مؤقت للجلسة فقط'), 'Memory v3 must keep temporary facts session-only');
assert.ok(memory.includes('BellaAccountMemory?.remember') && memory.includes('explicitRemember'), 'Memory v3 must support explicit durable memory');
assert.ok(alive.includes('وينك مختفي') && alive.includes('MIN_AWAY'), 'Bella Alive must use the approved natural return style');
assert.ok(!alive.includes('يا بعد قلبي مختفي'), 'Bella Alive must not use the rejected over-written return line');
assert.ok(feedback.includes('👍 عجبتني') && feedback.includes('👎 مو جوي'), 'Moments must expose like/dislike reactions');
assert.ok(feedback.includes('boostRemote') && feedback.includes('score(row.category)'), 'Moment reactions must influence remote category weighting');
assert.ok(activities.includes('/api/activity-generate') && activities.includes('+8 XP'), 'AI activities must generate new challenges and award XP');
assert.ok(activityApi.includes('json_schema') && activityApi.includes('claimBellaAi'), 'AI activities must use structured output and global AI cost controls');
assert.ok(gatedActivity.includes('checkBellaAccountAccess') && gatedActivity.includes('rejectSuspendedAccount'), 'AI activities must respect suspended accounts');
assert.ok(auth.includes('/api/activity-generate'), 'Signed-in auth bridge must attach account token to AI activities');

assert.ok(persona.includes('أسلوب الكتابة الكويتي الطبيعي — قاعدة v15 الأساسية'), 'Persona must contain the v15 natural Kuwaiti writing rule');
assert.ok(persona.includes('وينك مختفي') && persona.includes('لا «تقلدين» اللهجة الكويتية'), 'Persona must prefer natural Kuwaiti chat over dialect stuffing');
assert.ok(persona.includes('لا تحشرين «يا بعد جبدي»'), 'Persona must explicitly avoid forced dialect words');
assert.ok(style.includes('BellaBrainV2.enrichPayload') && style.includes('BellaMemoryV3.enrichPayload'), 'Chat payload must receive Brain v2 and Memory v3 context');

assert.ok(app.includes('const coreModules') && app.includes('const deferredModules'), 'v15 performance split must exist');
assert.ok(app.indexOf('"bella-brain-v2.js"') < app.indexOf('"bella-runtime.js"'), 'Brain v2 must load before runtime chat calls');
assert.ok(app.indexOf('"bella-context.js"') < app.indexOf('"bella-runtime.js"'), 'Anti-Repetition context must load before runtime chat calls');
assert.ok(app.indexOf('"bella-owner-center.js"') > app.indexOf('const deferredModules'), 'Owner modules must be in deferred loading group');
assert.ok(app.includes('requestIdleCallback') && app.includes('__bellaLoadDeferred'), 'Admin/cloud modules must load during idle with explicit fallback');
assert.ok(app.includes('bella-owner-dashboard-v2.js'), 'Owner v15 dashboard must be deferred into the app');

assert.ok(voiceV2.includes('BellaVoice?.stop') && voiceV2.includes('input'), 'Voice v2 must stop as soon as the user starts typing');
const voiceApiLower = voiceApi.toLowerCase();
assert.ok(voiceApiLower.includes('casual private voice note') && voiceApiLower.includes('do not over-act the dialect'), 'Server voice must use natural mood-aware Kuwaiti delivery');

assert.ok(security.includes('revoke all on function public.bella_owner_summary() from public, anon, authenticated'), 'Owner RPC grants must be explicitly revoked before regrant');
assert.ok(security.includes('grant execute on function public.bella_owner_summary() to authenticated'), 'Owner RPC must be signed-in only');
assert.ok(security.includes('bella_claim_ai_request(text) to anon, authenticated'), 'Only intended public AI control RPC remains anonymous');

assert.ok(vercel.rewrites.some(r => r.source === '/api/activity-generate' && r.destination === '/api/gated-activity'), 'Vercel must gate AI activity generation');
const release = (vercel.headers.find(r => r.source === '/')?.headers || []).find(h => h.key === 'X-Bella-Release')?.value || '';
assert.ok(/^v\d+$/.test(release) && Number(release.slice(1)) >= 15, `Shell must expose release v15 or newer, got ${release || 'none'}`);
assert.ok(sw.includes('bella-pwa-v17-release-15'), 'PWA cache must retain the v15 rotation marker');
for (const f of ['bella-brain-v2.js','bella-memory-v3.js','bella-alive.js','bella-moments-feedback.js','bella-ai-activities.js','bella-owner-dashboard-v2.js','bella-voice-v2.js']) assert.ok(sw.includes(`/${f}?v=16`), `PWA must retain compatibility marker for ${f}`);

console.log(`Bella v15+ regression checks passed on ${release}: Relationship compatibility/vector model, Anti-Repetition v2, natural Kuwaiti Brain, layered memory, Alive, moments learning, AI activities, Voice v2, security grants and deferred loading remain wired.`);
