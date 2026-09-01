const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const mustExist = [
  'index.html',
  'script.js',
  'bella-context.js',
  'bella-routing.js',
  'bella-personality.js',
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

const index = read('index.html');
const context = read('bella-context.js');
const routing = read('bella-routing.js');
const personality = read('bella-personality.js');
const runtime = read('bella-runtime.js');
const vnext = read('bella-vnext.js');
const speed = read('bella-speed.js');
const ui = read('bella-ui.js');
const chatApi = read('api/chat.js');
const diraApi = read('api/dira.js');
const build = read('build.js');
const sw = read('sw.js');

assert.ok(index.includes('/app.js?v=10'), 'index.html must load the latest unified app.js bundle');
assert.ok(index.includes('/sw.js?v=10'), 'index.html must force the latest service worker');
assert.ok(index.includes('window.__bellaSubmit'), 'index.html must include the critical send recovery wrapper');
assert.ok(index.includes('window.__bellaEmergencySend'), 'index.html must include direct API fallback for sending');
assert.ok(index.includes('onclick="window.__bellaSubmit(event)"'), 'send button must use the critical submit wrapper');
assert.ok(!index.includes('onkeydown="if(event.key'), 'legacy inline Enter handler must not remain');
assert.ok(!index.includes('<script src="/script.js'), 'index.html must not load legacy script.js directly');
assert.ok(!index.includes('<script src="/ai-fix.js'), 'index.html must not load obsolete ai-fix.js');
assert.ok(!index.includes('<script src="/bella-vnext.js'), 'index.html must not load vNext directly');
assert.ok(index.includes('id="quickSuggestions" hidden'), 'quick suggestions should remain hidden by default');

assert.ok(/window\.send\s*=(?!=)/.test(vnext), 'vNext must own active send flow');
assert.ok(/window\.getAIReply\s*=(?!=)/.test(vnext), 'vNext must own active AI reply flow');
assert.ok(/window\.updateMood\s*=(?!=)/.test(vnext), 'vNext must own active mood UI');
assert.ok(!/window\.send\s*=(?!=)/.test(routing), 'routing module must not own send flow');
assert.ok(/window\.fetch\s*=(?!=)/.test(runtime), 'runtime must own Bella network guard');
assert.ok(/window\.openBellaSettings\s*=(?!=)/.test(ui), 'UI module must own settings');
assert.ok(/window\.BellaContext\s*=(?!=)/.test(context), 'context module must own long conversation context');
assert.ok(/window\.BellaPersonality\s*=(?!=)/.test(personality), 'personality module must own adaptive personality state');
assert.ok(/window\.BellaSpeed\s*=(?!=)/.test(speed), 'speed module must own streaming UI bridge');
assert.ok(!build.includes('bella-send-guard.js'), 'conflicting capture-phase send guard must not be bundled');
assert.ok(context.includes('buildHistory'), 'context module must build smart history');
assert.ok(context.includes('shouldUseAIForRepeat'), 'context module must detect repeated short messages');
assert.ok(personality.includes('directInsult'), 'personality module must distinguish direct insults');
assert.ok(personality.includes('thirdPartyInsult'), 'personality module must distinguish quoted or third-party insults');
assert.ok(personality.includes('getStyleProfile'), 'personality module must build an adaptive style profile');
assert.ok(personality.includes('lastMode'), 'personality module must keep mood hysteresis state');
assert.ok(runtime.includes('BellaContext.buildHistory'), 'runtime must enrich chat history from BellaContext');
assert.ok(runtime.includes('BellaPersonality.enrichPayload'), 'runtime must enrich chat requests from BellaPersonality');
assert.ok(runtime.includes('consumeChatStream'), 'runtime must keep desktop streaming support');
assert.ok(speed.includes('isAppleSafari'), 'speed module must disable unstable Apple Safari streaming');
assert.ok(chatApi.includes('stream: wantsStream'), 'chat API must support streaming when requested');
assert.ok(diraApi.includes('cleanVisibleReply'), 'Dira API must sanitize visible web-search text');
assert.ok(diraApi.includes('الناتج الظاهر للمستخدم يكون كلام فقط'), 'Dira prompt must require plain visible text only');
assert.ok(!diraApi.includes('sources: collectSources'), 'Dira API must not return source-link buttons');
assert.ok(routing.includes('shouldUseAIForRepeat'), 'routing must escalate repeated short messages to AI');
assert.ok(ui.includes('randomSuggestions: false'), 'suggestions setting should default to off');
assert.ok(ui.includes('longContext: true'), 'long context setting should default to on');
assert.ok(sw.includes('bella-pwa-v10'), 'service worker cache must be bumped for send repair');

for (const moduleName of ['bella-context.js', 'bella-routing.js', 'bella-personality.js', 'bella-runtime.js', 'bella-vnext.js', 'bella-speed.js', 'bella-ui.js', 'bella-install.js']) {
  assert.ok(build.includes(moduleName), `build.js must bundle ${moduleName}`);
}

console.log('Bella smoke tests passed: critical send recovery, Safari safety, context, personality, Dira text-only output, ownership, settings, and bundle wiring are valid.');
