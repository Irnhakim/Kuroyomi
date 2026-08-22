const CACHE_NAME = 'kuroyomi-cache-v1';
const IMAGE_CACHE_NAME = 'kuroyomi-images-v1';

// Assets to pre-cache on install (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo.svg',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Check if it's a manga page image or thumbnail request
  const isImageRequest =
    url.pathname.includes('/api/v1/manga/') &&
    (url.pathname.includes('/page/') || url.pathname.includes('/thumbnail') || url.pathname.includes('/extension/icon/'));

  if (isImageRequest) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return from cache immediately
            return cachedResponse;
          }

          // Fetch from network, cache it, and return
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Offline fallback
            return new Response('Offline', { status: 503 });
          });
        });
      })
    );
    return;
  }

  // Non-image request: Network-First (or Cache-First for static assets)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return static assets from cache
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
