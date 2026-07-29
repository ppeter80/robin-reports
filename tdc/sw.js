// Tour de Croatia — service worker (web push)
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const SB = 'https://lultodbmyhawlpfgfhmg.supabase.co';
const KEY = 'sb_publishable_c5ke1M0NDYzff_s7miJAHg_tFNM-Cn3';

// edge funkcia posiela len text, takze ciel odvodime z neho — netreba ju prerabat
function targetFor(body) {
  const b = (body || '').toLowerCase();
  if (b.indexOf('🏆') >= 0 || b.indexOf('výsledky') >= 0 || b.indexOf('uzavrel') >= 0) return 'lead';
  if (b.indexOf('🎯') >= 0 || b.indexOf('🍺') >= 0 || b.indexOf('súťaž') >= 0) return 'comps';
  if (b.indexOf('👥') >= 0 || b.indexOf('tím') >= 0 || b.indexOf('založil') >= 0) return 'teams';
  return 'chat';
}

// pri sprave si dotiahneme jej id, aby sa dalo skocit presne na nu
async function lastMsgId() {
  try {
    const r = await fetch(SB + '/rest/v1/tdc_messages?select=id&order=created_at.desc&limit=1',
      { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } });
    const j = await r.json();
    return (j && j[0] && j[0].id) || null;
  } catch (_) { return null; }
}

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: (e.data && e.data.text()) || 'Nová správa' }; }
  e.waitUntil((async () => {
    const go = targetFor(d.body);
    const m = go === 'chat' ? await lastMsgId() : null;
    await self.registration.showNotification(d.title || 'Tour de Croatia', {
      body: d.body || 'Nová správa v chate',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: 'tdc-' + go,
      renotify: true,
      data: { go, m }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const t = e.notification.data || {};
  const go = t.go || 'chat', m = t.m || null;
  const url = './?go=' + go + (m ? '&m=' + m : '');
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // otvorenu appku len prepneme (bez reloadu), inak otvorime novu s cielom v adrese
    for (const c of cs) {
      if (c.url.indexOf('/tdc') >= 0) {
        try { c.postMessage({ tdc: { go, m } }); } catch (_) {}
        if ('focus' in c) return c.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
