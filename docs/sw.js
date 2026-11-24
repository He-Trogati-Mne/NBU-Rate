const CACHE_NAME = 'nbu-rate-pwa-v17-20261124';
const SHELL_FILES = [
  './index.html', './manifest.webmanifest', './favicon/nbu-pwa-192.png',
  './favicon/nbu-pwa-512.png', './favicon/nbu-pwa-maskable-512.png', './favicon/nbu-apple-touch-icon.png'
];
const OFFLINE_URL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(SHELL_FILES.map(async file => {
      const url = new URL(file, self.registration.scope);
      const response = await fetch(url, {cache: 'reload'});
      if (response.ok) await cache.put(url.href, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key =>
      (key.startsWith('nbu-rate-pwa-') || key.startsWith('nbu-rate-shell-')) && key !== CACHE_NAME
    ).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(OFFLINE_URL, copy)).catch(() => {}));
      }
      return response;
    } catch (_) {
      return (await caches.match(OFFLINE_URL)) || Response.error();
    }
  })());
});
