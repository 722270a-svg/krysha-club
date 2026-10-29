const CACHE='krysha-public-v4';const ASSETS=['./','./index.html','./manifest.webmanifest','./krysha-icon-180.png','./krysha-icon-192.png','./krysha-icon-512.png','./app.html'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)))});
/* Web Push receiver: a secure sender and opted-in subscriptions are still required. */
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data = {};
    try { data = event.data ? event.data.json() : {}; } catch (_) { data = {body: event.data ? event.data.text() : ''}; }
    const count = Number(data.unreadCount);
    const options = {
      body: String(data.body || 'Новое сообщение от клуба «Крыша»'),
      icon: './krysha-icon-192.png',
      badge: './krysha-icon-192.png',
      tag: String(data.tag || 'krysha-message'),
      data: {url: './app.html', ...(data.data || {})}
    };
    if (Number.isFinite(count) && count >= 0 && self.navigator && 'setAppBadge' in self.navigator) {
      try {if (count === 0) await self.navigator.clearAppBadge(); else await self.navigator.setAppBadge(count);} catch (_) {}
    }
    await self.registration.showNotification(String(data.title || 'КРЫША · Якутск'), options);
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = new URL('./app.html', self.registration.scope).href;
    const windows = await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing = windows.find(client => client.url.startsWith(self.registration.scope));
    if(existing){await existing.focus();return;}
    await self.clients.openWindow(url);
  })());
});
