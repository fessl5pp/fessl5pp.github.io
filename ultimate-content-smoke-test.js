const fs = require('fs');

const dataSource = fs.readFileSync('bella-kuwaiti-games-data.js', 'utf8');
const uiSource = fs.readFileSync('bella-ultimate-content.js', 'utf8');

for (const [file, source] of [['bella-kuwaiti-games-data.js', dataSource], ['bella-ultimate-content.js', uiSource]]) {
  try { new Function(source); } catch (error) {
    console.error(`Bella ultimate content syntax failed in ${file}:`, error);
    process.exit(1);
  }
}

const dataChecks = [
  ['PDF source marker', 'Bella_Kuwaiti_Ultimate_Dictionary.pdf'],
  ['reported counts', 'reportedCounts: { rumors: 200, wisdoms: 100, proverbs: 100 }'],
  ['unique source-bank counts', 'uniqueCounts: { rumors: 20, wisdoms: 20, proverbs: 25 }'],
  ['rumor list', 'قائمة الإشاعات'],
  ['rumor list action', 'window.openBellaRumors = rumorModal'],
  ['wisdom data', 'مد ريولك على قد لحافك'],
  ['proverb data', 'مد ريولك...']
];

const uiChecks = [
  ['wisdom game title', 'لعبة حكمة اليوم'],
  ['daily wisdom UI override', 'window.dailyWisdom = () => openWisdomGame(false)'],
  ['proverb UI override', 'window.startProverbGame = openProverbGame'],
  ['box UI override', 'window.startBoxGame = openBoxGame'],
  ['Kuwaiti challenge UI override', 'window.startKuwaitiChallenge = openKuwaitiChallenge'],
  ['four choices', 'optionsPerQuestion: 4'],
  ['non chat games', 'chatBasedGames: false'],
  ['instant wrong feedback', 'غلط ❌ جرّب خيار ثاني.'],
  ['instant correct feedback', 'صح ✅ كفو!'],
  ['rumor count copy', '200 إشاعة كويتية من الملف'],
  ['BellaUltimateContent export', 'window.BellaUltimateContent = Object.freeze']
];

for (const [label, token] of dataChecks) {
  if (!dataSource.includes(token)) {
    console.error(`Bella ultimate data check failed: ${label}`);
    process.exit(1);
  }
}
for (const [label, token] of uiChecks) {
  if (!uiSource.includes(token)) {
    console.error(`Bella ultimate UI check failed: ${label}`);
    process.exit(1);
  }
}

console.log('Bella ultimate content validated: four-choice non-chat games for wisdom, proverb, box and Kuwaiti challenge; rumor list remains separate.');
