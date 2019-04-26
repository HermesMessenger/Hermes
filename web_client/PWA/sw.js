const badge = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyI+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgpMwidZAAAD10lEQVRYCbWWS6iVVRTHb1lZg9IUikC9ofZA0SKQLMgoEUIHgklBE6NSUdCkBj1wIlcKBDFTmjUQHTRwoFBEaTpI8AHhqwaFhCEmklpChlCQv9/59t+77+PoVc9d8NuPtddae+317e87Z0RXV9dtoNwF38HjsBuUO+H/1mgYGzdRVoGbyS/wDETuyGA4+lTgR4KfgXchiWxgbGUUk7i9NRqG5l5iuumOEvtR+r1Fd5p+TtHbpWKV6taHYwlhAtv6hVpc9K59DiaqdLwaIwh6Hn4wOmLZU+6HGO8Ek7gICyDSkWrkgnl6N5lSoo+krzd4lfkl0GY7PACKiXqAm5Y4P0EEg3sZ7ynRTMD12IxmvBW0+xdeh0idbHRD7lOFd/Aw+K/wbOXter3BXOZnQdtvoRsU36gk21IMtcnzvh+HC2Bg+RgiqUaStUqbIbYrY0ivbV7vSt1+mKALMTFgD3xZxj/RPwkRTxh7dc+BFdNvP+QOMexj57ytpLxvYmGglP+DMlf3IUS0t2rxc/wRaCerITKkauS5zcLLAGvjTT8NjoD6Q+BHSsntr6vxFPqjoK2XeQZEarvorvZ5XvbHwADzrq42z3NN0bu2ot+afqmGS++DdrIOcsBrJpEAiyrnjYz9KEWeZnACDOwvZzcoOUC9wWPo94G2p+AlUJJMM6vavAnfoPsP9oDOXrCZEDHR9eDa33AfKEmifzWWsaat+IiVOtGWIs6e9h/4vqVtSh3nHnSxc/lleNsBkuSbWdN60uh9M4xzEhIjPapepZn9Cb5OkUcYHAADeD/8Yt6I5Kuaj9z84jygCnk2X2HgZlP77VJfrPeqtdydStVnmCpMQmvcT8pq2wR83hr+BbOLcbrpDHy9XLdKk+F6klKPwVC/L4rDgATUpwqvMdZYPoO7oZa1TLJuaZVs1Mx621TgYVT6bC5LgybgWpIYx/hr0Ol3eBFq8SNzHg4WZbsE8hovwc5YrxT7tgm4Xj/XN5jntGY/UoMi/niJkpM2s6bNYfxT49v1B6Sa7RJuPGl1TlCr4ffBRE7DC1DLYMGis8/n2VdXuebpG5Petq7GW6hTjU8Zp7wGzIbxzCaris/qshB97IbU19UYj8cuMJFT8DxEBgv+M4velSSYPj431NfVyKUyEX8zsrk2efYPMnZ9Kyi1f6O5ibauxgT8d4Ob/Ab51jNsyURa1zY1084kUGL1Cba0bORmGyAnHcX4MhwGxfLf0iNoRamauhrd6PeASZyE2aBYGV+/bJzetY5JTmzA5WAScq70/nwruSfNrMNtXY1JxN4Cx6Gn2mfA6a8AY5q5/8ZwUCYAAAAASUVORK5CYII='
const CACHE = "cache";
let user;
let uuid;
let notifications;
let channels = {}

self.importScripts('js/utils.js'); // Import utils

async function SWloadChannels() {
    const res = await fetch('api/getChannels', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uuid })
    });

    let json = await res.json();
    channels = json
    return json
}

// Install stage sets up the offline page in the cache and opens a new cache
self.addEventListener("install", event => {
    event.waitUntil(
        caches.delete(CACHE)
    );
});

// TODO Cache messages and display them if offline

self.addEventListener('fetch', event => {
    if (event.request.method !== "GET") return; // Only process GET requests
    if (!event.request.url.match(/^.+(css|js|png)$/)) return; // Only cache CSS, JS and PNG files

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
    const promiseChain = isClientFocused().then(async isFocused => {

        const payload = event.data.json()

        switch (payload.type) {
            case 'message':

                if (isFocused)  return // Don't show a notification if the app is focused

                const sender = payload.sender
                const channel_id = payload.channel_id
                if (!(channel_id in channels)) {
                    await SWloadChannels()
                }
                const message = payload.message
                let channel

                for (c of channels) {
                    if (c.uuid === channel_id) {
                        channel = c
                        break
                    }
                }

                return self.registration.showNotification(channel.name, {
                    body: sender + ': ' + removeFormatting(message),
                    icon: 'data:image/png;base64,' + channel.icon,
                    badge: badge
                });

            case 'handshake':
                uuid = payload.uuid;
                user = payload.user;
                notifications = payload.notifications;

                await SWloadChannels()
                break;

            case 'updateSettings':
                notifications = payload.notifications;
                break;
        }
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
                return client.focus();
            }
            return clients.openWindow('https://testing.hermesmessenger.chat/');
        })
    );
})