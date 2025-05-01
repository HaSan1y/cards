const CACHE_NAME = "my-app-cache-v1"; // Change version to force update
const urlsToCache = [
	"/", // Cache the root HTML
	"/index.html", // Explicitly cache index.html
	"/css/style.css", // Cache main stylesheet
	"/css/cardstyle.css", // Cache main stylesheet
	"/js/script.js", // Cache main script
	"/js/with-local+session.js",
	"/js/with-indexdb.js",
	"/js/client-crudfs2server.js",
	"/js/select.js",
	"/js/twitch.js",
	// Add other essential assets like icons, fonts, or critical images
	// "/images/logo.png",
];

// Install event: Cache core assets
self.addEventListener("install", (event) => {
	console.log("Service Worker: Installing...");
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				console.log("Service Worker: Caching app shell");
				return cache.addAll(urlsToCache);
			})
			.then(() => {
				console.log("Service Worker: Install completed, skipping waiting.");
				// Force the waiting service worker to become the active service worker.
				return self.skipWaiting();
			})
			.catch((error) => {
				console.error("Service Worker: Caching failed", error);
			}),
	);
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
	console.log("Service Worker: Activating...");
	const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache version
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (!cacheWhitelist.includes(cacheName)) {
							console.log("Service Worker: Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}
					}),
				);
			})
			.then(() => self.clients.claim()), // Take control of clients immediately
	);
});

// Fetch event: Serve from cache first, then network
self.addEventListener("fetch", (event) => {
	// console.log('Service Worker: Fetching', event.request.url);
	event.respondWith(
		caches.match(event.request).then((response) => {
			// Cache hit - return response
			if (response) {
				// console.log('Service Worker: Serving from cache:', event.request.url);
				return response;
			}
			// Not in cache - fetch from network
			// console.log('Service Worker: Fetching from network:', event.request.url);
			return fetch(event.request);
		}),
	);
});
