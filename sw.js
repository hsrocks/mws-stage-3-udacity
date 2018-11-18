var staticCacheName ='restaurant-app-v2';

// In the service worker lifecycle at install event , create the cache and cache the URLs
self.addEventListener('install',function(event){
	var urlsToCache = [
		'/',
		'/index.html',
		'/restaurant.html',
		'/js/dbhelper.js',
		'/sw.js',
		'/js/main.js',
		'/js/service_worker_register.js',
		'/js/restaurant_info.js',
		'/css/styles.css',
		'/manifest.json',
		'/js/idb.js',
		'http://localhost:1337/restaurants/1',
		'http://localhost:1337/restaurants/2',
		'http://localhost:1337/restaurants/3',
		'http://localhost:1337/restaurants/4',
		'http://localhost:1337/restaurants/5',
		'http://localhost:1337/restaurants/6',
		'http://localhost:1337/restaurants/7',
		'http://localhost:1337/restaurants/8',
		'http://localhost:1337/restaurants/9',
		'http://localhost:1337/restaurants/10',
		'/img/icons-192.png',
		'/img/icons-512.png',
	]
	event.waitUntil(
	    caches.open(staticCacheName)
	      .then(function(cache) {
	        console.log('Opened cache');
	        return cache.addAll(urlsToCache);
	  })
  );
})

// In case website goes offline or there is slow connectivity provide data from cache for better user experience
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request,{ignoreSearch:true})
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request)     //fetch from internet
            .then(function(res) {
              return caches.open(staticCacheName)
                .then(function(cache) {
                  cache.put(event.request.url, res.clone());    //save the response for future
                  return res;   // return the fetched data
                })
            })
      }
    )
  );
});

// In case the cache becomes active delete the previous cachess
self.addEventListener('activate',function(event){
	event.waitUntil(
			caches.keys().then(function(cacheNames){
				return Promise.all(
					cacheNames.filter(function(cacheName){
					return cacheName.startsWith('restaurant-app-')
					&& cacheName != staticCacheName
				}).map(function(cacheName){
					return caches.delete(cacheName)
				})
				)
			})
		)
})
