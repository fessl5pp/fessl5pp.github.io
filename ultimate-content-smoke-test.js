const fs = require('fs');

const bankSource = fs.readFileSync('bella-game-bank-v2.js', 'utf8');
const bankV3Source = fs.readFileSync('bella-game-bank-v3.js', 'utf8');
const legacyDataSource = fs.readFileSync('bella-kuwaiti-games-data.js', 'utf8');
const uiSource = fs.readFileSync('bella-ultimate-content.js', 'utf8');
const personalitySource = fs.readFileSync('bella-personality-v3.js', 'utf8');
const migrationSource = fs.readFileSync('supabase/migrations/20260909113100_create_bella_game_center_v2.sql', 'utf8');

for (const [file, source] of [
  ['bella-game-bank-v2.js', bankSource],
  ['bella-game-bank-v3.js', bankV3Source],
  ['bella-kuwaiti-games-data.js', legacyDataSource],
  ['bella-ultimate-content.js', uiSource],
  ['bella-personality-v3.js', personalitySource]
]) {
  try { new Function(source); } catch (error) {
    console.error(`Bella Game Center syntax failed in ${file}:`, error);
    process.exit(1);
  }
}

const sandbox = {};
new Function('window', bankSource)(sandbox);
new Function('window', bankV3Source)(sandbox);
const bank = sandbox.BellaGameBankV2;
if (!bank) throw new Error('BellaGameBankV2 export missing');

const unique = (items, field) => new Set(items.map(item => String(item[field] || '').trim())).size;
if (bank.rumors.length !== 200 || unique(bank.rumors, 'text') !== 200) {
  throw new Error(`Expected 200 unique rumors; got ${bank.rumors.length}/${unique(bank.rumors, 'text')}`);
}
if (bank.wisdoms.length !== 100 || unique(bank.wisdoms, 'text') !== 100) {
  throw new Error(`Expected 100 unique wisdoms; got ${bank.wisdoms.length}/${unique(bank.wisdoms, 'text')}`);
}
if (bank.proverbs.length !== 100 || unique(bank.proverbs, 'start') !== 100) {
  throw new Error(`Expected 100 unique proverb prompts; got ${bank.proverbs.length}/${unique(bank.proverbs, 'start')}`);
}
if (bank.boxes.length < 20 || bank.kuwaitQuestions.length < 40) {
  throw new Error('Expanded box/Kuwaiti challenge banks are incomplete');
}

const uiChecks = [
  ['four-choice labels', 'const LETTERS = ["أ", "ب", "ج", "د"]'],
  ['10-question sessions', 'slice(0, Math.min(10, pool.length))'],
  ['instant correct feedback', 'صح عليك ✅'],
  ['instant wrong feedback', 'غلط ❌'],
  ['streak tracking', 'bestStreak'],
  ['achievements', 'ACHIEVEMENTS'],
  ['player profile', 'ملف اللاعب 👤'],
  ['leaderboard', 'bella_get_game_leaderboard'],
  ['daily wisdom', 'openDailyWisdom'],
  ['proverb difficulty', 'data-diff="easy"'],
  ['rumor categories', 'كل التصنيفات'],
  ['rumor favorites', 'مفضلاتي'],
  ['no-repeat rumors', 'recentRumors'],
  ['game effects settings', 'إعدادات الألعاب ⚙️'],
  ['non-chat cleanup', 'clearLegacyGame'],
  ['Game Center export', 'window.BellaUltimateContent=Object.freeze']
];
for (const [label, token] of uiChecks) {
  if (!uiSource.includes(token)) throw new Error(`Bella Game Center check failed: ${label}`);
}

for (const token of ['recentReplies', 'repetitionRisk', 'shortDirect', 'serious']) {
  if (!personalitySource.includes(token)) throw new Error(`Bella personality v3 missing ${token}`);
}
for (const token of ['bella_game_scores', 'bella_submit_game_score', 'bella_get_game_leaderboard', 'enable row level security', 'auth.uid()']) {
  if (!migrationSource.includes(token)) throw new Error(`Bella leaderboard migration missing ${token}`);
}

console.log('Bella Game Center v2 validated: 200 unique rumors + 100 unique wisdoms + 100 unique proverb prompts, 4-choice 10-question games, achievements, profile, leaderboard, effects and anti-repeat personality.');
