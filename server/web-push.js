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

    addSubscription(uuid, user, settings, res) {
        if (!subscriptions[uuid]) {
            subscriptions[uuid] = res
            subscriptions[uuid].user = user;
            subscriptions[uuid].settings = settings;
        }
    },

    deleteSubscription(uuid) {
        if (subscriptions[uuid]) {
            delete subscriptions[uuid]
        }
    },

    sendNotifiaction(subscription, message, type) {
        return webPush.sendNotification(subscription, JSON.stringify({...message, type: type}), { TTL: 60 * 60 })
    },

    updateSubscriptionSettings(user, settings) {
        for (let uuid in subscriptions) {
            if (subscriptions[uuid].user === user) {
                subscriptions[uuid].settings = settings
                webPush.sendNotification(subscriptions[uuid], JSON.stringify({settings, type: 'updateSettings'}), { TTL: 60 * 60 })
            }
        }
    }
}