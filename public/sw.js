const CACHE_NAME = "pregnancy-shell-v1";
const SHELL = ["/", "/manifest.webmanifest", "/nest-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  // Never cache invite links or any URL carrying query parameters (tokens are credentials).
  if (url.search) return;
  if (url.pathname.startsWith("/auth/") || url.pathname.startsWith("/rest/")) return;
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok && (url.pathname === "/" || url.pathname.startsWith("/assets/"))) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
