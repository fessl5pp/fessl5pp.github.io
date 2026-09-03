const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
for (const file of ['bella-voice.js', 'api/voice.js', 'api/gated-voice.js', 'app.js', 'sw.js', 'vercel.json', 'build.js']) {
  assert.ok(fs.existsSync(file), `Missing Bella voice file: ${file}`);
}

const client = read('bella-voice.js');
const api = read('api/voice.js');
const gate = read('api/gated-voice.js');
const app = read('app.js');
const sw = read('sw.js');
const vercel = JSON.parse(read('vercel.json'));
const build = read('build.js');

new Function(client);
assert.ok(/window\.BellaVoice\s*=(?!=)/.test(client), 'voice module must expose one BellaVoice namespace');
assert.ok(client.includes('/api/voice'), 'voice client must call the protected voice endpoint');
assert.ok(client.includes('bella_voice_v1'), 'voice client must persist its own preference');
assert.ok(client.includes('legacy.voiceEnabled = false'), 'voice client must disable the old device-only voice engine before vNext boots');
assert.ok(client.includes('speechSynthesis'), 'voice client must retain a device TTS fallback');
assert.ok(client.includes('decodeAudioData'), 'voice client must use Web Audio for delayed iOS-compatible playback');
assert.ok(!client.includes('OPENAI_API_KEY'), 'browser voice client must never reference the OpenAI secret');
assert.ok(!client.includes('sk-'), 'browser voice client must never contain an OpenAI secret');
assert.ok(!/window\.send\s*=(?!=)/.test(client), 'voice module must not own send');
assert.ok(!/window\.getAIReply\s*=(?!=)/.test(client), 'voice module must not own AI chat');
assert.ok(!/window\.fetch\s*=(?!=)/.test(client), 'voice module must not replace fetch');

assert.ok(api.includes('gpt-4o-mini-tts'), 'voice API must use the dedicated TTS model');
assert.ok(api.includes('voice: "coral"'), 'Bella voice must stay pinned to the selected voice');
assert.ok(api.includes('response_format: "mp3"'), 'voice API must request MP3 output');
assert.ok(api.includes('claimBellaAi("chat")'), 'voice generation must respect the global AI budget/maintenance gate');
assert.ok(api.includes('MAX_TEXT_CHARS = 700'), 'voice input must stay bounded');
assert.ok(api.includes('MAX_REQUESTS = 12'), 'voice API must have a separate rate guard');
assert.ok(api.includes('OPENAI_TIMEOUT_MS = 18000'), 'voice API must have a bounded upstream timeout');
assert.ok(api.includes('process.env.OPENAI_API_KEY'), 'voice API must read the key server-side only');
assert.ok(gate.includes('checkBellaAccountAccess'), 'voice endpoint must reject suspended signed-in accounts');
assert.ok(gate.includes('rejectSuspendedAccount'), 'voice gate must enforce account suspension');

assert.ok(app.indexOf('bella-voice.js') < app.indexOf('bella-vnext.js'), 'voice migration must run before vNext reads legacy voiceEnabled');
assert.ok(sw.includes('/bella-voice.js?v=16'), 'PWA shell must cache Bella voice client');

const rewriteMap = new Map((vercel.rewrites || []).map(rule => [rule.source, rule.destination]));
assert.strictEqual(rewriteMap.get('/api/voice'), '/api/gated-voice', 'Vercel must route /api/voice through the account gate');
assert.ok(build.includes("['bella-voice.js', 'Server-backed Bella voice with local fallback']"), 'build must validate the voice module');
assert.ok(build.includes("owner: 'bella-voice.js'"), 'build ownership must reserve BellaVoice for its module');

console.log('Bella voice smoke tests passed: server TTS, budget/account gating, local fallback, PWA and ownership are valid.');
