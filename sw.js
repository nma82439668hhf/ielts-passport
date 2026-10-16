const CACHE_NAME = "ielts-passport-responsive-web-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./design.css",
  "./motion.css",
  "./study-panel.css",
  "./theme.css",
  "./theme.js",
  "./ios.css",
  "./ios.js",
  "./motion.js",
  "./shell.js",
  "./welcome-bootstrap.js",
  "./study-panel.js",
  "./app.js",
  "./hybrid-update.js",
  "./version.json",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./assets/vega-support.jpg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./vendor/lucide.min.js",
  "./data/learn.js",
  "./data/vocab-levels.js",
  "./data/vocab-quiz.js",
  "./data/staged.js",
  "./data/library.js",
  "./data/grammar.js",
  "./data/reading.js",
  "./data/listening.js",
  "./data/writing.js",
  "./data/speaking.js",
  "./data/sources.js",
  "./data/vocab-meta.js",
  "./data/version.js",
  "./data/cloud-config.js",
  "./data/changelog.js",
  "./data/remote-version.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes("/data/dict/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }))
    );
    return;
  }

  const networkFirst = request.mode === "navigate" || /(?:app\.js|styles\.css|design\.css|motion\.(?:css|js)|theme\.(?:css|js)|ios\.(?:css|js)|study-panel\.(?:css|js)|shell\.js|welcome-bootstrap\.js|index\.html|manifest\.webmanifest|sw\.js|version\.json|data\/(?:cloud-config|changelog|version|remote-version)\.js)$/.test(url.pathname);
  if (networkFirst) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(async () => (await caches.match(request)) ||
        (request.mode === "navigate" ? caches.match("./index.html") : Response.error()))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
