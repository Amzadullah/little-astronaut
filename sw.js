// Offline cache for the app shell (AI answers still need internet).
const CACHE = 'la-v3';
const SHELL = ['/', '/index.html', '/css/style.css', '/js/app.js', '/js/i18n.js', '/js/levels.js', '/js/scenes.js', '/js/sim.js',
  '/js/store.js', '/js/advisor.js', '/js/robo.js', '/js/nasa.js', '/js/firebase-config.js', '/data/mars_sols.json', '/manifest.json', '/icons/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.hostname.includes('googleapis') || url.hostname.includes('firebase')) return;
  // network first, cache fallback (so new deploys show up right away)
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && (url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net')) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
