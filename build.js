const fs = require('fs');

const sources = [
  ['bella-account.js', 'Accounts and cloud profile sync'],
  ['bella-analytics.js', 'Privacy-safe signed-in usage analytics'],
  ['script.js', 'Legacy UI and local features'],
  ['bella-legacy-plus.js', 'Cleaned and enhanced legacy features'],
  ['bella-config.js', 'Public remote feature configuration'],
  ['bella-context.js', 'Long conversation context memory'],
  ['bella-routing.js', 'AI-first conversation routing'],
  ['bella-moments.js', 'Local and remote adaptive Bella moments'],
  ['bella-moments-cloud.js', 'Approved remote moments sync'],
  ['bella-style.js', 'Adaptive user communication style'],
  ['bella-auth-bridge.js', 'Signed-in API authorization bridge'],
  ['bella-runtime.js', 'Network reliability and streaming runtime'],
  ['bella-voice.js', 'Server-backed Bella voice with local fallback'],
  ['bella-vnext.js', 'Conversation mood memory and send flow'],
  ['bella-avatar.js', 'Mood-reactive Bella visual identity'],
  ['bella-live-web.js', 'Selective live web citation rendering'],
  ['bella-account-memory.js', 'Cloud memory deletion synchronization'],
  ['bella-account-center.js', 'Signed-in account dashboard'],
  ['bella-owner-center.js', 'Owner-only account dashboard'],
  ['bella-owner-users.js', 'Owner-only user management and audit log'],
  ['bella-moderator-center.js', 'Limited moderator account review center'],
  ['bella-owner-analytics.js', 'Owner-only activity analytics dashboard'],
  ['bella-owner-controls.js', 'Owner-only remote system controls'],
  ['bella-owner-moments.js', 'Owner-only Moments Studio and AI Fresh controls'],
  ['bella-speed.js', 'Live reply rendering and perceived latency'],
  ['bella-ui.js', 'Settings and chat controls'],
  ['bella-moments-ui.js', 'Per-user moments intensity controls'],
  ['bella-install.js', 'PWA install experience']
];

const loaded = sources.map(([file, label]) => {
  const source = fs.readFileSync(file, 'utf8');
  try { new Function(source); } catch (error) { console.error(`Bella source syntax validation failed in ${file}:`, error); process.exit(1); }
  return { file, label, source };
});

const ownershipRules = [
  { pattern: /window\.BellaAccount\s*=(?!=)/, owner: 'bella-account.js', label: 'account and cloud profile' },
  { pattern: /window\.BellaAnalytics\s*=(?!=)/, owner: 'bella-analytics.js', label: 'privacy-safe usage analytics' },
  { pattern: /window\.BellaConfig\s*=(?!=)/, owner: 'bella-config.js', label: 'remote public configuration' },
  { pattern: /window\.BellaAuthBridge\s*=(?!=)/, owner: 'bella-auth-bridge.js', label: 'signed-in API authorization bridge' },
  { pattern: /window\.BellaVoice\s*=(?!=)/, owner: 'bella-voice.js', label: 'server-backed voice UI' },
  { pattern: /window\.BellaAccountMemory\s*=(?!=)/, owner: 'bella-account-memory.js', label: 'cloud memory deletion sync' },
  { pattern: /window\.BellaAccountCenter\s*=(?!=)/, owner: 'bella-account-center.js', label: 'account center UI' },
  { pattern: /window\.BellaOwnerCenter\s*=(?!=)/, owner: 'bella-owner-center.js', label: 'owner center UI' },
  { pattern: /window\.BellaOwnerUsers\s*=(?!=)/, owner: 'bella-owner-users.js', label: 'owner user management UI' },
  { pattern: /window\.BellaModeratorCenter\s*=(?!=)/, owner: 'bella-moderator-center.js', label: 'moderator center UI' },
  { pattern: /window\.BellaOwnerAnalytics\s*=(?!=)/, owner: 'bella-owner-analytics.js', label: 'owner activity analytics UI' },
  { pattern: /window\.BellaOwnerControls\s*=(?!=)/, owner: 'bella-owner-controls.js', label: 'owner remote controls UI' },
  { pattern: /window\.BellaMomentsStudio\s*=(?!=)/, owner: 'bella-owner-moments.js', label: 'owner Moments Studio UI' },
  { pattern: /window\.BellaMomentsCloud\s*=(?!=)/, owner: 'bella-moments-cloud.js', label: 'remote moments sync' },
  { pattern: /window\.BellaAvatar\s*=(?!=)/, owner: 'bella-avatar.js', label: 'visual identity UI' },
  { pattern: /window\.BellaLiveWeb\s*=(?!=)/, owner: 'bella-live-web.js', label: 'live web citation UI' },
  { pattern: /window\.BellaMoments\s*=(?!=)/, owner: 'bella-moments.js', label: 'ambient rumors and top-right moments' },
  { pattern: /window\.send\s*=(?!=)/, owner: 'bella-vnext.js', label: 'send flow' },
  { pattern: /window\.getAIReply\s*=(?!=)/, owner: 'bella-vnext.js', label: 'AI reply flow' },
  { pattern: /window\.updateMood\s*=(?!=)/, owner: 'bella-vnext.js', label: 'mood UI' },
  { pattern: /window\.openBellaSettings\s*=(?!=)/, owner: 'bella-ui.js', label: 'settings UI' },
  { pattern: /window\.BellaContext\s*=(?!=)/, owner: 'bella-context.js', label: 'long context memory' },
  { pattern: /window\.BellaPersonality\s*=(?!=)/, owner: 'bella-style.js', label: 'adaptive user style' },
  { pattern: /window\.BellaSpeed\s*=(?!=)/, owner: 'bella-speed.js', label: 'streaming UI bridge' },
  { pattern: /window\.BellaLegacyPlus\s*=(?!=)/, owner: 'bella-legacy-plus.js', label: 'legacy feature enhancements' }
];

for (const rule of ownershipRules) {
  const owners = loaded.filter(item => rule.pattern.test(item.source)).map(item => item.file);
  if (owners.length !== 1 || owners[0] !== rule.owner) {
    console.error(`Bella ownership validation failed for ${rule.label}. Expected ${rule.owner}; found: ${owners.join(', ') || 'none'}`);
    process.exit(1);
  }
}

const runtime = loaded.find(item => item.file === 'bella-runtime.js')?.source || '';
const bridge = loaded.find(item => item.file === 'bella-auth-bridge.js')?.source || '';
if (!/window\.fetch\s*=(?!=)/.test(runtime)) { console.error('Bella runtime must remain the final network guard.'); process.exit(1); }
if (!/window\.fetch\s*=(?!=)/.test(bridge) || !bridge.includes('/api/chat') || !bridge.includes('/api/dira') || !bridge.includes('/api/voice')) { console.error('Bella auth bridge must attach signed-in auth only to Bella API routes before runtime loads.'); process.exit(1); }

const bundle = loaded.map(({ file, label, source }) => `\n;/* ---- ${label}: ${file} ---- */\n${source}\n`).join('\n');
try { new Function(bundle); } catch (error) { console.error('Bella combined source validation failed:', error); process.exit(1); }

console.log(`Bella combined source validated (${sources.length} modules, ${bundle.length} chars)`);
console.log('Bella ownership validated: account/analytics/config/auth/voice/owner-users/moderator-center/account-center/owner-center/owner-controls/owner-moments/owner-analytics/avatar/memory-sync/live-web/moments-cloud/moments/legacy/context/routing/style/runtime/mood/send/speed/UI are separated.');
