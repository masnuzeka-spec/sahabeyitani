// Network-First (Önce Güncel Sunucu, Çevrimdışıysa Önbellek) Stratejisi
// Bu yapı sayesinde sitede yapılan her güncelleme gizli sekmeye veya geçmiş silmeye gerek kalmadan anında yüklenir.
const CACHE_NAME = "sahabeyi-tani-cache-v3";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./css/variables.css",
  "./css/reset.css",
  "./css/themes.css",
  "./css/main.css",
  "./css/components.css",
  "./css/pages.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/router.js",
  "./js/layout.js",
  "./js/home.js",
  "./js/categories.js",
  "./js/biographies.js",
  "./js/tests.js",
  "./js/quiz.js",
  "./js/who-am-i.js",
  "./js/profile.js",
  "./js/scoring.js",
  "./js/stars.js",
  "./js/storage.js",
  "./js/favorites.js",
  "./js/sharing.js",
  "./js/telegram.js",
  "./js/utils.js",
  "./data/app-content.js",
  "./data/app-settings.js",
  "./data/categories.js",
  "./data/achievements.js",
  "./data/sahabis-index.js",
  "./assets/images/logo.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  // Her zaman önce ağdan (sunucudan) en güncel dosyayı çek, önbelleği güncelle;
  // yalnızca internet yoksa (çevrimdışıysa) önbellekteki kopyayı döndür.
  event.respondWith(
    fetch(event.request, { cache: "no-cache" })
      .then(networkResp => {
        if (networkResp && networkResp.status === 200 && networkResp.type === "basic") {
          const respClone = networkResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return networkResp;
      })
      .catch(() => {
        return caches.match(event.request, { ignoreSearch: true }).then(cached => {
          return cached || caches.match("./index.html", { ignoreSearch: true });
        });
      })
  );
});
