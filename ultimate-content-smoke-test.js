const fs = require('fs');

const source = fs.readFileSync('bella-ultimate-content.js', 'utf8');
try { new Function(source); } catch (error) {
  console.error('Bella ultimate content syntax failed:', error);
  process.exit(1);
}

const checks = [
  ['source PDF marker', 'Bella_Kuwaiti_Ultimate_Dictionary.pdf'],
  ['200 rumors source count', 'rumors: 200'],
  ['100 wisdoms source count', 'wisdoms: 100'],
  ['100 proverbs source count', 'proverbs: 100'],
  ['rumor list action', 'openBellaRumorList'],
  ['wisdom game override', 'window.dailyWisdom = () => openWisdomGame(false)'],
  ['proverb game override', 'window.startProverbGame = openProverbGame'],
  ['activities decorator', 'data-bella-rumor-list'],
  ['proverb source sample', 'مد ريولك...'],
  ['wisdom source sample', 'إن طاعك الزمان وإلا طيعه']
];

for (const [label, token] of checks) {
  if (!source.includes(token)) {
    console.error(`Bella ultimate content check failed: ${label}`);
    process.exit(1);
  }
}

const rumorSeedCount = (source.match(/mood:\s*"/g) || []).length;
const wisdomSeedCount = (source.match(/meaning:\s*"/g) || []).length;
const proverbSeedCount = (source.match(/start:\s*"/g) || []).length;
if (rumorSeedCount !== 20 || wisdomSeedCount !== 20 || proverbSeedCount !== 25) {
  console.error(`Unexpected unique seed counts: rumors=${rumorSeedCount}, wisdoms=${wisdomSeedCount}, proverbs=${proverbSeedCount}`);
  process.exit(1);
}

console.log('Bella ultimate content validated: PDF banks + rumor list + wisdom game + proverb game.');
