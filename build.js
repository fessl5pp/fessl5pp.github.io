const fs = require('fs');

function fail(message) {
  console.error(`Bella build validation failed: ${message}`);
  process.exit(1);
}

function read(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function appModuleList(app, constName) {
  const match = app.match(new RegExp(`const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!match) fail(`app.js is missing ${constName}`);
  return [...match[1].matchAll(/["']([^"']+\.js)["']/g)].map(item => item[1]);
}

const app = read('app.js');
const coreModules = appModuleList(app, 'coreModules');
const deferredModules = appModuleList(app, 'deferredModules');
const browserModules = [...coreModules, ...deferredModules];
const uniqueModules = [...new Set(browserModules)];

if (uniqueModules.length !== browserModules.length) {
  const duplicates = browserModules.filter((file, index) => browserModules.indexOf(file) !== index);
  fail(`duplicate app modules: ${[...new Set(duplicates)].join(', ')}`);
}

const criticalModules = [
  'bella-account.js',
  'bella-account-memory.js',
  'bella-live-web.js',
  'bella-legacy-plus.js',
  'bella-style.js',
  'bella-vnext.js',
  'bella-context-v24.js',
  'bella-memory-v4.js',
  'bella-feature-controls-v3.js',
  'bella-resilience-v22.js',
  'bella-moderator-center.js'
];
for (const file of criticalModules) {
  if (!browserModules.includes(file)) fail(`critical runtime module is not loaded: ${file}`);
}
if (!deferredModules.includes('bella-owner-resilience-v22.js')) fail('owner resilience UI must remain deferred');
if (browserModules.includes('bella-feature-controls-v2.js')) fail('superseded feature-controls-v2 must not be loaded');

const loaded = uniqueModules.map(file => {
  const source = read(file);
  try { new Function(source); }
  catch (error) { fail(`syntax error in ${file}: ${error.message}`); }
  return { file, source };
});
const byFile = new Map(loaded.map(item => [item.file, item.source]));

const exclusiveOwners = [
  [/window\.BellaAccount\s*=(?!=)/, 'bella-account.js', 'account'],
  [/window\.BellaAnalytics\s*=(?!=)/, 'bella-analytics.js', 'analytics'],
  [/window\.BellaConfig\s*=(?!=)/, 'bella-config.js', 'public config'],
  [/window\.BellaAuthBridge\s*=(?!=)/, 'bella-auth-bridge.js', 'auth bridge'],
  [/window\.BellaVoice\s*=(?!=)/, 'bella-voice.js', 'voice'],
  [/window\.BellaVoiceV2\s*=(?!=)/, 'bella-voice-v2.js', 'voice v2'],
  [/window\.BellaBrainV2\s*=(?!=)/, 'bella-brain-v2.js', 'brain'],
  [/window\.BellaAlive\s*=(?!=)/, 'bella-alive.js', 'alive'],
  [/window\.BellaMomentFeedback\s*=(?!=)/, 'bella-moments-feedback.js', 'moment feedback'],
  [/window\.BellaAIActivities\s*=(?!=)/, 'bella-ai-activities.js', 'AI activities'],
  [/window\.BellaAccountMemory\s*=(?!=)/, 'bella-account-memory.js', 'cloud memory'],
  [/window\.BellaAccountCenter\s*=(?!=)/, 'bella-account-center.js', 'account center'],
  [/window\.BellaOwnerCenter\s*=(?!=)/, 'bella-owner-center.js', 'owner center'],
  [/window\.BellaModeratorCenter\s*=(?!=)/, 'bella-moderator-center.js', 'moderator center'],
  [/window\.BellaLiveWeb\s*=(?!=)/, 'bella-live-web.js', 'live web UI'],
  [/window\.BellaMoments\s*=(?!=)/, 'bella-moments.js', 'moments'],
  [/window\.send\s*=(?!=)/, 'bella-vnext.js', 'send flow'],
  [/window\.getAIReply\s*=(?!=)/, 'bella-vnext.js', 'AI reply flow'],
  [/window\.updateMood\s*=(?!=)/, 'bella-vnext.js', 'mood UI'],
  [/window\.openBellaSettings\s*=(?!=)/, 'bella-ui.js', 'settings UI']
];

for (const [pattern, expected, label] of exclusiveOwners) {
  const owners = loaded.filter(item => pattern.test(item.source)).map(item => item.file);
  if (owners.length !== 1 || owners[0] !== expected) {
    fail(`${label} owner expected ${expected}; found ${owners.join(', ') || 'none'}`);
  }
}

function requireAssignment(file, pattern, label) {
  if (!pattern.test(byFile.get(file) || '')) fail(`${file} must own ${label}`);
}

// Layered namespaces intentionally have a base implementation plus a forward-compatible overlay.
requireAssignment('bella-context.js', /window\.BellaContext\s*=(?!=)/, 'base BellaContext');
requireAssignment('bella-context-v24.js', /window\.BellaContext\s*=\s*api/, 'v24 BellaContext overlay');
requireAssignment('bella-memory-v3.js', /window\.BellaMemoryV3\s*=(?!=)/, 'base BellaMemoryV3');
requireAssignment('bella-memory-v4.js', /window\.BellaMemoryV3\s*=\s*api/, 'v4 BellaMemoryV3 compatibility overlay');

const networkLayers = ['bella-auth-bridge.js', 'bella-runtime.js', 'bella-feature-controls-v3.js', 'bella-resilience-v22.js'];
for (let i = 0; i < networkLayers.length - 1; i++) {
  if (coreModules.indexOf(networkLayers[i]) >= coreModules.indexOf(networkLayers[i + 1])) {
    fail(`network layer order is unsafe: ${networkLayers.join(' -> ')}`);
  }
}
for (const file of networkLayers) {
  if (!/window\.fetch\s*=(?!=)/.test(byFile.get(file) || '')) fail(`${file} must explicitly wrap browser fetch`);
}
if (!(byFile.get('bella-runtime.js') || '').includes('const RETRIES = 0')) fail('paid AI POST requests must not auto-retry');

const bundle = loaded.map(({ file, source }) => `\n;/* ---- ${file} ---- */\n${source}\n`).join('\n');
try { new Function(bundle); }
catch (error) { fail(`combined browser runtime syntax error: ${error.message}`); }

console.log(`Bella complete browser graph validated (${uniqueModules.length} modules, ${bundle.length} chars).`);
console.log(`Bella runtime split validated: ${coreModules.length} core + ${deferredModules.length} deferred; layered context/memory and fetch ownership are intentional.`);
