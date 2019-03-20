const webPush = require('web-push')
const config = require('../config.json')

webPush.setVapidDetails(
    config.mainIP,
    config.webPush.publicKey,
    config.webPush.privateKey
);

const subscriptions = {}

module.exports = {
    getPubKey() {
        return config.webPush.publicKey
    },

    getSubscriptions() {
        return subscriptions
    },

    addSubscription(uuid, res) {
        if (!subscriptions[uuid]) {
            subscriptions[uuid] = res
        }
    },

    sendNotifiaction(subscription, message) {
        return webPush.sendNotification(subscription, message)

    }
}