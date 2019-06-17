require('source-map-support').install()

import express from 'express'
import path from 'path'
import ws from 'ws'
import http from 'http'
import bodyParser from 'body-parser' // Peticiones POST
import cookieParser from 'cookie-parser' // Cookies
import fileExists from './utils/fileExists'
import { paths } from './constants'

const app = express()

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cookieParser()) // for parsing cookies

app.get('/favicon.png', function (req, res) {
  res.sendFile(paths.imgPath + 'HermesMessengerLogoV2.png')
})

app.get('/js/:file', async function (req, res) {
  try {
    const file = paths.jsPath + req.params.file
    const exists = await fileExists(file)
    if (exists) res.sendFile(file)
    else res.sendStatus(404)

  } catch (err) {
    console.error('ERROR:', err)
    res.sendStatus(500) // Internal Server Error
  }
})

app.get('/js/lib/:file', async function (req, res) {
  try {
    const file = paths.jsLibPath + req.params.file
    const exists = await fileExists(file)
    if (exists) res.sendFile(file)
    else res.sendStatus(404)

  } catch (err) {
    console.error('ERROR:', err)
    res.sendStatus(500) // Internal Server Error
  }
})

app.get('/images/:file', async function (req, res) {
  try {
    const file = paths.imgPath + req.params.file
    const exists = await fileExists(file)
    if (exists) res.sendFile(file)
    else res.sendStatus(404)

  } catch (err) {
    console.error('ERROR:', err)
    res.sendStatus(500) // Internal Server Error
  }
})

app.get('/css/:file', async function (req, res) {
  try {
    const file = paths.cssPath + req.params.file
    const exists = await fileExists(file)
    if (exists) res.sendFile(file)
    else res.sendStatus(404)

  } catch (err) {
    console.error('ERROR:', err)
    res.sendStatus(500) // Internal Server Error
  }
})

app.get('/css/themes/:file', async function (req, res) {
  try {
    const file = paths.themePath + req.params.file
    const exists = await fileExists(file)
    if (exists) res.sendFile(file)
    else res.sendStatus(404)

  } catch (err) {
    console.error('ERROR:', err)
    res.sendStatus(500) // Internal Server Error
  }
})

app.get('/', async function (req, res) {
  if (req.cookies.hermes_uuid) {
    res.redirect('/chat')
  } else {
    res.redirect('/login')
  }
})

const server = http.createServer(app)
const wss = new ws.Server({ server })
wss.on('connection', ws => {
  ws.send('HELLO THERE')
  ws.on('message', message => {
    console.log(message)
  })
})

server.listen(8080, () => {
  console.log('Listening on *:8080')
})
