const fs = require('fs');
const path = require('path');

const personaPath = path.join(process.cwd(), 'lib', 'bella-persona.js');
let source = fs.readFileSync(personaPath, 'utf8');
const oldImport = 'import { bellaKuwaitLexiconInstruction } from "./bella-kuwait-lexicon.js";';
const newImport = 'import { bellaKuwaitLexiconInstruction } from "./bella-kuwait-lexicon-v4.js";';

if (source.includes(oldImport)) {
  source = source.replace(oldImport, newImport);
  fs.writeFileSync(personaPath, source);
  console.log('Bella Kuwait lexicon v4 wired into persona (210 + 250 source entries).');
} else if (source.includes(newImport)) {
  console.log('Bella Kuwait lexicon v4 already wired.');
} else {
  throw new Error('Could not locate Bella lexicon import in lib/bella-persona.js');
}
