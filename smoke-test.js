const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const script = read('script.js');
const legacyPlus = read('bella-legacy-plus.js');
const context = read('bella-context.js');
const routing = read('bella-routing.js');
const style = read('bella-style.js');
const runtime = read('bella-runtime.js');
const vnext = read('bella-vnext.js');
const liveWeb = read('bella-live-web.js');
const account = read('bella-account.js');
const accountMemory = read('bella-account-memory.js');
const ui = read('bella-ui.js');
const speed = read('bella-speed.js');
const app = read('app.js');
const sw = read('sw.js');
const manifest = read('manifest.json');
const build = read('build.js');
const chatApi = read('api/chat.js');
const diraApi = read('api/dira.js');

assert.ok(script.includes('bella_clean_no_gemini_v31'), 'legacy state key must stay intact');
assert.ok(script.includes('window.send = async function'), 'legacy send surface must remain available for vNext wrapping');
assert.ok(script.includes('window.getAIReply = getAIReply'), 'legacy AI reply surface must remain available');
assert.ok(!script.includes('OPENAI_API_KEY'), 'browser script must not contain OpenAI secrets');

assert.ok(legacyPlus.includes('window.BellaLegacyPlus'), 'legacy-plus namespace must exist');
assert.ok(legacyPlus.includes('سوالف بيلا — مزح'), 'rumor feature must stay clearly playful');
assert.ok(!/window\.send\s*=(?!=)/.test(legacyPlus), 'legacy-plus must not own send');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(legacyPlus), 'legacy-plus must not own AI reply');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(legacyPlus), 'legacy-plus must not own mood');

assert.ok(context.includes('bella_context_v1'), 'context storage key must exist');
assert.ok(context.includes('MAX_TURNS = 48'), 'context must remain bounded');
assert.ok(context.includes('RETENTION_MS'), 'context retention must remain bounded');
assert.ok(/window\.BellaContext\s*=(?!=)/.test(context), 'context namespace must exist');
assert.ok(!/window\.send\s*=(?!=)/.test(context), 'context must not own send');

assert.ok(routing.includes('shouldUseAIForRepeat'), 'routing must escalate repeated short messages to AI');
assert.ok(routing.includes('isAmbiguousShort'), 'routing must detect ambiguous short messages');
assert.ok(routing.includes('shouldUseAIForOpenEnded'), 'routing must escalate open-ended prompts');
assert.ok(!/window\.send\s*=(?!=)/.test(routing), 'routing must not own send');

assert.ok(style.includes('bella_style_v1'), 'style state must stay versioned');
assert.ok(/window\.BellaPersonality\s*=(?!=)/.test(style), 'adaptive style namespace must exist');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(style), 'style module must not own canonical mood');

assert.ok(runtime.includes('OPENAI_TIMEOUT_MS = 30000'), 'runtime timeout must stay bounded at 30 seconds');
assert.ok(runtime.includes('MAX_RETRIES = 0'), 'paid chat POST must not retry automatically');
assert.ok(/window\.fetch\s*=(?!=)/.test(runtime), 'runtime must own the final fetch guard');
assert.ok(/window\.BellaRuntime\s*=(?!=)/.test(runtime), 'runtime namespace must exist');

assert.ok(vnext.includes('bella_vnext_v2'), 'vNext state key must stay intact');
assert.ok(/window\.send\s*=(?!=)/.test(vnext), 'vNext must own send');
assert.ok(/window\.getAIReply\s*=(?!=)/.test(vnext), 'vNext must own AI reply orchestration');
assert.ok(/window\.updateMood\s*=(?!=)/.test(vnext), 'vNext must own canonical mood');
assert.ok(vnext.includes('window.BellaContext?.recordTurn'), 'vNext must persist completed assistant turns to context');
assert.ok(vnext.includes('window.BellaLiveWeb?.enhanceMessage'), 'vNext must hand finished replies to live-web citation UI');

assert.ok(account.includes('bella_account_session_v1'), 'account session key must stay intact');
assert.ok(account.includes('bella_profiles'), 'account module must sync the cloud profile');
assert.ok(account.includes('has_synced'), 'account module must preserve first-sync state');
assert.ok(account.includes('window.BellaAccount'), 'account namespace must exist');
assert.ok(!account.includes('service_role') && !account.includes('sb_secret_'), 'account browser module must not contain secret Supabase credentials');
assert.ok(!/window\.send\s*=(?!=)/.test(account), 'account module must not own send');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(account), 'account module must not own AI reply');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(account), 'account module must not own mood');

assert.ok(accountMemory.includes('bella_memories'), 'account memory module must use cloud memories');
assert.ok(accountMemory.includes('deleted_at'), 'account memory module must preserve deletion tombstones');
assert.ok(/window\.BellaAccountMemory\s*=(?!=)/.test(accountMemory), 'account memory namespace must exist');
assert.ok(!/window\.send\s*=(?!=)/.test(accountMemory), 'account memory module must not own send');

assert.ok(liveWeb.includes('مصادر التحقق:'), 'live web UI must recognize deterministic citation sections');
assert.ok(liveWeb.includes('target="_blank"'), 'live web citations must be clickable');
assert.ok(/window\.BellaLiveWeb\s*=(?!=)/.test(liveWeb), 'live web namespace must exist');
assert.ok(!/window\.send\s*=(?!=)/.test(liveWeb), 'live web UI must not own send');

assert.ok(speed.includes('AppleWebKit'), 'speed bridge must detect Apple WebKit');
assert.ok(speed.includes('iPad'), 'speed bridge must preserve iPad-specific behavior');
assert.ok(/window\.BellaSpeed\s*=(?!=)/.test(speed), 'speed namespace must exist');

assert.ok(ui.includes('randomSuggestions: false'), 'suggestions setting should default to off');
assert.ok(ui.includes('longContext: true'), 'long context setting should default to on');
assert.ok(/window\.openBellaSettings\s*=(?!=)/.test(ui), 'settings namespace must remain owned by UI');

assert.ok(app.indexOf('bella-auth-bridge.js') < app.indexOf('bella-runtime.js'), 'auth bridge must load before runtime');
assert.ok(app.indexOf('bella-runtime.js') < app.indexOf('bella-vnext.js'), 'runtime must load before vNext send wrapper');
assert.ok(app.indexOf('bella-vnext.js') < app.indexOf('bella-speed.js'), 'speed bridge must load after vNext');
assert.ok(app.includes('bella-moderator-center.js'), 'app loader must include moderator center');

assert.ok(chatApi.includes('shouldUseLiveWebSearch'), 'chat API must detect current-information intent selectively');
assert.ok(chatApi.includes('MAX_LIVE_WEB_REQUESTS = 10'), 'live web search must have a separate cost guard');
assert.ok(chatApi.includes('type: "web_search"'), 'main chat must use the current Responses web_search tool');
assert.ok(chatApi.includes('search_context_size: "low"'), 'live web search must default to low context for cost control');
assert.ok(chatApi.includes('const upstreamStream = wantsStream && !useLiveWeb'), 'live web replies must use JSON so citations can be rendered safely');
assert.ok(chatApi.includes('outputTextWithCitations'), 'chat API must preserve and number web citations');
assert.ok(chatApi.includes('مصادر التحقق:'), 'chat API must return a deterministic source section for clickable rendering');
assert.ok(chatApi.includes('OPENAI_TIMEOUT_MS = 25000'), 'chat API must keep a bounded OpenAI timeout');
assert.ok(diraApi.includes('cleanVisibleReply'), 'Dira API must sanitize visible web-search text');
assert.ok(diraApi.includes('الناتج الظاهر للمستخدم يكون كلام فقط'), 'Dira prompt must require plain visible text only');
assert.ok(!diraApi.includes('sources: collectSources'), 'Dira API must not return source-link buttons');
assert.ok(diraApi.includes('MAX_REQUESTS = 12'), 'Dira API must have a request limit');
assert.ok(diraApi.includes('OPENAI_TIMEOUT_MS = 20000'), 'Dira API must have an OpenAI timeout');
assert.ok(diraApi.includes('AbortController'), 'Dira API must abort slow upstream requests');

assert.ok(routing.includes('shouldUseAIForRepeat'), 'routing must escalate repeated short messages to AI');
assert.ok(ui.includes('randomSuggestions: false'), 'suggestions setting should default to off');
assert.ok(ui.includes('longContext: true'), 'long context setting should default to on');
assert.ok(manifest.includes('"orientation": "any"'), 'PWA must allow tablet rotation');

assert.ok(sw.includes('bella-pwa-v11-stable-7'), 'service worker cache must use the moderator-center release cache');
assert.ok(sw.includes('/app.js?v=11'), 'service worker must cache the exact app entry requested by index.html');
for (const moduleName of ['bella-account.js', 'script.js', 'bella-legacy-plus.js', 'bella-context.js', 'bella-routing.js', 'bella-style.js', 'bella-runtime.js', 'bella-vnext.js', 'bella-live-web.js', 'bella-account-memory.js', 'bella-moderator-center.js', 'bella-speed.js', 'bella-ui.js', 'bella-install.js']) {
  assert.ok(sw.includes(`/${moduleName}?v=16`), `service worker must cache loader module ${moduleName}`);
}
assert.ok(sw.includes('request.mode === "navigate"'), 'offline HTML fallback must be navigation-only');
assert.ok(!sw.includes("cached || caches.match(\"/index.html\")"), 'static assets must never fall back to index.html');

for (const moduleName of ['bella-account.js', 'bella-account-memory.js', 'bella-live-web.js', 'bella-moderator-center.js', 'bella-legacy-plus.js', 'bella-context.js', 'bella-routing.js', 'bella-style.js', 'bella-runtime.js', 'bella-vnext.js', 'bella-speed.js', 'bella-ui.js', 'bella-install.js']) {
  assert.ok(build.includes(moduleName), `build.js must validate ${moduleName}`);
}

console.log('Bella smoke tests passed: selective live web search/clickable citations, cloud memory v2, accounts, moderator center, legacy features, send/mood ownership, context/cost/Safari/PWA protections are valid.');