const app = require('express')();
const db = new(require('./server/db'))();
const bcrypt = new(require('./server/bcrypt'))(db);
const webPush = require('./server/web-push');
const utils = require('./server/utils');
const bodyParser = require('body-parser'); // Peticiones POST
const cookieParser = require('cookie-parser'); // Cookies
const favicon = require('express-favicon'); // Favicon
const fileExists = require('file-exists');
const path = require('path');
const HA = require('./server/HA/highAvailability.js');
const config = require('./config.json');

const web_client_path = __dirname + '/web_client/';
const html_path = web_client_path + 'html/';
const login_pages_path = html_path + 'LoginPages/'
const bot_pages_path = html_path + 'BotPages/'
const js_path = web_client_path + 'js/';
const js_lib_path = js_path + 'lib/';
const css_path = web_client_path + 'css/';
const theme_path = css_path + 'themes/';
const img_path = web_client_path + 'images/';
const pwa_path = web_client_path + 'PWA/';

let USER_NOT_FOUND_ERROR = new Error('User not found');
USER_NOT_FOUND_ERROR.code = 10000;
let USER_NOT_LOGGED_IN_ERROR = new Error('User not found or not logged in');
USER_NOT_LOGGED_IN_ERROR.code = 10001;
let FIELD_REQUIRED_ERROR = new Error('Fields required where left blank');
FIELD_REQUIRED_ERROR.code = 10002;
let TOKEN_INVALID_ERROR = new Error('Token was invalid');
TOKEN_INVALID_ERROR.code = 10003;

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // for parsing cookies
app.use(favicon(path.join(__dirname, '/logos/HermesMessengerLogoV2.png')));

require('./server/api')(app, db, bcrypt, webPush, utils, HA); // API Abstraction

console.log('------------------------------------------');

app.get('/js/:file', async function (req, res) {
    try {
        const file = js_path + req.params.file
        const exists = await fileExists(file)
        if (exists) res.sendFile(file);
        else res.sendStatus(404)

    } catch (err) {
        console.error('ERROR:', err);
        res.sendStatus(500); // Internal Server Error
    };
});

app.get('/js/lib/:file', async function (req, res) {
    try {
        const file = js_lib_path + req.params.file
        const exists = await fileExists(file)
        if (exists) res.sendFile(file);
        else res.sendStatus(404)

    } catch (err) {
        console.error('ERROR:', err);
        res.sendStatus(500); // Internal Server Error
    };
});

app.get('/images/:file', async function (req, res) {
    try {
        const file = img_path + req.params.file
        const exists = await fileExists(file)
        if (exists) res.sendFile(file);
        else res.sendStatus(404)

    } catch (err) {
        console.error('ERROR:', err);
        res.sendStatus(500); // Internal Server Error
    };
});

app.get('/css/:file', async function (req, res) {
    try {
        const file = css_path + req.params.file
        const exists = await fileExists(file)
        if (exists) res.sendFile(file);
        else res.sendStatus(404)

    } catch (err) {
        console.error('ERROR:', err);
        res.sendStatus(500); // Internal Server Error
    };
});

app.get('/css/themes/:file', async function (req, res) {
    try {
        const file = theme_path + req.params.file
        const exists = await fileExists(file)
        if (exists) res.sendFile(file);
        else res.sendStatus(404)

    } catch (err) {
        console.error('ERROR:', err);
        res.sendStatus(500); // Internal Server Error
    };
});

app.get('/', async function (req, res) {
    if (req.cookies.hermes_uuid) {
        res.redirect('/chat');
    } else {
        res.redirect('/login');
    }
});

app.get('/joinChannel/:uuid', async function (req, res) {
    try {
        const user = await db.getUserForUUID(req.cookies.hermes_uuid)
        const exists = await db.channelExists(req.params.uuid)

        if (exists) {
            await db.joinChannel(user, req.params.uuid)
            db.addWelcomeMessage(req.params.uuid, user);
            res.redirect('/chat');
        }

    } catch (err) {
        console.error('ERROR:', err);
        res.redirect('/login')
    }
});

app.get('/chat', async function (req, res) {
    try {
        const ok = await db.checkLoggedInUser(req.cookies.hermes_uuid)
        if (ok) res.sendFile(html_path + 'chat.html');

    } catch (err) {
        console.error('ERROR:', err);
        res.redirect('/login')
    }
});

app.get('/settings', async function (req, res) {
    if (req.headers['user-agent'].indexOf('Electron') !== -1) {
        res.sendFile(html_path + 'settingsPages/electron.html');
    } else {
        res.sendFile(html_path + 'settingsPages/regular.html');
    }
});

app.post('/logout', async function (req, res) {
    try {
        res.clearCookie('hermes_uuid');
        db.logoutUser(req.body.uuid);
        HA.logout(req.body)
        res.redirect('/');

    } catch (err) {
        console.error('ERROR:', err);
        res.redirect('/'); // no uuid cookie
    }
});

app.post('/register', async function (req, res) {
    try {
        const username = req.body.username;
        const password1 = req.body.password1;
        const password2 = req.body.password2;

        if (username && password1 && password2 && (password1 === password2)) {
            const result = await db.isntAlreadyRegistered(username)

            if (result) {
                const uuid = await bcrypt.save(username, password1)
                res.cookie('hermes_uuid', uuid);
                res.redirect('/chat');
                HA.register(req.body, uuid);

            } else res.sendFile(login_pages_path + 'UserExists.html');

        } else res.sendFile(login_pages_path + 'FailSignup.html');

    } catch (err) {
        console.error('ERROR:', err);
        res.sendFile(login_pages_path + 'FailSignup.html');
    }
});

app.get('/createBot', async function (req, res) {
    res.sendFile(bot_pages_path + 'CreateBot.html');
});

app.post('/createBot', async function (req, res) {
    try {
        const botname = req.body.botname;
        const password1 = req.body.password1;
        const password2 = req.body.password2;

        if (botname && password1 && password2 && (password1 === password2)) {
            const result = await db.isntBotAlreadyRegistered(botname)
            if (result) {
                const uuid = await bcrypt.saveBot(botname, password1);
                res.cookie('bot_uuid', uuid);
                res.sendFile(bot_pages_path + 'BotCreated.html');

            } else {
                res.sendFile(bot_pages_path + 'BotExists.html');
            }
        } else res.sendFile(bot_pages_path + 'FailSignup.html');

    } catch (err) {
        console.error('ERROR:', err);
        res.sendFile(bot_pages_path + 'FailSignup.html');
    }
});

app.get('/login', async function (req, res) {
    res.sendFile(login_pages_path + 'Regular.html');
});

app.post('/login', async function (req, res) {

    try {
        const username = req.body.username;
        const password = req.body.password;

        const hash = await db.getPasswordHash(username)
        const same = await bcrypt.verifyPromise(password, hash)

        if (same) {
            const uuid = await db.loginUser(username)
            res.cookie('hermes_uuid', uuid);
            res.redirect('/chat');
            HA.login(req.body, uuid);

        } else res.sendFile(login_pages_path + 'IncorrectPassword.html');

    } catch (err) {
        console.error('ERROR: ', err);
        res.sendFile(login_pages_path + 'UserNotFound.html');
    };
});

app.get('/setCookie/:uuid/:theme', async function (req, res) {

    try {
        const ok = await db.checkLoggedInUser(req.params.uuid)
        if (ok) {
            res.cookie('hermes_uuid', req.params.uuid);
            res.cookie('hermes_style', req.params.theme);
            res.redirect('/chat');
        }

    } catch (err) {
        console.error('ERROR:', err);
        res.redirect('/login')
    }
});

app.get('/setTheme/:theme', async function (req, res) {
    res.cookie('hermes_theme', req.params.theme);
    res.redirect('/');
});

// For PWA

app.get('/robots.txt', async function (req, res) {
    res.send(
        `User-agent: *
         Disallow:`
    );
});

app.get('/vapidPublicKey', async function (req, res) {
    res.send(webPush.getPubKey());
});

app.post('/registerWebPush', async function (req, res) {
    webPush.addSubscription(req.body.uuid, req.body.subscription)
    res.sendStatus(200);
});

app.get('/offline.html', async function (req, res) {
    res.sendFile(html_path + 'offline.html');
});

app.get('/manifest.json', async function (req, res) {
    res.sendFile(pwa_path + 'manifest.json');
});

app.get('/.well-known/assetlinks.json', async function (req, res) {
    res.sendFile(pwa_path + 'assetLinks.json');
});

app.get('/sw-register.js', async function (req, res) {
    res.sendFile(pwa_path + 'sw-register.js');
});

app.get('/sw.js', async function (req, res) {
    res.sendFile(pwa_path + 'sw.js');
});

app.get('*', async function (req, res) {
    res.redirect('/');
});

let server = app.listen(config.port, function () {
    console.log('listening on *:' + config.port);
});

let closing = false;

function close() {
    if (!closing) {
        closing = true;
        console.log('Exiting process');
        // This is so that any closing needed will be made
        console.log('------------------------------------------');
        process.exit(0);
    }
}

// catches ctrl+c event
process.on('SIGINT', close);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', close);
process.on('SIGUSR2', close);