import express from 'express'
import { Server as WSServer } from 'ws'
import http from 'http'
import bodyParser from 'body-parser' // Peticiones POST
import cookieParser from 'cookie-parser' // Cookies
import mustache from 'mustache-express' // Templates

import * as db from './server/db'
import * as bcrypt from './server/bcrypt'
import * as webPush from './server/webPush'

import { paths, themes } from './server/constants'
import { config } from './server/utils/config'
import { router } from './server/api'

import { AnyCommand, Response, Command } from './@types/Command'
import { Connections } from './server/@types/connections'

const app = express()

// Parsers
app.set('trust proxy', true)
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cookieParser()) // for parsing cookies

// Templates
app.set('views', paths.templatePath)
app.engine('mustache', mustache(paths.templatePath))
app.set('view engine', 'mustache')
app.set('view cache', process.env.NODE_ENV === 'production') // Only cache templates in production

// API
app.use('/api', router)

// Static files
app.use('/css', express.static(paths.cssPath))
app.use('/js', express.static(paths.jsPath))
app.use('/images', express.static(paths.imgPath))
app.use('/themes', express.static(paths.themePath))

app.get('/favicon.png', function (req, res) {
  res.sendFile(paths.imgPath + 'logo.png')
})

// TODO: Remove whenever MD lib is stable
app.get('/md', function (req, res) {
  res.sendFile(paths.htmlPath + 'md.html')
})

// Routes
app.get('/', function (req, res) {
  if (req.cookies.UUID) {
    res.redirect('/chat')
  } else {
    res.redirect('/login')
  }
})

app.get('/joinChannel/:uuid', async function (req, res) {
  try {
    const user = await db.getUserForUUID(req.cookies.UUID)
    const exists = await db.channelExists(req.params.uuid)

    if (exists) {
      await db.joinChannel(user, req.params.uuid)
      await db.addWelcomeMessage(req.params.uuid, user)
      res.cookie('hermes_channel', req.params.uuid)
      res.redirect('/chat')
    }
  } catch (err) {
    console.error('ERROR:', err)
    res.redirect('/login')
  }
})

app.get('/chat', async function (req, res) {
  try {
    if (!req.cookies.UUID) res.redirect('/login')

    const user = await db.getUserForUUID(req.cookies.UUID)

    if (user) res.render('chat', { color: '#f00', user })
  } catch (err) {
    console.error('ERROR:', err)
    res.redirect('/login')
  }
})

app.get('/settings', function (req, res) {
  if (req.headers['user-agent'] && req.headers['user-agent'].includes('Electron')) {
    res.sendFile(paths.settingPath + 'electron.html')
  } else {
    res.sendFile(paths.settingPath + 'regular.html')
  }
})

app.post('/logout', async function (req, res) {
  try {
    res.clearCookie('UUID')
    await db.logout(req.body.uuid)
    res.redirect('/')
  } catch (err) {
    console.error('ERROR:', err)
    res.redirect('/') // no uuid cookie
  }
})

app.post('/register', async function (req, res) {
  try {
    const { username, password1, password2 } = req.body

    if (username && password1 && password2 && (password1 === password2)) {
      const exists = await db.userExists(username)

      if (!exists) {
        const hash = await bcrypt.hash(password1)
        const uuid = await db.register(username, hash)

        res.cookie('UUID', uuid)
        res.redirect('/chat')
      } else res.render('login', { error: 'User already exists.' })
    } else res.render('login', { error: 'Passwords do not match.' })
  } catch (err) {
    console.error('ERROR:', err)
    res.render('login', { error: 'Passwords do not match.' })
  }
})

app.get('/login', function (req, res) {
  res.render('login')
})

app.post('/login', async function (req, res) {
  try {
    const username = req.body.username
    const password = req.body.password

    const hash = await db.getPasswordHash(username)
    const same = await bcrypt.compare(password, hash)

    if (same) {
      const uuid = await db.login(username)

      res.cookie('UUID', uuid)
      res.redirect('/chat')
    } else res.render('login', { error: 'Password is incorrect.' })
  } catch (err) {
    res.render('login', { error: 'User does not exist.' })
  }
})

app.get('/setCookie/:uuid/:theme', async function (req, res) {
  try {
    const user = await db.getUserForUUID(req.params.uuid)

    if (user) {
      res.cookie('UUID', req.params.uuid)
      res.cookie('hermes_style', req.params.theme)
      res.redirect('/chat')
    }
  } catch (err) {
    console.error('ERROR:', err)
    res.redirect('/login')
  }
})

app.get('/getThemes', function (req, res) {
  res.send(themes)
})

app.get('/setTheme/:theme', function (req, res) {
  res.cookie('hermes_theme', req.params.theme)
  res.redirect('/')
})

// For PWA

app.get('/robots.txt', function (req, res) {
  res.send(
    `User-agent: *
         Disallow:`
  )
})

app.get('/vapidPublicKey', function (req, res) {
  res.send(webPush.getPubKey())
})

app.post('/registerWebPush', async function (req, res) {
  const user = await db.getUserForUUID(req.body.uuid)
  const settings = await db.getSettings(user)

  webPush.addSubscription(req.body.uuid, user, settings, req.body.subscription)
  webPush.sendNotification(req.body.subscription, { user, settings }, 'handshake')

  res.sendStatus(200)
})

app.get('/offline.html', function (req, res) {
  res.sendFile(paths.webPath + 'offline.html')
})

app.get('/manifest.json', function (req, res) {
  res.render('manifest', { url: config.mainIP })
})

app.get('/.well-known/assetlinks.json', function (req, res) {
  res.sendFile(paths.PWAPath + 'assetLinks.json')
})

app.get('/sw-register.js', function (req, res) {
  res.sendFile(paths.PWAPath + 'sw-register.js')
})

app.get('/sw.js', function (req, res) {
  res.sendFile(paths.PWAPath + 'sw.js')
})

app.get('*', function (req, res) {
  res.status(404).render('404', { path: req.url })
})

const server = http.createServer(app)
const wss = new WSServer({ server })

const connections: Connections = {}

wss.on('connection', ws => {
  let user: string
  let userUUID: string

  ws.on('message', async message => {
    const parsed = JSON.parse(message.toString()) as AnyCommand
    let error = ''

    switch (parsed.header) {
      case 'HANDSHAKE': {
        try {
          userUUID = parsed.data.uuid
          user = await db.getUserForUUID(parsed.data.uuid)

          // TODO Save the session somewhere
          const channels = await db.getChannels(user)
          for (const channel of channels) {
            if (!connections[channel]) {
              connections[channel] = {}
            }

            connections[channel][userUUID] = ws
          }
        } catch {
          error = 'Invalid UUID'
        }
        break
      } case 'SEND_MESSAGE': {
        if (await db.isMember(user, parsed.data.channel)) {
          const messageUUID = await db.addMessage(parsed.data.channel, user, parsed.data.message)

          for (const session of Object.values(connections[parsed.data.channel])) {
            session.send(JSON.stringify(Command('NEW_MESSAGE', { ...parsed.data, username: user, uuid: messageUUID })))
          }
        } else error = 'Unauthorized'

        break
      } case 'RESPONSE': {
        break
      } default: {
        console.log('Unimplemented:', parsed)

        error = `Command '${parsed.header}' not implemented`
      }
    }

    const res = Response(parsed.header, error)
    ws.send(JSON.stringify(res))
  })

  ws.on('close', async () => {
    if (userUUID) {
      const channels = await db.getChannels(user)
      for (const channel of channels) {
        delete connections[channel][userUUID]
      }
    }
  })
})

server.listen(config.port, () => {
  console.log(`Listening on *: ${config.port} `)
})

export default server
