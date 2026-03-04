// ============================================================
//  School Lottery Fundraiser — Service Worker
//  Cache-first strategy: app works fully offline after first load
// ============================================================

const CACHE_NAME = "slm-v1";

const PRECACHE_URLS = [
  "/School-Lottery-Fundraiser/",
  "/School-Lottery-Fundraiser/index.html",
  "/School-Lottery-Fundraiser/manifest.json",
  "/School-Lottery-Fundraiser/css/styles.css",
  "/School-Lottery-Fundraiser/assets/splash.svg",
  "/School-Lottery-Fundraiser/assets/icon-192.png",
  "/School-Lottery-Fundraiser/assets/icon-512.png",
  "/School-Lottery-Fundraiser/js/app.js",
  "/School-Lottery-Fundraiser/js/db.js",
  "/School-Lottery-Fundraiser/js/defaultData.js",
  "/School-Lottery-Fundraiser/js/fundraiser.js",
  "/School-Lottery-Fundraiser/js/lottery.js",
  "/School-Lottery-Fundraiser/js/main.js",
  "/School-Lottery-Fundraiser/js/manager.js",
  "/School-Lottery-Fundraiser/js/sharedRenderer.js",
  "/School-Lottery-Fundraiser/js/studentModel.js",
  "/School-Lottery-Fundraiser/js/tickets.js",
  "/School-Lottery-Fundraiser/js/wizard.js",
  "/School-Lottery-Fundraiser/js/xlsx.full.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
];

// ── Install: pre-cache everything ──────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache local files strictly; CDN files best-effort
        const local = PRECACHE_URLS.filter(u => !u.startsWith("http"));
        const cdn   = PRECACHE_URLS.filter(u =>  u.startsWith("http"));

        return cache.addAll(local).then(() =>
          Promise.allSettled(cdn.map(url =>
            fetch(url, { mode: "cors" })
              .then(r => r.ok ? cache.put(url, r) : null)
              .catch(() => null)   // CDN unavailable on first load — skip silently
          ))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate: delete old caches ────────────────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first, network fallback ───────────────────────────────────
self.addEventListener("fetch", event => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      // Not in cache — try network, cache the response for next time
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline and not cached — return the app shell for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/School-Lottery-Fundraiser/index.html");
          }
        });
    })
  );
});
