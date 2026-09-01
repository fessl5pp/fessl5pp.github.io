const CACHE_NAME = "bella-pwa-v11-stable-3";
const CORE = [
  "/",
  "/index.html",
  "/style.css?v=11",
  "/bella-vnext.css?v=11",
  "/app.js?v=11",
  "/script.js?v=13",
  "/bella-legacy-plus.js?v=13",
  "/bella-context.js?v=13",
  "/bella-routing.js?v=13",
  "/bella-style.js?v=13",
  "/bella-runtime.js?v=13",
  "/bella-vnext.js?v=13",
  "/bella-speed.js?v=13",
  "/bella-ui.js?v=13",
  "/bella-install.js?v=13",
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
