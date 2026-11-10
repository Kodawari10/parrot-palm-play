/* Offline cache for Parrot Island. Only same-origin files are cached. */
const CACHE = 'parrot-palm-v9';
const FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/logic.js',
  './js/maps.js',
  './js/art.js',
  './js/audio.js',
  './js/game.js',
  './js/install.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './img/parrot-mango.webp',
  './img/parrot-pip.webp',
  './img/parrot-nova.webp',
  './img/parrot-lulu.webp',
  './img/parrot-sol.webp',
  './img/grove-coconut.webp',
  './img/palm-tree.webp',
  './img/map-coconut.webp',
  './img/map-starfruit.webp',
  './img/map-moonpearl.webp'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
