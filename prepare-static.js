const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'public');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const exactFiles = new Set([
  'index.html',
  'style.css',
  'bella-vnext.css',
  'app.js',
  'sw.js',
  'manifest.json',
  'favicon.svg'
]);

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

for (const entry of fs.readdirSync(process.cwd(), { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const file = entry.name;
  const ext = path.extname(file).toLowerCase();
  const isBellaModule = /^bella-[a-z0-9-]+\.js$/i.test(file);
  const isLegacyRuntime = file === 'script.js';
  const isStaticImage = imageExtensions.has(ext) && !file.endsWith('-report.svg');
  if (!exactFiles.has(file) && !isBellaModule && !isLegacyRuntime && !isStaticImage) continue;
  fs.copyFileSync(path.join(process.cwd(), file), path.join(outDir, file));
}

const required = [
  'index.html', 'style.css', 'bella-vnext.css', 'app.js', 'script.js', 'sw.js',
  'manifest.json', 'favicon.svg', 'bella-vnext.js', 'bella-runtime.js', 'bella-voice.js'
];
for (const file of required) {
  if (!fs.existsSync(path.join(outDir, file))) {
    console.error(`Missing static release asset: ${file}`);
    process.exit(1);
  }
}

console.log(`Bella static output prepared (${fs.readdirSync(outDir).length} files).`);
