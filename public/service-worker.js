const CACHE_NAME = 'watchvault-shell-v1';
const API_CACHE_NAME = 'watchvault-tmdb-api-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/Vault.ico',
  '/static/js/bundle.js',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js'
];

// Install event: Pre-cache standard shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static app shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some assets failed to pre-cache; they will be cached dynamically upon request.', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event: Sweep and clean up expired caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            console.log('[Service Worker] Deleting outdated cache key:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Apply specific caching strategies
self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/HTTPS (ignore chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) return;

  const requestUrl = new URL(event.request.url);

  // Strategy A: TMDb API Queries (Network-First with Cache-Fallback)
  if (requestUrl.hostname.includes('api.themoviedb.org')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            return cache.match(event.request).then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              
              // If not found in cache and offline, return a friendly JSON response
              return new Response(
                JSON.stringify({
                  results: [],
                  success: false,
                  status_message: "Offline: This content isn't cached yet.",
                  page: 1
                }),
                { headers: { 'Content-Type': 'application/json' } }
              );
            });
          });
      })
    );
    return;
  }

  // Strategy B: App Shell Assets (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh version in the background to update the cache for future visits
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* Silent ignore of background fetch failures */ });
        
        return cachedResponse;
      }

      // Return network response for non-cached files, fallback to index.html for React Router routing
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Skip waiting listener (for standard update workflows)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
