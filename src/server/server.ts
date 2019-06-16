require('source-map-support').install()
console.log('Started index.ts')

import express from 'express'
import path from 'path'
import ws from 'ws'
import http from 'http'

let app = express()

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.html'))
})

app.get('/index.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.js'))
})

app.get('/index.css', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.css'))
})

let server = http.createServer(app)

let wss = new ws.Server({ server })
wss.on('connection', ws => {
  ws.send('HELLO THERE')
  ws.on('message', message => {
    console.log(message)
  })
})

server.listen(8080, () => {
  console.log('Listening on *:8080')
})
