/*
 * Penlabs Lighting Calculator — service worker.
 * Conservative offline support: the calculators and designer compute entirely
 * client-side, so cached app shell + assets keep them working without signal.
 *  - GET only; never touches /api (leads, projects, config stay online-only).
 *  - hashed static assets: cache-first (immutable).
 *  - navigations: network-first with cache fallback (always fresh when online).
 */
const CACHE = 'penlabs-cache-v1';
const APP_SHELL = [
  '/',
  '/calculator',
  '/designer',
  '/lumens-calculator',
  '/project',
  '/manifest.webmanifest',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(APP_SHELL.map((url) => cache.add(url).catch(() => undefined)))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // skip cross-origin
  if (url.pathname.startsWith('/api/')) return; // never cache API

  // Immutable hashed assets → cache-first.
  if (url.pathname.startsWith('/_next/static/') || url.pathname === '/icon.svg') {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          })
      )
    );
    return;
  }

  // HTML navigations → network-first, fall back to cache (then home) offline.
  const isHtml = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHtml) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
  }
});
