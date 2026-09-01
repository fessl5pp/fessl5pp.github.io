const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const mustExist = [
  'index.html',
  'script.js',
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
  'sw.js'
];

for (const file of mustExist) {
  assert.ok(fs.existsSync(file), `Missing required Bella file: ${file}`);
}
assert.ok(!fs.existsSync('bella-send-guard.js'), 'obsolete bella-send-guard.js must stay deleted');

const index = read('index.html');
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
const sw = read('sw.js');

assert.ok(index.includes('/app.js?v=11'), 'index.html must load the unified app.js bundle');
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

assert.ok(context.includes('buildHistory'), 'context module must build smart history');
assert.ok(context.includes('shouldUseAIForRepeat'), 'context module must detect repeated short messages');
assert.ok(style.includes('getStyleProfile'), 'style module must build an adaptive style profile');
assert.ok(style.includes('Mood is owned by bella-vnext.js'), 'style module must not own Bella mood');
assert.ok(!style.includes('s.mode ='), 'style module must never mutate Bella mood');
assert.ok(runtime.includes('BellaContext.buildHistory'), 'runtime must enrich chat history from BellaContext');
assert.ok(runtime.includes('BellaPersonality.enrichPayload'), 'runtime must enrich chat requests from the style module');
assert.ok(runtime.includes('consumeChatStream'), 'runtime must keep desktop streaming support');
assert.ok(runtime.includes('const API_TIMEOUT_MS = 30000'), 'browser timeout must exceed the server OpenAI timeout');
assert.ok(runtime.includes('const RETRIES = 0'), 'paid POST requests must not auto-retry');
assert.ok(speed.includes('isAppleSafari'), 'speed module must disable unstable Apple Safari streaming');

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

assert.ok(sw.includes('bella-pwa-v11-stable-1'), 'service worker cache must use the stabilization cache');
assert.ok(sw.includes('/app.js?v=11'), 'service worker must cache the exact app asset requested by index.html');
assert.ok(sw.includes('request.mode === "navigate"'), 'offline HTML fallback must be navigation-only');
assert.ok(!sw.includes("cached || caches.match(\"/index.html\")"), 'static assets must never fall back to index.html');

for (const moduleName of ['bella-context.js', 'bella-routing.js', 'bella-style.js', 'bella-runtime.js', 'bella-vnext.js', 'bella-speed.js', 'bella-ui.js', 'bella-install.js']) {
  assert.ok(build.includes(moduleName), `build.js must bundle ${moduleName}`);
}

console.log('Bella stabilization smoke tests passed: send flow, single mood owner, style learning, cost guards, Safari safety, PWA fallback, context, Dira, and bundle wiring are valid.');
