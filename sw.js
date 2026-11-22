const CACHE_NAME = 'timber-measur-byAI_v7.2.1';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'sw.js',
  'icon-512.png',
  'roboflow.js',
  'model.json',
  'group1-shard1of3.bin',
  'group1-shard2of3.bin',
  'group1-shard3of3.bin'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const reqUrl = event.request.url;

  // 1. 認識モデル関連ファイル（roboflow.js / model.json / .bin）はキャッシュ優先で即座に返す
  const isModelAsset =
    reqUrl.endsWith('roboflow.js') ||
    reqUrl.endsWith('model.json') ||
    reqUrl.includes('my-first-project-bjosg/40') ||
    /group1-shard\d+of\d+\.bin/.test(reqUrl);

  if (isModelAsset) {
    event.respondWith(
      caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // 万が一URL変換前のリクエストが来た場合も model.json のキャッシュを返す
        if (reqUrl.includes('my-first-project-bjosg/40')) {
          return caches.match('model.json');
        }
        return fetch(event.request);
      })
    );
    return;
  }

  // 2. HTML等のアプリ本体はネットワーク優先（オフライン時はキャッシュを返す）
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request, { ignoreSearch: true });
    })
  );
});
