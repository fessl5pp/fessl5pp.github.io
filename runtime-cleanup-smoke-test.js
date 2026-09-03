const fs = require('fs');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const icon = fs.readFileSync('api/icon-v3.js', 'utf8');
const apiPackage = JSON.parse(fs.readFileSync('api/package.json', 'utf8'));
const libPackage = JSON.parse(fs.readFileSync('lib/package.json', 'utf8'));
const workflow = fs.readFileSync('.github/workflows/browser-e2e.yml', 'utf8');

const iconRewrite = (vercel.rewrites || []).find(rule => rule.source === '/api/icon');
must(iconRewrite && iconRewrite.destination === '/api/icon-v3', 'Legacy /api/icon must rewrite to /api/icon-v3');
must(icon.includes('new URL(req.url'), 'icon-v3 must parse the request URL with WHATWG URL');
must(icon.includes('searchParams.get("size")'), 'icon-v3 must read size with URLSearchParams');
must(!icon.includes('req.query'), 'icon-v3 must not use legacy req.query parsing');
must(icon.includes('export default function handler'), 'icon-v3 must use the native ESM function format');
must(icon.includes('Cache-Control'), 'icon-v3 must keep long-lived cache headers');
must(!fs.existsSync('api/icon.js'), 'legacy icon.js must stay removed');
must(!fs.existsSync('api/icon-v2.js'), 'transitional icon-v2.js must stay removed');
must(apiPackage.type === 'module', 'api package scope must be native ESM');
must(libPackage.type === 'module', 'lib package scope must be native ESM');

must(workflow.includes('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1'), 'checkout action must be SHA-pinned');
must(workflow.includes('actions/setup-node@820762786026740c76f36085b0efc47a31fe5020'), 'setup-node action must be SHA-pinned');
must(workflow.includes('actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a'), 'upload-artifact action must be SHA-pinned');
must(!workflow.includes('actions/checkout@v4'), 'legacy checkout@v4 must be removed');
must(!workflow.includes('actions/setup-node@v4'), 'legacy setup-node@v4 must be removed');
must(!workflow.includes('actions/upload-artifact@v4'), 'legacy upload-artifact@v4 must be removed');

console.log('Bella runtime cleanup smoke tests passed: native ESM APIs, clean icon routing and modern SHA-pinned CI actions are valid.');
