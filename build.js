const fs = require('fs');

const sources = [
  ['script.js', 'Legacy UI and local features'],
  ['bella-context.js', 'Long conversation context memory'],
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

// Critical active handlers must have one owner. Match actual assignments only,
// not comparisons such as `window.updateMood === "function"`.
const ownershipRules = [
  { pattern: /window\.send\s*=(?!=)/, owner: 'bella-vnext.js', label: 'send flow' },
  { pattern: /window\.getAIReply\s*=(?!=)/, owner: 'bella-vnext.js', label: 'AI reply flow' },
  { pattern: /window\.updateMood\s*=(?!=)/, owner: 'bella-vnext.js', label: 'mood UI' },
  { pattern: /window\.fetch\s*=(?!=)/, owner: 'bella-runtime.js', label: 'network guard' },
  { pattern: /window\.openBellaSettings\s*=(?!=)/, owner: 'bella-ui.js', label: 'settings UI' },
  { pattern: /window\.BellaContext\s*=(?!=)/, owner: 'bella-context.js', label: 'long context memory' }
];

for (const rule of ownershipRules) {
  const owners = loaded.filter(item => rule.pattern.test(item.source)).map(item => item.file);
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
console.log('Bella ownership validated: context/routing/runtime/conversation/UI are separated.');
