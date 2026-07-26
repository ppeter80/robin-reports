// Tour de Croatia — service worker (web push)
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: (e.data && e.data.text()) || 'Nová správa' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Tour de Croatia', {
    body: d.body || 'Nová správa v chate',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'tdc-chat',
    renotify: true,
    data: { url: './' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow('./');
  }));
});
