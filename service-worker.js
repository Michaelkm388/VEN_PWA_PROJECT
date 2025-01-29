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

// FETCH: Serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return; // Only handle GET requests
  }

  // Example: Network-first strategy for API requests within /pwa/api/
  if (event.request.url.includes('/pwa/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Clone and cache the response
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default: Cache-first strategy for other /pwa/ requests
  if (event.request.url.startsWith(self.location.origin + '/pwa/')) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then((networkResponse) => {
              // Cache the new resource if it's a basic GET request
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseClone = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return networkResponse;
            })
            .catch(() => {
              // Serve offline page for navigation requests within /pwa/ when offline
              if (event.request.mode === 'navigate') {
                return caches.match('/pwa/offline.html');
              }
            });
        })
    );
  }
});

