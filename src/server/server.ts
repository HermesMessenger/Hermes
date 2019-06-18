require('source-map-support').install()

import express from 'express'
import path from 'path'
import ws from 'ws'
import http from 'http'
import bodyParser from 'body-parser' // Peticiones POST
import cookieParser from 'cookie-parser' // Cookies
import fileExists from './utils/fileExists'
import { paths } from './constants'

import db from './db'

const app = express()

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cookieParser()) // for parsing cookies

app.get('/favicon.png', function (req, res) {
	res.sendFile(paths.imgPath + 'HermesMessengerLogoV2.png')
})

app.get('/chat/:file', async function (req, res) {
	try {
		const file = paths.chatPath + req.params.file
		const exists = await fileExists(file)
		if (exists) res.sendFile(file)
		else res.sendStatus(404)

	} catch (err) {
		console.error('ERROR:', err)
		res.sendStatus(500) // Internal Server Error
	}
})

app.get('/login/:file', async function (req, res) {
	try {
		const file = paths.loginPath + req.params.file
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

app.get('/themes/:file', async function (req, res) {
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

app.get('/joinChannel/:uuid', async function (req, res) {
	try {
		const user = await db.getUserForUUID(req.cookies.hermes_uuid)
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
		const ok = await db.checkLoggedInUser(req.cookies.hermes_uuid)
		if (ok) res.sendFile(paths.chatPath + 'chat.html')

	} catch (err) {
		console.error('ERROR:', err)
		res.redirect('/login')
	}
})

app.get('/settings', async function (req, res) {
	if (req.headers['user-agent'] && req.headers['user-agent'].indexOf('Electron') !== -1) {
		res.sendFile(paths.settingPath + 'electron.html')
	} else {
		res.sendFile(paths.settingPath + 'regular.html')
	}
})

app.post('/logout', async function (req, res) {
	try {
		res.clearCookie('hermes_uuid')
		await db.logoutUser(req.body.uuid)
		res.redirect('/')

	} catch (err) {
		console.error('ERROR:', err)
		res.redirect('/') // no uuid cookie
	}
})
/*
app.post('/register', async function (req, res) {
	try {
		const username = req.body.username
		const password1 = req.body.password1
		const password2 = req.body.password2

		if (username && password1 && password2 && (password1 === password2)) {
			const result = await db.isntAlreadyRegistered(username)

			if (result) {
				const uuid = await bcrypt.save(username, password1)
				res.cookie('hermes_uuid', uuid)
				res.redirect('/chat')

			} else res.sendFile(paths.loginPath + 'UserExists.html')

		} else res.sendFile(paths.loginPath + 'FailSignup.html')

	} catch (err) {
		console.error('ERROR:', err)
		res.sendFile(paths.loginPath + 'FailSignup.html')
	}
})

app.get('/createBot', async function (req, res) {
	res.sendFile(bot_pages_path + 'CreateBot.html')
})

app.post('/createBot', async function (req, res) {
	try {
		const botname = req.body.botname
		const password1 = req.body.password1
		const password2 = req.body.password2

		if (botname && password1 && password2 && (password1 === password2)) {
			const result = await db.isntBotAlreadyRegistered(botname)
			if (result) {
				const uuid = 1// await bcrypt.saveBot(botname, password1)
				res.cookie('bot_uuid', uuid)
				res.sendFile(bot_pages_path + 'BotCreated.html')

			} else {
				res.sendFile(bot_pages_path + 'BotExists.html')
			}
		} else res.sendFile(bot_pages_path + 'FailSignup.html')

	} catch (err) {
		console.error('ERROR:', err)
		res.sendFile(bot_pages_path + 'FailSignup.html')
	}
})
*/
app.get('/login', async function (req, res) {
	res.sendFile(paths.loginPath + 'Regular.html')
})
/*
app.post('/login', async function (req, res) {

	try {
		const username = req.body.username
		const password = req.body.password

		const hash = await db.getPasswordHash(username)
		const same = await bcrypt.verify(password, hash)

		if (same) {
			const uuid = await db.loginUser(username)
			res.cookie('hermes_uuid', uuid)
			res.redirect('/chat')
			HA.login(req.body, uuid)

		} else res.sendFile(login_pages_path + 'IncorrectPassword.html')

	} catch (err) {
		console.error('ERROR: ', err)
		res.sendFile(login_pages_path + 'UserNotFound.html')
	}
})

app.get('/setCookie/:uuid/:theme', async function (req, res) {

	try {
		const ok = await db.checkLoggedInUser(req.params.uuid)
		if (ok) {
			res.cookie('hermes_uuid', req.params.uuid)
			res.cookie('hermes_style', req.params.theme)
			res.redirect('/chat')
		}

	} catch (err) {
		console.error('ERROR:', err)
		res.redirect('/login')
	}
})

app.get('/setTheme/:theme', async function (req, res) {
	res.cookie('hermes_theme', req.params.theme)
	res.redirect('/')
})

// For PWA

app.get('/robots.txt', async function (req, res) {
	res.send(
		`User-agent: *
         Disallow:`
	)
})

app.get('/vapidPublicKey', async function (req, res) {
	res.send(webPush.getPubKey())
})

app.post('/registerWebPush', async function (req, res) {
	const user = await db.getUserForUUID(req.body.uuid)
	const settings = await db.getSetting(user)

	webPush.addSubscription(req.body.uuid, user, settings, req.body.subscription)
	webPush.sendNotifiaction(req.body.subscription, { user, settings }, 'handshake')

	res.sendStatus(200)
})

app.get('/offline.html', async function (req, res) {
	res.sendFile(html_path + 'offline.html')
})

app.get('/manifest.json', async function (req, res) {
	res.sendFile(pwa_path + 'manifest.json')
})

app.get('/.well-known/assetlinks.json', async function (req, res) {
	res.sendFile(pwa_path + 'assetLinks.json')
})

app.get('/sw-register.js', async function (req, res) {
	res.sendFile(pwa_path + 'sw-register.js')
})

app.get('/sw.js', async function (req, res) {
	res.sendFile(pwa_path + 'sw.js')
})
*/
app.get('*', async function (req, res) {
	res.redirect('/')
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
