// Cartera SATHIRI · SATMEC — Service Worker
// Sube la versión cada vez que cambie la lógica de caché.
const CACHE = "cartera-v3";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./logo-satmec.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = req.url;

  // Datos en vivo del Apps Script: nunca cachear.
  if (url.includes("script.google.com")) return;

  // HTML (la app en sí): SIEMPRE primero la red, así ves la versión más reciente.
  const isHTML = req.mode === "navigate" || req.destination === "document"
              || url.endsWith("/") || url.endsWith("index.html");
  if (isHTML) {
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  // Resto (íconos, manifest): primero la copia guardada (cargan más rápido).
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return resp;
    }))
  );
});
