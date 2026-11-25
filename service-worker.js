// =====================================================================
//  SERVICE WORKER — Офлайн-кеш + Примусове оновлення без застарілого HTTP-кешу
// =====================================================================
const CACHE_NAME = 'mafia-royale-v11';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './version.json',
  './js/data.js',
  './js/storage.js',
  './js/audio.js',
  './js/portraits.js',
  './js/game.js',
  './js/ai.js',
  './js/renderer.js',
  './js/ui.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of ASSETS) {
        try {
          const resp = await fetch(new Request(url, { cache: 'reload' }));
          if (resp && resp.ok) await cache.put(url, resp);
        } catch (e) {}
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const req = event.request;
  const url = new URL(req.url);

  // version.json завжди беремо напряму з мережі (ніколи не підсовуємо стару версію!)
  if (url.pathname.endsWith('version.json')) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match('./version.json')));
    return;
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(resp => {
          if (resp && resp.status === 200) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put('./index.html', copy));
          }
          return resp;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(resp => {
        if (resp && resp.status === 200) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
        }
        return resp;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
