// This is the "Offline page" service worker

const CACHE = "pwabuilder-page";

const offlineFallbackPage = "offline.html";

// Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener("install", event => {
  console.log("[PWA Builder] Install Event processing");

  event.waitUntil(
    caches.open(CACHE).then(cache => {
      console.log("[PWA Builder] Cached offline page during install");

      return cache.add(offlineFallbackPage);
    })
  );
});

// If any fetch fails, it will show the offline page.
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(err => {
      // The following validates that the request was for a navigation to a new document
      if (event.request.destination !== "document" || event.request.mode !== "navigate") {
        return;
      }

      console.error("[PWA Builder] Network request Failed. Serving offline page " + err);
      return caches.open(CACHE).then(cache => {
        return cache.match(offlineFallbackPage);
      });
    })
  );
});

// This is an event that can be fired from your page to tell the SW to update the offline page
self.addEventListener("refreshOffline", function () {
  const offlinePageRequest = new Request(offlineFallbackPage);

  return fetch(offlineFallbackPage).then(res => {
    return caches.open(CACHE).then(cache => {
      console.log("[PWA Builder] Offline page updated from refreshOffline event: " + res.url);
      return cache.put(offlinePageRequest, res);
    });
  });
});
