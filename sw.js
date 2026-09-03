const CACHE_NAME = "bella-pwa-v11-stable-6";
const CORE = [
  "/",
  "/index.html",
  "/style.css?v=11",
  "/bella-vnext.css?v=11",
  "/app.js?v=11",
  "/bella-account.js?v=16",
  "/bella-analytics.js?v=16",
  "/script.js?v=16",
  "/bella-legacy-plus.js?v=16",
  "/bella-context.js?v=16",
  "/bella-routing.js?v=16",
  "/bella-style.js?v=16",
  "/bella-runtime.js?v=16",
  "/bella-vnext.js?v=16",
  "/bella-live-web.js?v=16",
  "/bella-account-memory.js?v=16",
  "/bella-account-center.js?v=16",
  "/bella-owner-center.js?v=16",
  "/bella-owner-analytics.js?v=16",
  "/bella-speed.js?v=16",
  "/bella-ui.js?v=16",
  "/bella-install.js?v=16",
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
      const response = await fetch(request);
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
