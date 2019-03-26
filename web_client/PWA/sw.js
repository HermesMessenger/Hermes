const CACHE = "cache";
const offlinePage = "offline.html";

self.importScripts('js/utils.js'); // Import utils

// Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => {
            return cache.add(offlinePage);
        })
    );
});

// TODO Cache messages and display them if offline

self.addEventListener('fetch', event => {
    if (event.request.method !== "GET") return; // Only process GET requests
    if (!event.request.url.endsWith(".css")|| 
        !event.request.url.endsWith(".js") || 
        !event.request.url.endsWith(".png")) return; // Only cache CSS, JS and PNG files

    if (event.request.url.contains("api/")) return; // Ignore caching API requests

    event.respondWith(
        caches.open(CACHE).then(async cache => {
            return cache.match(event.request).then(res => {
                return res || fetch(event.request).then(res => {
                    cache.put(event.request, res.clone());
                    return res;
                })
            });
        })
    );
});

self.addEventListener("push", event => {
    const promiseChain = isClientFocused().then(isFocused => {
        if (isFocused) {
            return // Don't show a notification if the app is focused
        }

        const payload = event.data.json()
        const sender = payload.sender
        const message = payload.message

        // TODO Check if message sender is the same as current user
        return self.registration.showNotification('New message from ' + sender, {
            body: removeFormatting(message)
            // TODO Show user's profile picture
        })
    });

    event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: "window"
        }).then(clientList => {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url == '/' && 'focus' in client)
                    return client.focus();
            }
            if (clients.openWindow) {
                return clients.openWindow('https://testing.hermesmessenger.chat/');
            }
        })
    );
});