// Weekwell service worker — zámerne bez cache (živá testovacia appka); push notifikácie (#23).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
// vlastné súbory vždy zo siete bez HTTP cache (iOS si držal starý app.js aj po novej verzii)
self.addEventListener('fetch', (e) => { const same = new URL(e.request.url).origin === self.location.origin; e.respondWith(same && e.request.method === 'GET' ? fetch(e.request, { cache: 'reload' }).catch(() => fetch(e.request)) : fetch(e.request)); });
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Weekwell', { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || 'ww', data: { url: d.url || './' }, renotify: false }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => { for (const c of cs) { if ('focus' in c) { c.navigate ? c.navigate(url) : null; return c.focus(); } } return self.clients.openWindow(url); }));
});
