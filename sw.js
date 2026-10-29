// Offline cache for the app shell. Bump VERSION whenever files change.
const VERSION = "bijakzmy-v1";
const FILES = [
  "./", "index.html", "css/style.css", "manifest.webmanifest", "icons/icon.svg", "icons/icon-maskable.svg",
  "js/app.js", "js/util.js", "js/store.js", "js/engine.js", "js/generators.js", "js/quiz.js", "js/games.js", "js/ai.js",
  "js/data/index.js", "js/data/matematik.js", "js/data/sains.js", "js/data/sejarah.js", "js/data/geografi.js", "js/data/bm.js", "js/data/english.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // AI & CDN go straight to network
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(e.request, copy));
      return res;
    }))
  );
});
