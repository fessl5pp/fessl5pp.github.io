const fs = require('fs');
const path = require('path');

function fail(message) {
  console.error(`Bella static release failed: ${message}`);
  process.exit(1);
}
function read(file) {
  if (!fs.existsSync(file)) fail(`missing ${file}`);
  return fs.readFileSync(file, 'utf8');
}
function appModuleList(app, constName) {
  const match = app.match(new RegExp(`const\\s+${constName}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!match) fail(`app.js is missing ${constName}`);
  return [...match[1].matchAll(/["']([^"']+\.js)["']/g)].map(item => item[1]);
}

const outDir = path.join(process.cwd(), 'public');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const app = read('app.js');
const moduleFiles = [...new Set([
  ...appModuleList(app, 'coreModules'),
  ...appModuleList(app, 'deferredModules')
])];
const exactFiles = new Set([
  'index.html',
  'style.css',
  'bella-vnext.css',
  'app.js',
  'sw.js',
  'manifest.json',
  'favicon.svg',
  ...moduleFiles
]);

// Copy image assets only when current shipped source actually references them.
const referenceSource = [
  read('index.html'), read('style.css'), read('bella-vnext.css'), read('manifest.json'),
  ...moduleFiles.map(read)
].join('\n');
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
for (const entry of fs.readdirSync(process.cwd(), { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const file = entry.name;
  const ext = path.extname(file).toLowerCase();
  if (imageExtensions.has(ext) && !file.endsWith('-report.svg') && referenceSource.includes(file)) exactFiles.add(file);
}

for (const file of exactFiles) {
  const from = path.join(process.cwd(), file);
  if (!fs.existsSync(from)) fail(`runtime references missing static asset ${file}`);
  fs.copyFileSync(from, path.join(outDir, file));
}

const required = [
  'index.html', 'style.css', 'bella-vnext.css', 'app.js', 'sw.js',
  'manifest.json', 'favicon.svg', 'bella-vnext.js', 'bella-runtime.js', 'bella-voice.js',
  'bella-context-v24.js', 'bella-memory-v4.js', 'bella-feature-controls-v3.js', 'bella-resilience-v22.js'
];
for (const file of required) {
  if (!fs.existsSync(path.join(outDir, file))) fail(`missing static release asset ${file}`);
}

const unexpectedJs = fs.readdirSync(outDir).filter(file => /^bella-.*\.js$/i.test(file) && !moduleFiles.includes(file));
if (unexpectedJs.length) fail(`unreferenced Bella JS shipped: ${unexpectedJs.join(', ')}`);

console.log(`Bella static output prepared (${fs.readdirSync(outDir).length} files; ${moduleFiles.length} referenced browser modules only).`);
