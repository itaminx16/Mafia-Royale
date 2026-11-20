// =====================================================================
//  SERVICE WORKER — 100% Офлайн-робота + Автооновлення при появі мережі
// =====================================================================
const CACHE_NAME = 'mafia-royale-v6';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
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

// 1) При встановленні — кешуємо ВСІ файли гри для миттєвої офлайн-роботи
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 2) При активації — видаляємо старі кеші і беремо контроль над усіма вкладками
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 3) Network-First з миттєвим відкатом на кеш:
//    - Якщо є інтернет -> качає найсвіжішу версію і оновлює кеш.
//    - Якщо інтернету немає (або сервер вимкнено) -> миттєво відкриває з кешу!
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const req = event.request;

  // Навігація по сторінці (відкриття додатку)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
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

  // Статичні ресурси (JS, CSS, SVG, PNG, manifest)
  event.respondWith(
    fetch(req)
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
