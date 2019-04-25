if (navigator.serviceWorker) { // Check if browser is compatible with service workers
    if (!navigator.serviceWorker.controller) { // Check if there is an active service worker
        navigator.serviceWorker.register('sw.js') // If there isn't, register the service worker
    }
}

navigator.serviceWorker.ready.then(async reg => {
    const subscription = await reg.pushManager.getSubscription() // Check whether there is an active push subscription before creating a new one
    if (subscription) return subscription
    const key = await (await fetch('/vapidPublicKey')).text() // If there isn't, download the Web Push public key from the server

    return reg.pushManager.subscribe({ // Create a subscription using the downloaded key
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key)
    })
}).then(sub => {
    fetch('/registerWebPush', { // Send the server a POST request with the generated subscription
        method: 'post',
        headers: {
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            uuid: getCookie('hermes_uuid'), 
            subscription: sub
        })
    })
})