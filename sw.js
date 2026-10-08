/* Service worker MCT Notes — ganti VERSION setiap kali file aplikasi diubah */
const VERSION = 'mct-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.ico',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Data & foto Supabase selalu langsung dari internet (tidak di-cache)
  if (url.hostname.endsWith('supabase.co')) return;

  // Halaman aplikasi: ambil versi terbaru dulu, pakai cache jika offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // File statis (ikon, library): cache dulu, lalu internet
  if (url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }))
    );
  }
});
