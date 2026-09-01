const fs = require('fs');

const sources = [
  ['script.js', 'Legacy UI and local features'],
  ['bella-routing.js', 'Local reply routing'],
  ['bella-runtime.js', 'Network and reliability runtime'],
  ['bella-vnext.js', 'Conversation mood memory and send flow'],
  ['bella-ui.js', 'Settings and chat controls'],
  ['bella-install.js', 'PWA install experience']
];

const loaded = sources.map(([file, label]) => {
  const source = fs.readFileSync(file, 'utf8');
  try {
    new Function(source);
  } catch (error) {
    console.error(`Bella source syntax validation failed in ${file}:`, error);
    process.exit(1);
  }
  return { file, label, source };
});

// Keep critical responsibilities owned by one modern module. The old
// script.js still contains legacy function declarations, but only vNext is
// allowed to publish the active browser handlers for these flows.
const ownershipRules = [
  { marker: 'window.send =', owner: 'bella-vnext.js', label: 'send flow' },
  { marker: 'window.getAIReply =', owner: 'bella-vnext.js', label: 'AI reply flow' },
  { marker: 'window.updateMood =', owner: 'bella-vnext.js', label: 'mood UI' },
  { marker: 'window.fetch =', owner: 'bella-runtime.js', label: 'network guard' },
  { marker: 'window.openBellaSettings =', owner: 'bella-ui.js', label: 'settings UI' }
];

for (const rule of ownershipRules) {
  const owners = loaded.filter(item => item.source.includes(rule.marker)).map(item => item.file);
  if (owners.length !== 1 || owners[0] !== rule.owner) {
    console.error(`Bella ownership validation failed for ${rule.label}. Expected ${rule.owner}; found: ${owners.join(', ') || 'none'}`);
    process.exit(1);
  }
}

const bundle = loaded.map(({ file, label, source }) =>
  `\n;/* ---- ${label}: ${file} ---- */\n${source}\n`
).join('\n');

try {
  new Function(bundle);
} catch (error) {
  console.error('Bella bundle syntax/declaration validation failed:', error);
  process.exit(1);
}

fs.writeFileSync('app.js', bundle, 'utf8');
console.log(`Bella bundle generated: app.js (${sources.length} modules, ${bundle.length} chars)`);
console.log('Bella ownership validated: routing/runtime/conversation/UI are separated.');
