const CACHE_VERSION = 'v1';
const CACHE_NAME = `ven-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/pwa/index.html',
  '/pwa/offline.html',
  '/pwa/manifest.json',
  '/pwa/assets/css/style.css',
  '/pwa/assets/img/icon-144x144.png',
  '/pwa/assets/img/icon-192x192.png',
  '/pwa/assets/img/icon-512x512.png',
  '/pwa/assets/img/screenshot-narrow.png',
  '/pwa/assets/img/screenshot-wide.png',
  // Add any additional assets you need to cache within /pwa/
];

// INSTALL: Pre-cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing and caching core assets...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.error('Service Worker: Failed to cache core assets:', err))
  );
});

// ACTIVATE: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating and cleaning up old caches...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`Service Worker: Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH: Intercept network requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Try to fetch from the network first
    fetch(event.request)
      .then((networkResponse) => {
        // Optionally, update your cache with the new response here if desired
        return networkResponse;
      })
      .catch(() => {
        // If the network is unavailable, try to serve the asset from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If it's a navigation request and nothing is in the cache, serve offline.html
          if (event.request.mode === 'navigate') {
            return caches.match('/pwa/offline.html');
          }
          // You can return a default response for other types of requests here if needed
        });
      })
  );
});


