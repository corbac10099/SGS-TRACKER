// SGS-Tracker Web Push & PWA Offline Service Worker
const CACHE_NAME = 'sgs-tracker-v2';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/spycam-icon.png',
  '/spycam-logo.png',
  '/sgs-icon.jpg',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache prefetch error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorer les requêtes non-GET et les requêtes Chrome Extension
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Ne JAMAIS mettre en cache les requêtes API dynamiques
  if (request.url.includes('/api/')) {
    return;
  }

  // Requêtes de navigation (pages HTML) -> Network First avec fallback Offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Si succès, cloner la page dans le cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Si échec réseau, tenter le cache de la page demandée
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Sinon, renvoyer la page de secours offline
          const offlinePage = await caches.match('/offline.html');
          return offlinePage || new Response('Hors-ligne', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // Fichiers statiques (images, polices, css, js Next.js) -> Cache First avec fallback Network
  const isStaticAsset =
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.url.includes('/_next/static/');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // En arrière-plan, mettre à jour le cache (stale-while-revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {/* Ignore network errors for background revalidation */});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
  }
});

// === Web Push Notifications ===
self.addEventListener('push', (event) => {
  let data = { title: 'SGS-Tracker Valorant', body: 'Nouvelle notification Valorant !', icon: '/spycam-icon.png' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (_) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/spycam-icon.png',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
