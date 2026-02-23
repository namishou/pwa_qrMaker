const CACHE_PREFIX = "qr-maker-";
const CACHE_VERSION = Date.now().toString();
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

// Determine base from SW scope
const BASE = self.registration ? self.registration.scope : "/";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([BASE]))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
     .then(() => {
       self.clients.matchAll().then((clients) => {
         clients.forEach((client) => client.postMessage({ type: "SW_UPDATED" }));
       });
     })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match(BASE)))
  );
});
