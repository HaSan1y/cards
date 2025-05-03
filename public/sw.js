const PAYMENT_METHOD_IDENTIFIER = "./pay"; // Example: Use your app's payment endpoint URL

const CACHE_NAME = "my-app-cache-v1"; // Change version to force update
const urlsToCache = [
	"/", // Cache the root HTML
	"./index.html", // Explicitly cache index.html
	"./css/style.css", // Cache main stylesheet
	"./css/cardstyle.css", // Cache main stylesheet
	"./js/script.js", // Cache main script
	"./js/with-local+session.js",
	"./js/with-indexdb.js",
	"./js/client-crudfs2server.js",
	"./js/select.js",
	"./js/twitch.js",
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
				throw error;
			}),
	);
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
	console.log("Service Worker: Activating...");
	const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache version
	event.waitUntil(
		Promise.all([
			// Cache cleanup
			caches.keys().then((cacheNames) => {
				return Promise.all(
					cacheNames.map((cacheName) => {
						if (!cacheWhitelist.includes(cacheName)) {
							console.log("Service Worker: Deleting old cache:", cacheName);
							return caches.delete(cacheName);
						}
					}),
				);
			}),
			// Register Payment Instrument
			(async () => {
				if (!self.registration.paymentManager) {
					console.log("Service Worker: PaymentManager API not supported.");
					return;
				}
				try {
					await self.registration.paymentManager.instruments.set(
						// Instrument key can be anything unique
						"my-pwa-payment-instrument",
						{
							name: "Pay with My PWA Card App", // Name shown to user
							method: PAYMENT_METHOD_IDENTIFIER, // The payment method identifier it supports
							icons: [
								// Optional: Icons for the payment sheet
								{
									src: "./image/android-chrome-192x192.png",
									sizes: "192x192",
									type: "image/png",
								},
							],
						},
					);
					console.log("Service Worker: Payment instrument registered successfully.");
				} catch (error) {
					console.error("Service Worker: Failed to register payment instrument:", error);
				}
			})(),
		]).then(() => self.clients.claim()), // Take control of clients immediately
	);
});
// CanMakePayment event: Check if this SW can handle the payment method
self.addEventListener("canmakepayment", (event) => {
	console.log("Service Worker: Received canmakepayment event:", event);
	// Simple check: Does the requested method match what we registered?
	if (event.methodData && event.methodData.some((details) => details.supportedMethods === PAYMENT_METHOD_IDENTIFIER)) {
		console.log("Service Worker: Responding true to canmakepayment.");
		event.respondWith(true);
	} else {
		console.log("Service Worker: Responding false to canmakepayment.");
		event.respondWith(false);
	}
});

// PaymentRequest event: Handle the actual payment request
self.addEventListener("paymentrequest", (event) => {
	console.log("Service Worker: Received paymentrequest event:", event);

	// Respond with a promise that resolves with the payment result
	event.respondWith(
		new Promise(async (resolve, reject) => {
			try {
				// 1. Open your dedicated payment handler window/page
				const handlerUrl = `./pay.html?origin=${encodeURIComponent(event.origin)}&total=${encodeURIComponent(JSON.stringify(event.total))}&methodData=${encodeURIComponent(
					JSON.stringify(event.methodData),
				)}&paymentRequestId=${encodeURIComponent(event.paymentRequestId)}`;
				const windowClient = await self.clients.openWindow(handlerUrl);

				if (!windowClient) {
					return reject(new Error("Failed to open payment handler window."));
				}

				// 2. Listen for the result from the handler window
				const messageListener = (msgEvent) => {
					// Ensure message is from the window we opened (optional but good practice)
					if (msgEvent.source !== windowClient) return;

					console.log("Service Worker: Received message from handler window:", msgEvent.data);

					if (msgEvent.data && msgEvent.data.type === "paymentResponse") {
						// Remove the listener once we have the response
						self.removeEventListener("message", messageListener);
						// Resolve the promise with the data from the handler page
						resolve(msgEvent.data.payload);
					}
				};
				self.addEventListener("message", messageListener);
			} catch (error) {
				console.error("Service Worker: Error handling payment request:", error);
				reject(error);
			}
		}),
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
