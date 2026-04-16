// Bella Terra Portal — Service Worker
// Minimal SW to enable PWA install prompt.
// Update CACHE_NAME when you migrate to the new host so phones re-fetch assets.
const CACHE_NAME = 'bella-terra-v1';

self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Pass-through — portal data comes live from Apps Script.
  // Swap this for a cache-first strategy after migration if you want offline support.
  e.respondWith(fetch(e.request).catch(function() {
    return caches.match(e.request);
  }));
});
