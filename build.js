const fs = require('fs');

const sources = [
  ['script.js', 'Bella core'],
  ['ai-fix.js', 'Bella AI routing'],
  ['bella-vnext.js', 'Bella personality and experience'],
  ['bella-install.js', 'Bella install experience']
];

const bundle = sources.map(([file, label]) => {
  const source = fs.readFileSync(file, 'utf8');
  return `\n;/* ---- ${label}: ${file} ---- */\n${source}\n`;
}).join('\n');

// Catch syntax/declaration collisions during the Vercel build instead of
// shipping a broken browser bundle to users.
try {
  new Function(bundle);
} catch (error) {
  console.error('Bella bundle syntax validation failed:', error);
  process.exit(1);
}

fs.writeFileSync('app.js', bundle, 'utf8');
console.log(`Bella bundle generated: app.js (${sources.length} source files, ${bundle.length} chars)`);
