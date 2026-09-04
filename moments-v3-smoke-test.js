const fs = require('fs');

function fail(message) {
  console.error(`Bella moments v3 smoke failed: ${message}`);
  process.exit(1);
}

const moments = fs.readFileSync('bella-moments.js', 'utf8');
const momentsUI = fs.readFileSync('bella-moments-ui.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

for (const token of [
  'Bella v13 moments engine',
  'bella_moments_v3',
  'topic-tags-only-no-chat-text',
  'legendaryChance',
  'rumorBanks.legendary',
  'MAX_RECENT = 16',
  'SERIOUS_MS = 3 * 60 * 1000',
  'setIntensity',
  'momentsIntensity',
  'window.handleTypingBehavior = handleTyping',
  'window.BellaMoments = Object.freeze',
  'awardXP',
  'prefers-reduced-motion'
]) {
  if (!moments.includes(token)) fail(`missing engine marker: ${token}`);
}

for (const bank of ['morning', 'evening', 'night', 'weekend', 'coffee', 'university', 'gaming', 'rare', 'legendary']) {
  if (!moments.includes(`${bank}: [`)) fail(`missing rumor bank: ${bank}`);
}

if (!/high:\s*\{\s*toast:\s*8500,\s*rumorMin:\s*30000/.test(moments)) fail('high intensity cadence must stay frequent.');
if (!moments.includes('document.querySelector(".bella-popup")?.remove()')) fail('rumors and top-right moments must not overlap.');
if (!moments.includes('seriousUntil = now + SERIOUS_MS')) fail('serious conversations must suppress ambient comedy.');
if (!moments.includes('state.lastTopic = session.topic')) fail('topic-aware moments must retain only the topic tag.');
if (/localStorage\.setItem\([^\n]*message/i.test(moments)) fail('raw user messages must not be stored by the moments engine.');

for (const token of ['كثافة اللقطات', 'هادي', 'عادي', 'حيل 🔥', 'data-intensity="high"', 'BellaMoments?.setIntensity']) {
  if (!momentsUI.includes(token)) fail(`missing moments settings control: ${token}`);
}

if (!app.includes('bella-moments-ui.js')) fail('moments UI module must load after Bella UI.');
if (app.indexOf('bella-moments-ui.js') < app.indexOf('bella-ui.js')) fail('moments UI must load after Bella UI.');
if (!sw.includes('bella-moments-ui.js?v=17')) fail('moments UI must be available offline with the current runtime generation.');

console.log('Bella moments v3 smoke tests passed: adaptive high-frequency rumors, contextual tags, rare/legendary tiers, no-overlap coordination, privacy and intensity controls are valid.');
