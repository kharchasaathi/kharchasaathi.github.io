// =======================================================
// KharchaSaathi — Service Worker v8 (ENTERPRISE SAFE)
// -------------------------------------------------------
// ⭐ STRICT ONLINE-FIRST
// ⭐ Dashboard = NETWORK ONLY
// ⭐ Auth pages cached safely
// ⭐ Firebase / Google / Razorpay NEVER cached
// ⭐ Hostname-based API protection
// ⭐ Smart offline fallback
// ⭐ SaaS + Payments production safe
// =======================================================

const CACHE_NAME = "ks-cache-v8";

/* -------------------------------------------------------
   STATIC FILES — SAFE BEFORE LOGIN
------------------------------------------------------- */
const CORE_ASSETS = [
  "/",
  "/index.html",

  // Auth pages (offline UI allowed)
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
      console.log("[SW] Installing v8…");

      for (const asset of CORE_ASSETS) {
        try {
          const res = await fetch(asset, { cache: "no-store" });
          if (res.ok) {
            await cache.put(asset, res.clone());
          }
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
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
  console.log("[SW] Active v8");
});

/* -------------------------------------------------------
   FETCH HANDLER
------------------------------------------------------- */
self.addEventListener("fetch", event => {

  const req = event.request;

  // Only handle GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  /* ---------------------------------------------------
     1️⃣ HARD NETWORK ONLY — DASHBOARD & TOOLS
  --------------------------------------------------- */
  if (url.pathname.startsWith("/tools/")) {
    event.respondWith(fetch(req));
    return;
  }

  /* ---------------------------------------------------
     2️⃣ STRICT BLOCK — CLOUD / AUTH / PAYMENT HOSTS
  --------------------------------------------------- */
  const blockedHosts = [
    "firebaseapp.com",
    "firebaseio.com",
    "googleapis.com",
    "gstatic.com",
    "razorpay.com"
  ];

  if (blockedHosts.some(host => url.hostname.includes(host))) {
    event.respondWith(fetch(req));
    return;
  }

  /* ---------------------------------------------------
     3️⃣ ONLINE FIRST — SAFE STATIC FILES
  --------------------------------------------------- */
  event.respondWith(
    fetch(req)
      .then(res => {

        // Only cache successful same-origin responses
        if (
          res &&
          res.ok &&
          url.origin === self.location.origin
        ) {
          caches.open(CACHE_NAME)
            .then(cache => cache.put(req, res.clone()));
        }

        return res;

      })
      .catch(async () => {

        // Try cache
        const cached = await caches.match(req);
        if (cached) return cached;

        // If navigation request → fallback to login page
        if (req.mode === "navigate") {
          const fallback = await caches.match("/login.html");
          if (fallback) return fallback;
        }

        // Final fallback
        return new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain" }
        });
      })
  );
});
