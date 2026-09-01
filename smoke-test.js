const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const mustExist = [
  'index.html',
  'app.js',
  'script.js',
  'bella-legacy-plus.js',
  'bella-context.js',
  'bella-routing.js',
  'bella-style.js',
  'bella-runtime.js',
  'bella-vnext.js',
  'bella-speed.js',
  'bella-ui.js',
  'bella-install.js',
  'api/chat.js',
  'api/dira.js',
  'manifest.json',
  'sw.js'
];

for (const file of mustExist) {
  assert.ok(fs.existsSync(file), `Missing required Bella file: ${file}`);
}
assert.ok(!fs.existsSync('bella-send-guard.js'), 'obsolete bella-send-guard.js must stay deleted');
assert.ok(!fs.existsSync('bella-personality.js'), 'duplicate bella-personality.js mood engine must stay deleted');

const index = read('index.html');
const app = read('app.js');
const legacy = read('script.js');
const legacyPlus = read('bella-legacy-plus.js');
const context = read('bella-context.js');
const routing = read('bella-routing.js');
const style = read('bella-style.js');
const runtime = read('bella-runtime.js');
const vnext = read('bella-vnext.js');
const speed = read('bella-speed.js');
const ui = read('bella-ui.js');
const chatApi = read('api/chat.js');
const diraApi = read('api/dira.js');
const build = read('build.js');
const manifest = read('manifest.json');
const sw = read('sw.js');

assert.ok(index.includes('/app.js?v=11'), 'index.html must load the unified app.js entry');
assert.ok(index.includes('/sw.js?v=11'), 'index.html must register the service worker once');
assert.ok(index.includes('window.__bellaSubmit'), 'index.html must include the critical send recovery wrapper');
assert.ok(index.includes('window.__bellaEmergencySend'), 'index.html must include direct API fallback for sending');
assert.ok(index.includes('onclick="window.__bellaSubmit()"'), 'send button must use the critical submit wrapper');
assert.ok(index.includes('await window.send()'), 'critical submit wrapper must await the real send promise');
assert.ok(!index.includes('onkeydown="if(event.key'), 'legacy inline Enter handler must not remain');
assert.ok(!index.includes('<script src="/script.js'), 'index.html must not load legacy script.js directly');
assert.ok(!index.includes('<script src="/ai-fix.js'), 'index.html must not load obsolete ai-fix.js');
assert.ok(!index.includes('<script src="/bella-vnext.js'), 'index.html must not load vNext directly');
assert.ok(index.includes('id="quickSuggestions" hidden'), 'quick suggestions should remain hidden by default');

assert.ok(app.includes('bella-legacy-plus.js'), 'tracked app entry must load legacy improvements');
assert.ok(app.includes('bella-style.js'), 'tracked app entry must know the style module');
assert.ok(app.includes('bella-vnext.js'), 'tracked app entry must know the main conversation module');
assert.ok(app.includes('window.__bellaBoot'), 'tracked app entry must expose boot completion');
assert.ok(app.includes('?v=13'), 'tracked app entry must cache-bust source modules');

for (const feature of ['coffeeRadar', 'socialRadarReply', 'dailyWisdom', 'startBoxGame', 'startProverbGame', 'checkGameAnswer', 'openFazaa', 'fazaaReply', 'shareChat', 'showRumor']) {
  assert.ok(legacy.includes(`function ${feature}`), `legacy feature ${feature} must remain present`);
}
assert.ok(legacyPlus.includes('window.BellaLegacyPlus'), 'legacy enhancement module must expose one debug/status namespace');
assert.ok(legacyPlus.includes('MAX_RADAR_HISTORY = 6'), 'radar must avoid recent repeated places');
assert.ok(legacyPlus.includes('MAX_GAME_HISTORY = 4'), 'games must avoid recent repeated challenges');
assert.ok(legacyPlus.includes('مو إحصائية حقيقية'), 'social radar must be clearly labeled as playful, not live analytics');
assert.ok(legacyPlus.includes('سوالف بيلا — مزح'), 'rumor feature must be clearly labeled as playful content');
assert.ok(legacyPlus.includes('navigator.share'), 'share card must support native device sharing when available');
assert.ok(legacyPlus.includes('robustCopy'), 'share copy must include a clipboard fallback');
assert.ok(legacyPlus.includes('gameStreak'), 'legacy games must keep a lightweight win streak');
assert.ok(legacyPlus.includes('إذا تبي شي حي استخدم «شكو ماكو؟»'), 'static radar must route live requests to Dira instead of pretending to be current');
assert.ok(!/window\.send\s*=(?!=)/.test(legacyPlus), 'legacy enhancement module must never own send flow');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(legacyPlus), 'legacy enhancement module must never own AI flow');
assert.ok(!/window\.updateMood\s*=(?!=)/.test(legacyPlus), 'legacy enhancement module must never own mood flow');

assert.ok(/window\.send\s*=(?!=)/.test(vnext), 'vNext must own active send flow');
assert.ok(/window\.getAIReply\s*=(?!=)/.test(vnext), 'vNext must own active AI reply flow');
assert.ok(/window\.updateMood\s*=(?!=)/.test(vnext), 'vNext must own active mood UI');
assert.ok(vnext.includes('finally {\n      sending = false;'), 'vNext send flow must always release the sending lock');
assert.ok(vnext.includes('if (sending) return false;'), 'vNext send flow must report a busy send instead of silently swallowing it');
assert.ok(!vnext.includes('serviceWorker.register'), 'vNext must not register a second service worker');
assert.ok(!/window\.send\s*=(?!=)/.test(routing), 'routing module must not own send flow');
assert.ok(/window\.fetch\s*=(?!=)/.test(runtime), 'runtime must own Bella network guard');
assert.ok(/window\.openBellaSettings\s*=(?!=)/.test(ui), 'UI module must own settings');
assert.ok(/window\.BellaContext\s*=(?!=)/.test(context), 'context module must own long conversation context');
assert.ok(/window\.BellaPersonality\s*=(?!=)/.test(style), 'style module must own adaptive communication profile');
assert.ok(/window\.BellaSpeed\s*=(?!=)/.test(speed), 'speed module must own streaming UI bridge');

assert.ok(!build.includes('bella-personality.js'), 'old duplicate mood/personality module must not be bundled');
assert.ok(!build.includes('bella-send-guard.js'), 'conflicting capture-phase send guard must not be bundled');
assert.ok(build.includes('bella-style.js'), 'style-only adaptive module must be bundled');
assert.ok(build.includes('bella-legacy-plus.js'), 'cleaned legacy enhancement module must be validated by the build');

assert.ok(context.includes('buildHistory'), 'context module must build smart history');
assert.ok(context.includes('shouldUseAIForRepeat'), 'context module must detect repeated short messages');
assert.ok(context.includes('recordTurn,'), 'context module must expose safe turn recording');
assert.ok(style.includes('getStyleProfile'), 'style module must build an adaptive style profile');
assert.ok(style.includes('Mood is owned by bella-vnext.js'), 'style module must not own Bella mood');
assert.ok(!style.includes('s.mode ='), 'style module must never mutate Bella mood');
assert.ok(runtime.includes('BellaContext.buildHistory'), 'runtime must enrich chat history from BellaContext');
assert.ok(runtime.includes('BellaPersonality.enrichPayload'), 'runtime must enrich chat requests from the style module');
assert.ok(runtime.includes('consumeChatStream'), 'runtime must keep desktop streaming support');
assert.ok(runtime.includes('const API_TIMEOUT_MS = 30000'), 'browser timeout must exceed the server OpenAI timeout');
assert.ok(runtime.includes('const RETRIES = 0'), 'paid POST requests must not auto-retry');
assert.ok(speed.includes('isAppleSafari'), 'speed module must disable unstable Apple Safari streaming');
assert.ok(speed.includes('BellaContext?.recordTurn?.("assistant", full)'), 'completed streamed replies must be persisted to context');

assert.ok(chatApi.includes('stream: wantsStream'), 'chat API must support streaming when requested');
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

assert.ok(sw.includes('bella-pwa-v11-stable-3'), 'service worker cache must use the legacy refresh cache');
assert.ok(sw.includes('/app.js?v=11'), 'service worker must cache the exact app entry requested by index.html');
for (const moduleName of ['script.js', 'bella-legacy-plus.js', 'bella-context.js', 'bella-routing.js', 'bella-style.js', 'bella-runtime.js', 'bella-vnext.js', 'bella-speed.js', 'bella-ui.js', 'bella-install.js']) {
  assert.ok(sw.includes(`/${moduleName}?v=13`), `service worker must cache loader module ${moduleName}`);
}
assert.ok(sw.includes('request.mode === "navigate"'), 'offline HTML fallback must be navigation-only');
assert.ok(!sw.includes("cached || caches.match(\"/index.html\")"), 'static assets must never fall back to index.html');

for (const moduleName of ['bella-legacy-plus.js', 'bella-context.js', 'bella-routing.js', 'bella-style.js', 'bella-runtime.js', 'bella-vnext.js', 'bella-speed.js', 'bella-ui.js', 'bella-install.js']) {
  assert.ok(build.includes(moduleName), `build.js must validate ${moduleName}`);
}

console.log('Bella smoke tests passed: legacy features preserved and enhanced, send/mood ownership intact, context/cost/Safari/PWA protections valid.');
