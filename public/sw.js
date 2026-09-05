// Service Worker for Tamreen Mobile Data Resiliency & Offline Cache
const CACHE_NAME = 'tamreen-v2.5-cache';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Fast Mobile Data Fallback Strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle HTML navigation requests (Network-first with 2s timeout -> Fallback to Cache)
  if (request.mode === 'navigate') {
    event.respondWith(
      new Promise((resolve) => {
        let isResolved = false;
        const timer = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            caches.match('/index.html').then((cached) => {
              if (cached) resolve(cached);
            });
          }
        }, 2000);

        fetch(request)
          .then((response) => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timer);
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
              resolve(response);
            }
          })
          .catch(() => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timer);
              caches.match('/index.html').then((cached) => {
                resolve(cached || new Response('<h1>অফলাইন মোড</h1><p>ইন্টারনেট বা মোবাইল ডাটা কানেকশন পরীক্ষা করুন।</p>', {
                  headers: { 'Content-Type': 'text/html; charset=utf-8' }
                }));
              });
            }
          });
      })
    );
    return;
  }

  // Handle Static JS/CSS/Fonts assets (Stale-While-Revalidate)
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default network fetch with catch for network failure
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
