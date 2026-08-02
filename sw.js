/* ============================================
   وزنية الكيّيف — Service Worker
   التخزين المؤقت لتشغيل PWA بدون إنترنت
   ============================================ */

const CACHE = 'shahicalc-v23';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './fonts.css',
  './icon.png'
];

// عند التثبيت: خزّن كل الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// عند التفعيل: احذف الكاش القديم
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// عند أي طلب: الكاش أولاً، ثم الشبكة (Cache First)
self.addEventListener('fetch', (event) => {
  // لا نتدخل في طلبات غير GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // خزّن النسخة الجديدة للاستخدام المستقبلي (للملفات من نفس الأصل فقط)
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // لو فشلت الشبكة، حاول ترجع الصفحة الرئيسية من الكاش
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
