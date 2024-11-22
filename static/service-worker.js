const CACHE_NAME = "my-flask-app-cache";
const urlsToCache = [
    "/",
    "/static/style.css",
    "/static/js/main.js",
    "/static/images/posturepenguinlogo.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});