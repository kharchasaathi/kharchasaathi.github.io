// =======================================================
// KharchaSaathi — Service Worker v7 (LOGIN SAFE ONLINE MODE)
// -------------------------------------------------------
// ⭐ ONLINE-FIRST
// ⭐ Dashboard = NETWORK ONLY (no cache, no offline serve)
// ⭐ Login / Reset / Signup cached
// ⭐ Firebase & APIs NEVER cached
// ⭐ Safe for SaaS + Payments (Razorpay ready)
// =======================================================

const CACHE_NAME = "ks-cache-v7";

/* -------------------------------------------------------
   STATIC FILES — SAFE BEFORE LOGIN
------------------------------------------------------- */
const CORE_ASSETS = [
  "/",
  "/index.html",

  // Auth pages (allowed offline UI only)
  "/login.html",
  "/reset-password.html",
  "/signup.html",

  // PWA
  "/manifest.json",
  "/favicon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",

  // Base auth utilities
  "/css/base.css",
  "/js/firebase.js",
  "/js/login-utils.js"
];

/* -------------------------------------------------------
   INSTALL
------------------------------------------------------- */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log("[SW] Installing v7…");

      for (const asset of CORE_ASSETS) {
        try {
          const res = await fetch(asset, { cache: "no-store" });
          if (res.ok) cache.put(asset, res.clone());
        } catch {
          console.warn("[SW] Skipped:", asset);
        }
      }
    })
  );
  self.skipWaiting();
});

/* -------------------------------------------------------
   ACTIVATE
------------------------------------------------------- */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
  console.log("[SW] Active v7");
});

/* -------------------------------------------------------
   FETCH — LOGIN SAFE ONLINE FIRST
------------------------------------------------------- */
self.addEventListener("fetch", event => {
  const req = event.request;
  const url = req.url;

  if (req.method !== "GET") return;

  /* 🔥 HARD BLOCK — NEVER CACHE / SERVE DASHBOARD */
  if (
    url.includes("/tools/business-dashboard.html") ||
    url.includes("/tools/")
  ) {
    event.respondWith(fetch(req)); // network only
    return;
  }

  /* 🔥 BLOCK ALL CLOUD / AUTH / PAYMENT APIs */
  if (
    url.includes("firebase") ||
    url.includes("firestore") ||
    url.includes("googleapis") ||
    url.includes("auth") ||
    url.includes("razorpay")
  ) {
    return; // browser handles network
  }

  /* ---------------------------------------------------
     ONLINE FIRST FOR SAFE STATIC FILES
  --------------------------------------------------- */
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, res.clone());
          });
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(cached => {
          if (cached) return cached;

          return new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" }
          });
        })
      )
  );
});
