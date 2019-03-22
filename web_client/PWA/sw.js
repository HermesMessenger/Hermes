const CACHE = "cache";
const offlinePage = "offline.html";

// Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => {
            return cache.add(offlinePage);
        })
    );
});

// TODO Replace offline page with cached version of the messages

// If any fetch fails, it will show the offline page.
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        fetch(event.request).catch(async err => {
            // The following validates that the request was for a navigation to a new document
            if (event.request.destination !== "document" || event.request.mode !== "navigate") {
                return;
            }

            const cache = await caches.open(CACHE);
            return cache.match(offlinePage);
        })
    );
});

// This is an event that can be fired from your page to tell the SW to update the offline page
self.addEventListener("refreshOffline", async function () {
    const offlinePageRequest = new Request(offlinePage);

    const res = await fetch(offlinePage);
    const cache = await caches.open(CACHE);

    return cache.put(offlinePageRequest, res);
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


// ---------------------
//       Functions
// ---------------------

function isClientFocused() {
    return clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(res => {
        let clientIsFocused = false;

        for (let i = 0; i < res.length; i++) {
            const windowClient = res[i];
            if (windowClient.focused) {
                clientIsFocused = true;
                break;
            }
        }

        return clientIsFocused;
    });
}

const quoteREGEX = /"(message-([0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}))"/
function removeFormatting(message) {
    return message
        .replace(quoteREGEX, '')
        .replace(/(\*\*(.+?)\*\*)/g, '$2')
        .replace(/(\*(.+?)\*)/g, '$2')
        .replace(/(?:[^*]|^)(\*([^*](?:.*?[^*])?)\*)(?:[^*]|$)/g, '$2')
        .replace(/~(.+?)~/g, '$1')
        .replace(/\[(.+?)\]\(((?:http:\/\/|https:\/\/).+?)\)/g, '$1')
        .replace(/`(.+?)`/g, '$1')
}

