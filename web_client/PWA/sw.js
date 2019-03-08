//Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener('install', event => {
    var offlinePage = new Request('offline.html');
    event.waitUntil(
        fetch(offlinePage).then(async res => {
            const cache = await caches.open('pwabuilder-offline');
            console.log('[PWA Builder] Cached offline page during Install' + res.url);
            return cache.put(offlinePage, res);
        }));
});

//If any fetch fails, it will show the offline page.
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request).catch(async err => {
            console.error('[PWA Builder] Network request Failed. Serving offline page ' + err);
            const cache = await caches.open('pwabuilder-offline');
            return cache.match('offline.html');
        }));
});

//This is a event that can be fired from your page to tell the SW to update the offline page
self.addEventListener('refreshOffline', async res => {
    const cache = await caches.open('pwabuilder-offline');
    console.log('[PWA Builder] Offline page updated from refreshOffline event: ' + res.url);
    return cache.put(offlinePage, res);
});