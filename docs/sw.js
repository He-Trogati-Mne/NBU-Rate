const CACHE_NAME = 'nbu-rate-shell-v14';
const SHELL = ['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('nbu-rate-shell-') && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch (_) {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match('./index.html') || Response.error();
      }
    })());
    return;
  }
  if (!['/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png'].some(p => url.pathname.endsWith(p))) return;
  event.respondWith((async () => {
    const cached = await caches.match(request, {ignoreSearch:true});
    return cached || fetch(request);
  })());
});
