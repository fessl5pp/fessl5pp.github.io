const fs = require('fs');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const icon = fs.readFileSync('api/icon-v2.js', 'utf8');
const workflow = fs.readFileSync('.github/workflows/browser-e2e.yml', 'utf8');

const iconRewrite = (vercel.rewrites || []).find(rule => rule.source === '/api/icon');
must(iconRewrite && iconRewrite.destination === '/api/icon-v2', 'Legacy /api/icon must rewrite to /api/icon-v2');
must(icon.includes('new URL(req.url'), 'icon-v2 must parse the request URL with WHATWG URL');
must(icon.includes('searchParams.get("size")'), 'icon-v2 must read size with URLSearchParams');
must(!icon.includes('req.query'), 'icon-v2 must not use legacy req.query parsing');
must(icon.includes('Cache-Control'), 'icon-v2 must keep long-lived cache headers');

must(workflow.includes('actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1'), 'checkout action must be SHA-pinned');
must(workflow.includes('actions/setup-node@820762786026740c76f36085b0efc47a31fe5020'), 'setup-node action must be SHA-pinned');
must(workflow.includes('actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a'), 'upload-artifact action must be SHA-pinned');
must(!workflow.includes('actions/checkout@v4'), 'legacy checkout@v4 must be removed');
must(!workflow.includes('actions/setup-node@v4'), 'legacy setup-node@v4 must be removed');
must(!workflow.includes('actions/upload-artifact@v4'), 'legacy upload-artifact@v4 must be removed');

console.log('Bella runtime cleanup smoke tests passed: icon routing uses WHATWG URL and CI actions are modern SHA-pinned releases.');
