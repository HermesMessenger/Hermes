import express from 'express'
import * as bcrypt from './bcrypt'
import * as db from './db'
// import * as utils from 'server/utils'
// import * as webPush from 'server/webPush'

export const router = express.Router()

router.post('/loadmessages', async function (req, res) { // TODO Document
  const user = await db.getUserForUUID(req.body.uuid)
  if (await db.isMember(user, req.body.channel)) {
    const messages = await db.get100Messages(req.body.channel, req.query.message_uuid)

    res.send(messages.reverse())
  } else res.sendStatus(403) // Forbidden
})

router.post('/login', async function (req, res) {
  const username = req.body.username
  const password = req.body.password

  const hash = await db.getPasswordHash(username)
  const same = await bcrypt.compare(password, hash)

  if (same) {
    const uuid = await db.login(username)

    res.send(uuid)
  } else res.sendStatus(400) // Bad request: either username and/or pasword are not present
})

router.post('/register', async function (req, res) {
  const username = req.body.username
  const password1 = req.body.password1
  const password2 = req.body.password2

  if (username && password1 && password2 && (password1 === password2)) {
    const exists = await db.userExists(username)

    if (!exists) {
      const hash = await bcrypt.hash(password1)
      const uuid = await db.register(username, hash)

      res.send(uuid)
    } else res.sendStatus(409) // Conflict
  } else res.sendStatus(400) // Bad Request: invalid input
})

router.post('/logout', async function (req, res) {
  await db.logout(req.body.uuid)
  res.sendStatus(200)
})

router.post('/updatePassword', async function (req, res) {
  const { oldPassword, newPassword1, newPassword2, uuid } = req.body.oldPassword

  if (newPassword1 === newPassword2) {
    const user = await db.getUserForUUID(uuid)
    const hash = await db.getPasswordHash(user)
    const ok = await bcrypt.compare(oldPassword, hash)

    if (ok) {
      const hash = await bcrypt.hash(newPassword1)
      await db.updatePasswordHash(user, hash)
      res.sendStatus(200) // Success
    } else res.sendStatus(401) // Unauthorized
  } else res.sendStatus(400) // Bad request
})

router.get('/verifyUUID/:uuid', async function (req, res) { // For Hermes Desktop
  await db.getUserForUUID(req.params.uuid)
  res.sendStatus(200)
})

/*    TODO: Replace with WebSockets
router.post('/saveSettings', async function (req, res) {
  const uuid = req.body.uuid
  const color = req.body.color
  const notifications = parseInt(req.body.notifications)
  const imageB64 = decodeURIComponent(req.body.image_b64)
  const theme = req.body.theme

  const user = await db.getUserForUUID(uuid)

  await db.saveSettings(user, color, notifications, imageB64, theme)

  res.sendStatus(200)
})

router.post('/getChannels', async function (req, res) {
  const user = await db.getUserForUUID(req.body.uuid)
  const channels = await db.getChannels(user)
  const r = []

  for (const channel of channels) {
    const p = await db.getChannelProperties(channel)
    const members: {[member: string]: { color: string image: string }} = {}

    for (const member of p.members) {
      const settings = await db.getSettings(member)

      members[member] = {
        color: '#' + settings.color,
        image: settings.image
      }
    }

    p.members = members
    r.push(p)
  }
  res.send(r)
})

router.post('/createChannel', async function (req, res) {
  if (/^\s*$/.test(req.body.name)) {
    res.sendStatus(400) // Bad request: name is whitespace

    return
  }
  const user = await db.getUserForUUID(req.body.uuid)
  const uuid = await db.createChannel(user, req.body.name)

  await db.addCreateMessage(uuid, user)
  await db.addWelcomeMessage(uuid, user)

  res.send(uuid)
})

router.post('/joinChannel', async function (req, res) {
  const user = await db.getUserForUUID(req.body.uuid)
  const exists = await db.channelExists(req.body.channel)

  if (exists) {
    await db.joinChannel(user, req.body.channel)
    db.addWelcomeMessage(req.body.channel, user)
    res.sendStatus(200)
  } else res.sendStatus(404) // Channel not found
})

router.post('/makeAdmin', async function (req, res) {
  const user = await db.getUserForUUID(req.body.uuid)
  const exists = await db.channelExists(req.body.channel)

  if (exists) {
    const admin = await db.isAdmin(user, req.body.channel)

    if (admin) {
      await db.makeAdmin(req.body.user, req.body.channel)
      await db.addPromoteMessage(req.body.channel, user, req.body.user)
      res.sendStatus(200)
    } else res.sendStatus(403) // Forbidden: user making request isn't an admin
  } else res.sendStatus(404) // Channel not found
})

router.post('/removeAdmin', async function (req, res) {
  const user = await db.getUserForUUID(req.body.uuid)
  const exists = await db.channelExists(req.body.channel)

  if (exists) {
    const admin = await db.isAdmin(user, req.body.channel)

    if (admin) {
      await db.removeAdmin(req.body.user, req.body.channel)
      await db.addDemoteMessage(req.body.channel, user, req.body.user)
      res.sendStatus(200)
    } else res.sendStatus(403) // Forbidden: user making request isn't an admin
  } else res.sendStatus(404) // Channel not found
})

router.post('/leaveChannel', async function (req, res) {
  const user = await db.getUserForUUID(req.body.uuid)

  await db.leaveChannel(user, req.body.channel)
  await db.addLeaveMessage(req.body.channel, user)
  res.sendStatus(200)
})
*/

router.get('/getSettings/:username', async function (req, res) { // Only for chat (Color & image only)
  const settings = await db.getSettings(decodeURIComponent(req.params.username))

  res.send({
    color: '#' + settings.color,
    image: settings.image
  })
})

router.post('/getSettings/', async function (req, res) {
  const user = await db.getUserForUUID(req.body.uuid)
  const settings = await db.getSettings(user)

  res.send({
    username: user,
    color: '#' + settings.color,
    notifications: settings.notifications,
    image: settings.image,
    theme: settings.theme
  })
})

router.get('/teapot', function (req, res) {
  res.status(418).render('418') // I'm a teapot
})
