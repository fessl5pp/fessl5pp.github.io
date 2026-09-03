const CACHE_NAME = "bella-pwa-v12-release-10";
const CORE = [
  "/",
  "/index.html",
  "/style.css?v=11",
  "/bella-vnext.css?v=11",
  "/app.js?v=11",
  "/bella-account.js?v=17",
  "/bella-analytics.js?v=17",
  "/script.js?v=17",
  "/bella-legacy-plus.js?v=17",
  "/bella-config.js?v=17",
  "/bella-context.js?v=17",
  "/bella-routing.js?v=17",
  "/bella-style.js?v=17",
  "/bella-auth-bridge.js?v=17",
  "/bella-runtime.js?v=17",
  "/bella-voice.js?v=17",
  "/bella-vnext.js?v=17",
  "/bella-avatar.js?v=17",
  "/bella-live-web.js?v=17",
  "/bella-account-memory.js?v=17",
  "/bella-account-center.js?v=17",
  "/bella-owner-center.js?v=17",
  "/bella-owner-users.js?v=17",
  "/bella-moderator-center.js?v=17",
  "/bella-owner-analytics.js?v=17",
  "/bella-owner-controls.js?v=17",
  "/bella-speed.js?v=17",
  "/bella-ui.js?v=17",
  "/bella-install.js?v=17",
  "/manifest.json",
  "/favicon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE))
      .catch(() => null)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request, request.mode === "navigate" ? { cache: "no-store" } : undefined);
      if (response?.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
      }
      return response;
    } catch {
      const cached = await caches.match(request);
      if (cached) return cached;

      if (request.mode === "navigate") {
        return (await caches.match("/index.html")) || (await caches.match("/")) || Response.error();
      }

      return Response.error();
    }
  })());
});