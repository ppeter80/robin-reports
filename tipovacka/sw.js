// Minimal service worker — enables "install as app" (PWA) without caching,
// so the app always loads the latest version (no stale content).
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => self.clients.claim());
self.addEventListener('fetch', e => { /* passthrough: browser fetches normally */ });
