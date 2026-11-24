/* NBU Rate · v15. Files are relative to /NBU-Rate/ even when hosted from /docs. */
const CACHE = 'nbu-rate-shell-v15-20261124';
const FILES = ['./index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];
const MAIN_PAGE = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Never fail installation because one asset is missing or a request is temporarily offline.
    await Promise.all(FILES.map(async file => {
      try {
        const url = new URL(file, self.registration.scope);
        const response = await fetch(url, {cache:'reload'});
        if (response.ok) await cache.put(url.href, response);
      } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key =>
      (key.startsWith('nbu-rate-shell-') || key.startsWith('nbu-rate-pwa-')) && key !== CACHE
    ).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(MAIN_PAGE, copy)).catch(() => {});
        }
        return response;
      } catch (_) {
        const cached = await caches.match(MAIN_PAGE);
        return cached || Response.error();
      }
    })());
  } else if (/\/(manifest\.webmanifest|icons\/[^/]+\.png)$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
