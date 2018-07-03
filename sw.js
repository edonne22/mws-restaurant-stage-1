var CACHE_NAME = 'restaurant-reviews-cache-v1';
var urlsToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/manifest.json',
  '/css/styles.css',
  '/css/responsive.css',
  '/img/1_1x.jpg',
  '/img/1_2x.jpg',
  '/img/2_1x.jpg',
  '/img/2_2x.jpg',
  '/img/3_1x.jpg',
  '/img/3_2x.jpg',
  '/img/4_1x.jpg',
  '/img/4_2x.jpg',
  '/img/5_1x.jpg',
  '/img/5_2x.jpg',
  '/img/6_1x.jpg',
  '/img/6_2x.jpg',
  '/img/7_1x.jpg',
  '/img/7_2x.jpg',
  '/img/8_1x.jpg',
  '/img/8_2x.jpg',
  '/img/9_1x.jpg',
  '/img/9_2x.jpg',
  '/img/10_1x.jpg',
  '/img/10_2x.jpg',
  '/img/icons/icon48.jpg',
  '/img/icons/icon96.jpg',
  '/img/icons/icon192.jpg',
  '/img/icons/icon512.jpg',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js'
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
      .then((cached) => {
        var networked = fetch(event.request)
          .then((response) => {
            let cacheCopy = response.clone()
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, cacheCopy))
            return response;
          })
          .catch(() => caches.match(offlinePage));
        return cached || networked;
      })
    )
  }
  return;
});