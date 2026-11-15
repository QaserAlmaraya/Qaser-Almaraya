/* Qaser Almaraya — minimal service worker.
 *
 * It exists for two reasons only: (1) phones require one before they offer
 * "add to home screen", and (2) a friendly page when there is no connection.
 *
 * It does NOT cache pages, API responses or prices. Every page still comes
 * from the network every time; the single cached file is /offline.html.
 *
 * It never touches: /admin, /staff, /api, /_next, or any non-GET request.
 * For those it returns without calling respondWith(), so the browser behaves
 * exactly as if no service worker existed.
 *
 * To ship a change: bump VERSION. The new worker activates at once and
 * deletes the old cache.
 */
const VERSION = 'v1';
const CACHE = 'qs-offline-' + VERSION;
const OFFLINE_URL = '/offline.html';
const IGNORE = ['/admin', '/staff', '/api', '/_next'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: 'reload' })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('qs-offline-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function ignored(pathname) {
  for (let i = 0; i < IGNORE.length; i++) {
    const p = IGNORE[i];
    if (pathname === p || pathname.startsWith(p + '/')) return true;
  }
  return false;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode !== 'navigate') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (ignored(url.pathname)) return;

  // Network first, nothing stored. Only when the network itself fails
  // (no connection) does the visitor get the offline page.
  event.respondWith(
    fetch(req).catch(() =>
      caches.match(OFFLINE_URL).then((r) => r || Response.error())
    )
  );
});
