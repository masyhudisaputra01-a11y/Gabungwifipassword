const CACHE_NAME = 'simjaringan-hub-v5';
const ASSETS = [
  './',
  './index.html',
  './app-jaringan.html',
  './app-wifi.html',
  './manifest.json',
  './manifest-wifi.json',
  './icon-192.png',
  './icon-512.png',
  './wifi-icon-192.png',
  './wifi-icon-512.png',
  './embedded_data.js',
  './xlsx.full.min.js',
  './qrcode.min.js',
  './emblem_header.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isHtmlRequest(request){
  if (request.mode === 'navigate') return true;
  const url = request.url;
  return url.endsWith('.html') || url.endsWith('/');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // HTML: network-first, supaya perubahan terbaru selalu diambil saat online.
  // Cache hanya dipakai sebagai cadangan ketika offline.
  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Aset lain (js/png/json): cache-first untuk kecepatan & offline.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
        return res;
      }).catch(() => cached);
    })
  );
});

