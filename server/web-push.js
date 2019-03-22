const webPush = require('web-push')
const config = require('../config.json')

const subscriptions = {}

webPush.setVapidDetails(
    config.mainIP,
    config.webPush.publicKey,
    config.webPush.privateKey
);

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

    deleteSubscription(uuid) {
        if (subscriptions[uuid]) {
            delete subscriptions[uuid]
        }
    },

    sendNotifiaction(subscription, message) {
        return webPush.sendNotification(subscription, message, { TTL: 60 * 60 })

    }
}