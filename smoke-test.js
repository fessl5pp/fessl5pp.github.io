const fs = require('fs');
const assert = require('assert');

const read = file => fs.readFileSync(file, 'utf8');
const mustExist = [
  'index.html',
  'script.js',
  'bella-routing.js',
  'bella-runtime.js',
  'bella-vnext.js',
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
const routing = read('bella-routing.js');
const runtime = read('bella-runtime.js');
const vnext = read('bella-vnext.js');
const ui = read('bella-ui.js');
const build = read('build.js');

assert.ok(index.includes('/app.js?v='), 'index.html must load the unified app.js bundle');
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
assert.ok(ui.includes('randomSuggestions: false'), 'suggestions setting should default to off');

for (const moduleName of ['bella-routing.js', 'bella-runtime.js', 'bella-vnext.js', 'bella-ui.js', 'bella-install.js']) {
  assert.ok(build.includes(moduleName), `build.js must bundle ${moduleName}`);
}

console.log('Bella smoke tests passed: shell, module ownership, settings, and bundle wiring are valid.');
