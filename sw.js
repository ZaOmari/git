// Service worker for the СтройКонтроль PWA.
//
// Update strategy: bump APP_VERSION on each release. On activate we delete every
// cache that isn't the current one, and claim clients immediately. Code assets
// (HTML/JS/CSS + navigations) use network-first, so a normal page refresh pulls
// the new version when online and falls back to cache offline. Static assets
// (icons, manifest) use cache-first. The page reloads once on controllerchange.
const APP_VERSION = 'v4-2026-06-14';
const CACHE = `stroykontrol-${APP_VERSION}`;

const SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './src/app.js',
  './src/views.js',
  './src/helpers.js',
  './src/data.js',
  './src/tour.js',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
];

// cache-first для статичных ассетов
const STATIC_RX = /\.(?:png|svg|jpg|jpeg|webp|gif|ico|webmanifest)$/i;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return; // только свои ресурсы

  if (STATIC_RX.test(url.pathname)) {
    // cache-first
    e.respondWith(
      caches.match(req).then((cached) => cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }))
    );
    return;
  }

  // network-first для HTML/JS/CSS и навигаций → обновление приходит на refresh
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
