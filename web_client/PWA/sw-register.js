
//Register the ServiceWorker
navigator.serviceWorker.register('sw.js', {
    scope: '*'
}).then(reg => {
    console.log('Service worker registered');
}).catch(err => {
    console.error('Error registering service worker: ' + err);
});