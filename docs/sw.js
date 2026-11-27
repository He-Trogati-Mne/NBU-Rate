const CACHE_NAME = 'nbu-rate-v47';

const MARKET_LOGOS = [
  './crypto-stocks/whitebit.svg',
  './crypto-stocks/binance.svg',
  './crypto-stocks/bybit.svg',
  './crypto-stocks/kraken.svg',
  './crypto-stocks/ibkr.svg',
  './crypto-stocks/trading212.svg',
  './crypto-stocks/investing.svg'
];
const MARKET_LOGO_URLS = new Set(MARKET_LOGOS.map(file => new URL(file, self.registration.scope).href));

const FILES = [
  ...MARKET_LOGOS,
  './',
  './index.html',
  './company-profiles.js?v=47',
  './company-profiles.css?v=47',
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
    const shell = await fetch(OFFLINE_URL, {cache: 'reload'});
    if (!shell.ok || !/text\/html/i.test(shell.headers.get('content-type') || '')) {
      throw new Error('Cannot install PWA: new index.html unavailable');
    }
    await cache.put(OFFLINE_URL, shell);
    await Promise.allSettled(FILES.filter(file => file !== './' && file !== './index.html').map(async file => {
      const url = new URL(file, self.registration.scope);
      const response = await fetch(url, {cache: 'reload'});
      if (response.ok) await cache.put(url.href, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key =>
      key.startsWith('nbu-rate-') && key !== CACHE_NAME
    ).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (MARKET_LOGO_URLS.has(url.href) && request.mode !== 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, {cache: 'no-cache'});
        if (response.ok && /image\/svg\+xml/i.test(response.headers.get('content-type') || '')) {
          await cache.put(url.href, response.clone()).catch(() => {});
        }
        return response;
      } catch (_) {
        return (await cache.match(url.href)) || Response.error();
      }
    })());
    return;
  }
  if (request.mode !== 'navigate' && ['company-profiles.js','company-profiles.css'].some(name => url.pathname === new URL(name,self.registration.scope).pathname)) {
    event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME);try{const r=await fetch(request);if(r.ok)await cache.put(request,r.clone());return r;}catch(_){return (await cache.match(request))||Response.error();}})());return;
  }
  if (request.mode !== 'navigate') return;
  const root = new URL('./', self.registration.scope);
  if (url.pathname !== root.pathname && url.pathname !== new URL(OFFLINE_URL).pathname) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request, {cache: 'no-cache'});
      if (response.ok) {
        const copy = response.clone();
        await caches.open(CACHE_NAME).then(cache => cache.put(OFFLINE_URL, copy)).catch(() => {});
      }
      return response;
    } catch (_) {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(OFFLINE_URL)) || Response.error();
    }
  })());
});

