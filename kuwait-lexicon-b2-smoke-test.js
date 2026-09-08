const assert = require('assert');

(async () => {
  const b2 = await import('./lib/bella-kuwait-lexicon-b2.js');
  const v4 = await import('./lib/bella-kuwait-lexicon-v4.js');
  const persona = require('fs').readFileSync('lib/bella-persona.js', 'utf8');

  assert.strictEqual(b2.BELLA_KUWAIT_LEXICON_B2_COUNT, 250, 'owner batch 2 must stay exactly 250 source entries');
  assert.deepStrictEqual(b2.BELLA_KUWAIT_LEXICON_B2.map(r => r.id), Array.from({ length: 250 }, (_, i) => i + 1), 'batch-2 source IDs must stay continuous 1..250');
  assert.strictEqual(v4.BELLA_KUWAIT_LEXICON_SOURCE_COUNT, 460, 'combined owner source count must stay 210 + 250 = 460');
  assert.strictEqual(v4.BELLA_KUWAIT_LEXICON_ALL.length, 460, 'combined source table must preserve all entries including source duplicates');

  const representative = ['جمبازي','لوتي','بلتيقة','بخص','يقند الراس','يتشره','چَب (جب)','دريشة','استكانة','سفايفه مقطوعة','قري','يويرن (U-turn)','دشداشة','بلايس','بلگ (بلك)','جاخور','المباركية','فيلكا','حداق','لفاح','طراد','قرقور','يمّة'];
  for (const term of representative) assert.ok(b2.BELLA_KUWAIT_LEXICON_B2.some(r => r.term === term), `missing batch-2 term: ${term}`);

  assert.strictEqual(b2.BELLA_KUWAIT_LEXICON_B2.filter(r => r.term === 'يقحص').length, 3, 'all three source usages of يقحص must be preserved');
  assert.ok(b2.BELLA_KUWAIT_LEXICON_B2.some(r => r.term === 'الصبية') && b2.BELLA_KUWAIT_LEXICON_B2.some(r => r.term === 'صبية'), 'both source spellings/usages of Subiya must be preserved');
  assert.ok(b2.bellaFindKuwaitLexiconB2('شنو يعني جمبازي؟').some(r => r.term === 'جمبازي'), 'exact term lookup must work');
  assert.ok(b2.bellaFindKuwaitLexiconB2('دق قري شوي').some(r => r.term === 'قري'), 'street/car lookup must work');
  assert.ok(b2.bellaFindKuwaitLexiconB2('بروح حداق بالطراد').some(r => r.term === 'حداق'), 'sea/fishing lookup must work');

  const safety = b2.bellaKuwaitLexiconB2Instruction('قال لي جيكر وبوكس ويتحرش');
  assert.ok(safety.includes('لا ترمينها على المستخدم') && safety.includes('لا تحولينها لتشجيع أذى') && safety.includes('السياق سلامة/تحرش جنسي'), 'insult/violence/harassment safety context must remain explicit');
  assert.ok(v4.bellaKuwaitLexiconInstruction('شنو يعني تكتكة؟').includes('460 مدخل مصدر'), 'combined instruction must expose 460 source entries');
  assert.ok(persona.includes('./bella-kuwait-lexicon-v4.js'), 'persona must be wired to lexicon v4 before tests/build');

  console.log('Bella Kuwait lexicon batch-2 smoke test passed: 250/250 source entries, 460 combined, contextual lookup and safe usage rules are wired.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
