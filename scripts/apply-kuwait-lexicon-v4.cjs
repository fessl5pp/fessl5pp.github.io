const fs = require('fs');
const path = require('path');

// Compatibility entrypoint retained because package.json already calls this filename.
// It now upgrades Bella's persona to the unified v5 lexicon (210 + 250 + 530 source rows).
const personaPath = path.join(process.cwd(), 'lib', 'bella-persona.js');
let source = fs.readFileSync(personaPath, 'utf8');

const baseImport = 'import { bellaKuwaitLexiconInstruction } from "./bella-kuwait-lexicon.js";';
const v4Import = 'import { bellaKuwaitLexiconInstruction } from "./bella-kuwait-lexicon-v4.js";';
const v5Import = 'import { bellaKuwaitLexiconInstruction } from "./bella-kuwait-lexicon-v5.js";';

if (source.includes(v5Import)) {
  console.log('Bella Kuwait lexicon v5 already wired.');
} else {
  const current = source.includes(v4Import) ? v4Import : source.includes(baseImport) ? baseImport : null;
  if (!current) throw new Error('Could not locate Bella lexicon import in lib/bella-persona.js');
  source = source.replace(current, v5Import);
  fs.writeFileSync(personaPath, source);
  console.log('Bella Kuwait lexicon v5 wired into persona (210 + 250 + 530 = 990 source entries; exact duplicates deduped only at retrieval time).');
}
