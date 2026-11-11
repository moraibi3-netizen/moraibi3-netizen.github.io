// オリカ工房（単体版）Service Worker
// ページ本体と素材をキャッシュし、オフラインでも起動できるようにする。
var CACHE_NAME = "orika-standalone-v3";
var CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/cost-emblem.webp",
  "./assets/symbol-gem.webp",
  "./assets/soul-core.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(CORE_FILES);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE_NAME ? null : caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        }
        return res;
      }).catch(function () {
        if (req.mode === "navigate") return caches.match("./index.html");
        throw new Error("offline");
      });
    })
  );
});
