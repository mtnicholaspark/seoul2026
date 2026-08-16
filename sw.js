const CACHE_NAME = 'seoul2026-shell-v3';
const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './utils.js',
  './firebase-config.js',
  './calendar.js',
  './wishlist.js',
  './nearby.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept Firestore/Google API or map-related CDN/tile traffic — always network,
  // let Firestore's own offline cache (and the browser's HTTP cache for everything else) handle it.
  if (
    url.origin.includes('googleapis.com') ||
    url.origin.includes('firestore') ||
    url.origin.includes('gstatic.com') ||
    url.origin.includes('unpkg.com') ||
    url.origin.includes('tile.openstreetmap.org') ||
    url.origin.includes('openfreemap.org')
  ) {
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
