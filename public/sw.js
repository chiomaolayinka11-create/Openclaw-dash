// OpenClaw Core Service Worker for installable PWA implementation
const CACHE_NAME = 'openclaw-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/icon-192.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Warm up caching registry safely
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('PWA: Cache register failed during warm up', err);
      });
    })
  );
  // Force active SW
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('PWA: Purging outdated cache key:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Cache with network fallback strategy
self.addEventListener('fetch', (e) => {
  // Only intercept HTTP/S GET transactions
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  // Cache bypass for live backend API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return stale cache, but fetch fresh content in background for static assets
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for offline root
        if (e.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
