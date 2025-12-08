const CACHE_NAME = "smartsense-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/src/main.tsx",
  "/src/App.tsx",
  "/src/index.css",
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// FETCH (THIS IS THE IMPORTANT FIX)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Ignore API calls
  if (url.origin.includes("localhost:3001")) return;

  // 2. Ignore node_modules (Vite modules)
  if (url.pathname.startsWith("/node_modules")) return;

  // 3. Ignore Vite dev/HMR
  if (
    url.pathname.includes("vite") ||
    url.pathname.includes("@vite") ||
    url.pathname.includes("hot") ||
    url.pathname.includes("hmr") ||
    url.pathname.includes("@react-refresh")
  ) {
    return;
  }

  // 4. Ignore icons + manifest assets
  if (url.pathname.endsWith(".png") || url.pathname.includes("icon")) return;

  // 5. Cache-first fallback
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          return new Response("Network error", {
            status: 503,
            statusText: "Service Unavailable",
          });
        })
      );
    })
  );
});

// ACTIVATE - clear old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
});
