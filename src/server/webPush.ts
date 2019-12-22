import webPush from 'web-push'
import { config } from './utils/config'
import { Settings, Channel } from './db'

interface Subscription extends webPush.PushSubscription {
  user: string;
  settings: Settings;
}

type Subscriptions = { [key: string]: Subscription }

interface PushMessage {
  user?: string;
  sender?: string;
  message?: string;
  channel?: Channel;
  settings: Settings;
}

const subscriptions: Subscriptions = {}

webPush.setVapidDetails(
  config.mainIP,
  config.webPush.publicKey,
  config.webPush.privateKey
)

export function getPubKey (): string {
  return config.webPush.publicKey
}

export function getSubscriptions (): Subscriptions {
  return subscriptions
}

export function addSubscription (uuid: string, user: string, settings: Settings, sub: webPush.PushSubscription): void {
  if (!subscriptions[uuid]) {
    subscriptions[uuid] = { ...sub, user, settings }
  }
}

export function deleteSubscription (uuid: string): void {
  if (subscriptions[uuid]) {
    delete subscriptions[uuid]
  }
}

export function sendNotification (subscription: webPush.PushSubscription, message: PushMessage, type: string): Promise<webPush.SendResult> {
  return webPush.sendNotification(subscription, JSON.stringify({ ...message, type: type }), { TTL: 60 * 60 })
}

export function updateSubscriptionSettings (user: string, settings: Settings): void {
  for (const uuid in subscriptions) {
    if (subscriptions[uuid].user === user) {
      subscriptions[uuid].settings = settings
      webPush.sendNotification(subscriptions[uuid], JSON.stringify({ settings, type: 'updateSettings' }), { TTL: 60 * 60 })
    }
  }
}
