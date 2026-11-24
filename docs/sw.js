const CACHE_NAME = 'nbu-rate-v24-11-07';

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
  './manifest-android.webmanifest',
  './chart.umd.min.js',
  './chart.min.js'
];

const OFFLINE_URL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(FILES.map(async file => {
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
