const CACHE = 'nbu-rate-static-v18';

const FILES = [
  './',
  './index.html',
  './favicon/site.webmanifest',
  './favicon/web-app-manifest-192x192.png',
  './favicon/web-app-manifest-512x512.png',
  './favicon/apple-touch-icon.png',
  './favicon/favicon-16x16.png',
  './favicon/favicon-32x32.png',
  './favicon/favicon-96x96.png',
  './favicon/favicon.ico',
  './favicon/favicon.svg',
  './favicon/browserconfig.xml',
  './manifest.webmanifest',
  './chart.umd.min.js',
  './chart.min.js'
];

const SCOPE = self.registration.scope;
const OFFLINE = new URL('./index.html', SCOPE).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);

    await Promise.all(FILES.map(async file => {
      try {
        const url = new URL(file, SCOPE).href;
        const response = await fetch(url, {
          cache: 'reload'
        });

        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        // Недоступный файл не ломает установку SW
      }
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith('nbu-rate-') && key !== CACHE
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const scope = new URL(SCOPE);

  if (
    url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname)
  ) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(OFFLINE, response.clone());
        }

        return response;
      } catch (error) {
        const cache = await caches.open(CACHE);
        return await cache.match(OFFLINE)
          || Response.error();
      }
    })());

    return;
  }

  const allowed = FILES.map(file =>
    new URL(file, SCOPE).href
  );

  if (allowed.includes(url.href)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);

      if (cached) return cached;

      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response.clone());
      }

      return response;
    })());
  }
});
