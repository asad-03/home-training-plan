// Offline support: cache the app's own files; fonts are cached as they load.
const CACHE = 'htp-v2';
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png", "img/bprow-0.jpg", "img/bprow-1.jpg", "img/bridge-0.jpg", "img/bridge-1.jpg", "img/bss-0.jpg", "img/bss-1.jpg", "img/catcow-0.jpg", "img/catcow-1.jpg", "img/climber-0.jpg", "img/climber-1.jpg", "img/deadbug-0.jpg", "img/deadbug-1.jpg", "img/dips-0.jpg", "img/dips-1.jpg", "img/hipflex-0.jpg", "img/hipflex-1.jpg", "img/invrow-0.jpg", "img/invrow-1.jpg", "img/jacks-0.jpg", "img/jacks-1.jpg", "img/lunge-0.jpg", "img/lunge-1.jpg", "img/plank-0.jpg", "img/plank-1.jpg", "img/pushup-0.jpg", "img/pushup-1.jpg", "img/sqjump-0.jpg", "img/sqjump-1.jpg", "img/squat-0.jpg", "img/squat-1.jpg", "img/yraise-0.jpg", "img/yraise-1.jpg"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return; // YouTube etc. go straight to the network
  // Page itself: network first so updates show, cache when offline
  if (sameOrigin && (req.mode === 'navigate' || url.pathname.endsWith('/index.html'))) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
  })));
});
