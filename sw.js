const CACHE = "fitxar-motospirit-v1";
const FITXERS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/config.js",
  "./js/geolocation.js",
  "./js/auth.js",
  "./js/appsscript.js",
  "./manifest.json",
  "./icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FITXERS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((claus) =>
      Promise.all(claus.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cachejat) => {
      const xarxa = fetch(event.request)
        .then((resposta) => {
          const clon = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clon));
          return resposta;
        })
        .catch(() => cachejat);
      return cachejat || xarxa;
    })
  );
});
