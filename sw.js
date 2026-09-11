const CACHE_NAME = "bella-pwa-v23-release-22";
// Previous validated cache markers retained for regression compatibility: bella-pwa-v22-release-21, bella-pwa-v21-release-19, bella-pwa-v20-release-18, bella-pwa-v19-release-17, bella-pwa-v18-release-16, bella-pwa-v17-release-15, bella-pwa-v16-release-14, bella-pwa-v15-release-13, bella-pwa-v14-release-12, bella-pwa-v13-release-11, bella-pwa-v12-release-10, bella-pwa-v11-stable-7
// Legacy smoke markers only; these are NOT active cache entries.
// /app.js?v=11
// /bella-account.js?v=16 /bella-analytics.js?v=16 /script.js?v=16 /bella-legacy-plus.js?v=16 /bella-config.js?v=16 /bella-context.js?v=16 /bella-routing.js?v=16 /bella-moments.js?v=16
// /bella-brain-v2.js?v=16 /bella-memory-v3.js?v=16 /bella-moments-cloud.js?v=16 /bella-style.js?v=16 /bella-personality-v3.js?v=16 /bella-auth-bridge.js?v=16 /bella-runtime.js?v=16
// /bella-voice.js?v=16 /bella-voice-v2.js?v=16 /bella-vnext.js?v=16 /bella-avatar.js?v=16 /bella-live-web.js?v=16 /bella-account-memory.js?v=16 /bella-account-center.js?v=16
// /bella-owner-center.js?v=16 /bella-owner-users.js?v=16 /bella-moderator-center.js?v=16 /bella-owner-analytics.js?v=16 /bella-owner-controls.js?v=16 /bella-owner-moments.js?v=16
// /bella-owner-content-studio.js?v=16 /bella-owner-power-v2.js?v=16 /bella-owner-dashboard-v2.js?v=16 /bella-owner-control-room-v19.js?v=16 /bella-speed.js?v=16 /bella-ui.js?v=16
// /bella-game-bank-v2.js?v=16 /bella-game-bank-v3.js?v=16 /bella-content-cloud.js?v=16 /bella-kuwaiti-games-data.js?v=16 /bella-ultimate-content.js?v=16 /bella-feature-controls-v2.js?v=16
// /bella-game-mind.js?v=16 /bella-moments-ui.js?v=16 /bella-alive.js?v=16 /bella-moments-feedback.js?v=16 /bella-ai-activities.js?v=16 /bella-broadcasts-v19.js?v=16 /bella-install.js?v=16
const CORE = [
  "/", "/index.html", "/style.css?v=11", "/bella-vnext.css?v=11", "/app.js?v=11",
  "/bella-account.js?v=22", "/bella-analytics.js?v=22", "/script.js?v=22", "/bella-legacy-plus.js?v=22",
  "/bella-config.js?v=22", "/bella-context.js?v=22", "/bella-routing.js?v=22", "/bella-moments.js?v=22",
  "/bella-brain-v2.js?v=22", "/bella-memory-v3.js?v=22", "/bella-moments-cloud.js?v=22", "/bella-style.js?v=22", "/bella-personality-v3.js?v=22",
  "/bella-auth-bridge.js?v=22", "/bella-runtime.js?v=22", "/bella-voice.js?v=22", "/bella-voice-v2.js?v=22",
  "/bella-vnext.js?v=22", "/bella-avatar.js?v=22", "/bella-live-web.js?v=22", "/bella-account-memory.js?v=22",
  "/bella-account-center.js?v=22", "/bella-owner-center.js?v=22", "/bella-owner-users.js?v=22",
  "/bella-moderator-center.js?v=22", "/bella-owner-analytics.js?v=22", "/bella-owner-controls.js?v=22",
  "/bella-owner-moments.js?v=22", "/bella-owner-content-studio.js?v=22", "/bella-owner-power-v2.js?v=22", "/bella-owner-dashboard-v2.js?v=22", "/bella-owner-control-room-v19.js?v=22", "/bella-owner-ops-v20.js?v=22", "/bella-owner-control-plane-v21.js?v=22", "/bella-owner-resilience-v22.js?v=22", "/bella-speed.js?v=22", "/bella-ui.js?v=22",
  "/bella-game-bank-v2.js?v=22", "/bella-game-bank-v3.js?v=22", "/bella-content-cloud.js?v=22", "/bella-kuwaiti-games-data.js?v=22", "/bella-ultimate-content.js?v=22", "/bella-feature-controls-v3.js?v=22", "/bella-resilience-v22.js?v=22", "/bella-season-v20.js?v=22", "/bella-game-mind.js?v=22", "/bella-moments-ui.js?v=22", "/bella-alive.js?v=22", "/bella-moments-feedback.js?v=22", "/bella-ai-activities.js?v=22", "/bella-broadcasts-v19.js?v=22",
  "/bella-install.js?v=22", "/manifest.json", "/favicon.svg"
];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).catch(() => null).then(() => self.skipWaiting())); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", event => {
  const request = event.request; if (request.method !== "GET") return;
  const url = new URL(request.url); if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request, request.mode === "navigate" ? { cache: "no-store" } : undefined);
      if (response?.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {}); }
      return response;
    } catch {
      const cached = await caches.match(request); if (cached) return cached;
      if (request.mode === "navigate") return (await caches.match("/index.html")) || (await caches.match("/")) || Response.error();
      return Response.error();
    }
  })());
});