// =======================================================
// KharchaSaathi — Service Worker v4 (Final Safe Edition)
// - Fix: CCACHE_NAME bug
// - Only essential assets cached
// - Auto-update, no stale dashboard files
// =======================================================

const CACHE_NAME = "ks-cache-v4";

// Cache ONLY core public files (safe to store offline)
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/favicon.png"
];

// -------------------------------------------------------
// INSTALL — Cache essential static assets
// -------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Installing & caching core assets…");
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting(); // Activate immediately
});

// -------------------------------------------------------
// ACTIVATE — Delete old caches
// -------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  console.log("[SW] Activated. Old caches removed.");
  self.clients.claim();
});

// -------------------------------------------------------
// FETCH — Cache-first but update in background
// -------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only GET requests should be cached
  if (req.method !== "GET") return;

  // Never cache Firebase or API requests
  const url = req.url;
  if (url.includes("firestore") || url.includes("firebase")) {
    return; // Always use network
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, res.clone());
            });
          }
          return res;
        })
        .catch(() => cached || new Response("Offline", { status: 503 }));

      // Fast return cached, update in background
      return cached || networkFetch;
    })
  );
});
