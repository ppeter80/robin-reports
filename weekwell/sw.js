// Weekwell service worker — zámerne bez cache (živá testovacia appka, každý fetch ide na sieť).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request)); });
