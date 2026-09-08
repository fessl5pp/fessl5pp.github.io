const assert = require('assert');
const fs = require('fs');

(async () => {
  const b2 = await import('./lib/bella-kuwait-lexicon-b2.js');
  const b3 = await import('./lib/bella-kuwait-lexicon-b3.js');
  const v4 = await import('./lib/bella-kuwait-lexicon-v4.js');
  const v5 = await import('./lib/bella-kuwait-lexicon-v5.js');
  const persona = fs.readFileSync('lib/bella-persona.js', 'utf8');

  assert.strictEqual(b2.BELLA_KUWAIT_LEXICON_B2_COUNT, 250, 'owner batch 2 must stay exactly 250 source entries');
  assert.deepStrictEqual(b2.BELLA_KUWAIT_LEXICON_B2.map(r => r.id), Array.from({ length: 250 }, (_, i) => i + 1), 'batch-2 source IDs must stay continuous 1..250');
  assert.strictEqual(v4.BELLA_KUWAIT_LEXICON_SOURCE_COUNT, 460, 'legacy v4 source count must stay 210 + 250 = 460');

  assert.strictEqual(b3.BELLA_KUWAIT_LEXICON_B3_COUNT, 530, 'owner batch 3 must preserve all 530 PDF entries');
  assert.deepStrictEqual(b3.BELLA_KUWAIT_LEXICON_B3.map(r => r.id), Array.from({ length: 530 }, (_, i) => i + 1), 'batch-3 source IDs must stay continuous 1..530');
  const expectedCategoryCounts = {
    people_traits: 75,
    actions: 80,
    street_diwaniya_places: 75,
    heritage_tools_home: 75,
    food_drinks_hospitality: 75,
    popular_street_expressions: 70,
    proverbs: 40,
    weather_marine_environment: 40
  };
  for (const [category, expected] of Object.entries(expectedCategoryCounts)) {
    assert.strictEqual(b3.BELLA_KUWAIT_LEXICON_B3.filter(r => r.category === category).length, expected, `batch-3 category ${category} must stay ${expected}`);
  }

  const representativeB2 = ['جمبازي','لوتي','بلتيقة','بخص','يقند الراس','يتشره','چَب (جب)','دريشة','استكانة','سفايفه مقطوعة','قري','يويرن (U-turn)','دشداشة','بلايس','بلگ (بلك)','جاخور','المباركية','فيلكا','حداق','لفاح','طراد','قرقور','يمّة'];
  for (const term of representativeB2) assert.ok(b2.BELLA_KUWAIT_LEXICON_B2.some(r => r.term === term), `missing batch-2 term: ${term}`);

  const representativeB3 = ['جمبازي','مجبوس','دق صدره وقال عندي','إن طاعك الزمان وإلا طيعه','السرايات','ربلة','سرداب'];
  for (const term of representativeB3) assert.ok(b3.BELLA_KUWAIT_LEXICON_B3.some(r => r.term === term), `missing batch-3 term: ${term}`);
  assert.strictEqual(b3.bellaKuwaitLexiconB3Row(1)?.term, 'جمبازي', 'batch-3 first source row must stay fixed');
  assert.strictEqual(b3.bellaKuwaitLexiconB3Row(530)?.term, 'ربلة', 'batch-3 last source row must stay fixed');

  assert.strictEqual(b2.BELLA_KUWAIT_LEXICON_B2.filter(r => r.term === 'يقحص').length, 3, 'all three source usages of يقحص must be preserved');
  assert.ok(b2.BELLA_KUWAIT_LEXICON_B2.some(r => r.term === 'الصبية') && b2.BELLA_KUWAIT_LEXICON_B2.some(r => r.term === 'صبية'), 'both source spellings/usages of Subiya must be preserved');
  assert.ok(b2.bellaFindKuwaitLexiconB2('شنو يعني جمبازي؟').some(r => r.term === 'جمبازي'), 'batch-2 exact term lookup must work');
  assert.ok(b3.bellaFindKuwaitLexiconB3('شنو يعني السرايات؟').some(r => r.term === 'السرايات'), 'batch-3 exact term lookup must work');

  assert.strictEqual(v5.BELLA_KUWAIT_LEXICON_SOURCE_COUNT, 990, 'v5 combined source count must stay 210 + 250 + 530 = 990');
  assert.strictEqual(v5.BELLA_KUWAIT_LEXICON_ALL.length, 990, 'v5 source table must preserve every source row including duplicates');
  assert.ok(v5.BELLA_KUWAIT_LEXICON_UNIQUE_COUNT <= 990 && v5.BELLA_KUWAIT_LEXICON_UNIQUE_COUNT >= 530, 'v5 deduped retrieval table must remain bounded and complete');
  assert.ok(v5.bellaFindKuwaitLexicon('شنو يعني السرايات؟').some(r => r.term === 'السرايات' && r.source === 'owner_b3'), 'v5 must recognize new exact terms and prefer owner batch 3');
  assert.ok(v5.bellaFindKuwaitLexicon('شنو يسمون القبو تحت الأرض؟').some(r => r.term === 'سرداب'), 'v5 reverse meaning lookup must find source terms');

  const safety = v5.bellaKuwaitLexiconInstruction('قال لي جيكر وبوكس ويتحرش');
  assert.ok(safety.includes('لا ترمينها على المستخدم') && safety.includes('لا تتحول لتشجيع أذى') && safety.includes('تحرشاً أو سلامة'), 'v5 insult/violence/harassment safety context must remain explicit');
  assert.ok(v5.bellaKuwaitLexiconInstruction('شنو يعني تكتكة؟').includes('990 صف مصدر'), 'v5 combined instruction must expose 990 source entries');
  assert.ok(persona.includes('./bella-kuwait-lexicon-v4.js') || persona.includes('./bella-kuwait-lexicon-v5.js'), 'persona must be wired to lexicon v4 or v5 during staged migration');

  console.log(`Bella Kuwait lexicon v5 smoke test passed: B2=250, B3=530, source=990, unique=${v5.BELLA_KUWAIT_LEXICON_UNIQUE_COUNT}, contextual/reverse lookup and safe usage rules are wired.`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
