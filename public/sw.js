// Service Worker untuk Aplikasi Buku Wahidiyah
// Mendukung App Shell Offline, Cache-First untuk Aset Statis, dan Network-First untuk Data Publik

// CACHE_NAME wajib di-bump setiap deploy (aturan proyek §R5.6) agar cache app shell
// versi lama dibuang saat activate — kali ini karena server ikut melayani dist/.
// v8 (R20): referensi `/api/categories` yang sudah mati dibuang dari rute cache.
const CACHE_NAME = 'wahidiyah-app-shell-v8';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// 1. Install & Precache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate & Clean Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event Routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Jangan sentuh request selain GET
  if (request.method !== 'GET') {
    return;
  }

  // JANGAN cache endpoint buku berbayar/privat & autentikasi (Invarian Keamanan Konten)
  if (
    url.pathname.includes('/api/books/') && url.pathname.endsWith('/content') ||
    url.pathname.startsWith('/api/auth/') ||
    url.pathname.startsWith('/api/subscriptions/') ||
    url.pathname.startsWith('/api/transactions')
  ) {
    return;
  }

  // A. Data Publik API (Katalog Buku, Agenda, Iklan) -> Network First dengan Fallback Cache
  if (
    url.pathname === '/api/books' ||
    url.pathname === '/api/events' ||
    url.pathname === '/api/ads' ||
    url.pathname.endsWith('/thumbnail') ||
    url.pathname.endsWith('/image')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // B. Aset Statis Ber-hash Vite (/assets/*, fonts, images) -> Cache-First
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // C. HTML Navigasi Halaman SPA -> Network First dengan fallback ke index.html cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => (
        caches.match('/index.html').then((cached) => cached || caches.match('/'))
      ))
    );
    return;
  }

  // D. Default -> Fetch normal dengan fallback cache
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
