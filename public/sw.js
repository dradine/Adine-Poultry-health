const CACHE_NAME = 'adine-vaccine-timing-v6';
const APP_ROOT = new URL('./', self.registration.scope).toString();
const MANIFEST_URL = new URL('manifest.webmanifest', self.registration.scope).toString();
const ICON_URL = new URL('icon.svg', self.registration.scope).toString();

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const page = await fetch(APP_ROOT);
    await cache.put(APP_ROOT, page.clone());
    const html = await page.text();
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
    await Promise.all(assets.map(async (asset) => {
      try {
        const response = await fetch(asset);
        if (response.ok) await cache.put(asset, response);
      } catch { /* First online load can retry asset caching. */ }
    }));
    await cache.addAll([MANIFEST_URL, ICON_URL]);
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('adine-vaccine-timing-') && key !== CACHE_NAME).map((key) => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(APP_ROOT, copy));
      return response;
    }).catch(async () => (await caches.match(request)) || caches.match(APP_ROOT)));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});
