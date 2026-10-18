/* অ্যাপের খোলস ফোনে রেখে দেয়, যাতে দ্রুত খোলে। ডাটা সবসময় অনলাইন থেকে আসে। */
const CACHE = 'ac-shell-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// নিজের ফাইল: আগে নেটওয়ার্ক, না পেলে ক্যাশ। অন্য সাইট (Supabase, ফন্ট) ছুঁই না।
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});

// ফোনে নোটিফিকেশন দেখানো
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: 'একাডেমিক কেয়ার', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'একাডেমিক কেয়ার', {
    body: d.body || '', tag: d.tag || 'ac', renotify: true,
    icon: 'icon-192.png', badge: 'icon-192.png', lang: 'bn', data: { url: d.url || './' }
  }));
});
// নোটিফিকেশনে চাপলে অ্যাপ খোলে
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
    return clients.openWindow(url);
  }));
});
