const app = require('express')();
const db = new (require('./server/db'))();
const bcrypt = new (require('./server/bcrypt'))(db);
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
const js_path = web_client_path + 'js/';
const js_lib_path = js_path + 'lib/';
const css_path = web_client_path + 'css/';
const img_path = web_client_path + 'images/';

console.log('------------------------------------------');


let USER_NOT_FOUND_ERROR = new Error('User not found');
USER_NOT_FOUND_ERROR.code = 10000;
let USER_NOT_LOGGED_IN_ERROR = new Error('User not found or not logged in');
USER_NOT_LOGGED_IN_ERROR.code = 10001;
let FIELD_REQUIRED_ERROR = new Error('Fields required where left blank');
FIELD_REQUIRED_ERROR.code = 10002;
let TOKEN_INVALID_ERROR = new Error('Token was invalid');
TOKEN_INVALID_ERROR.code = 10003;

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // for parsing cookies
app.use(favicon(path.join(__dirname, '/logos/HermesMessengerLogoV2.png')));

require('./server/api')(app, db, bcrypt, utils, HA); // API Abstraction

app.get('/', function (req, res) {
    //res.cookie('hermes_style', 'dark');
    if (req.cookies.hermes_uuid) {
        res.redirect('/chat');
    } else {
        res.redirect('/login');
    }
});

app.get('/chat', function (req, res) {
    db.checkLoggedInUser(req.cookies.hermes_uuid).then(() => {
        res.sendFile(html_path + 'chat.html');
    }).catch(err => res.redirect('/login'));
});

app.get('/settings', function (req, res) {
    if (req.headers['user-agent'].indexOf('Electron') !== -1) {
        res.sendFile(html_path + 'settingsPages/electron.html');
    } else {
        res.sendFile(html_path + 'settingsPages/regular.html');
    }
});

app.get('/js/:file', function (req, res) {
    fileExists(js_path + req.params.file, function (err, exists) {
        if (exists) {
            res.sendFile(js_path + req.params.file);
        } else {
            res.sendStatus(404);
        }
    });
});

app.get('/js/lib/:file', function (req, res) {
    fileExists(js_lib_path + req.params.file, function (err, exists) {
        if (exists) {
            res.sendFile(js_lib_path + req.params.file);
        } else {
            res.sendStatus(404);
        }
    });
});

app.get('/images/:file', function (req, res) {
    fileExists(img_path + req.params.file, function (err, exists) {
        if (exists) {
            res.sendFile(img_path + req.params.file);
        } else {
            res.sendStatus(404);
        }
    });
});

app.get('/css/:file', function (req, res) {
    fileExists(css_path + req.params.file, function (err, exists) {
        if (exists) {
            res.sendFile(css_path + req.params.file);
        } else {
            res.sendStatus(404)
        }
    });
});

app.get('/css/dark/:file', function (req, res) {
    fileExists(css_path + 'dark/' + req.params.file, function (err, exists) {
        if (exists) {
            res.sendFile(css_path + 'dark/' + req.params.file);
        } else {
            res.sendStatus(404)
        }
    });
});

app.post('/logout', function (req, res) {
    if (req.body.uuid) {
        res.clearCookie('hermes_uuid');
        db.logoutUser(req.body.uuid);
        HA.logout(req.body)
        res.redirect('/');
    } else {
        // no uuid cookie
        res.redirect('/');
    }
});

app.get('/logout', function (req, res) {
    res.redirect('/chat');
});

app.get('/register', function (req, res) {
    res.redirect('/login');
});

app.post('/register', function (req, res) {
    var username = req.body.username;
    var password1 = req.body.password1;
    var password2 = req.body.password2;

    if (password1 == password2) {
        db.isntAlreadyRegistered(username).then(result => {
            if (result) {
                console.log('New user: ', username);
                bcrypt.save(username, password1).then(user_uuid => {
                    db.loginUser(username).then(session_uuid => {
                        res.cookie('hermes_uuid', session_uuid);
                        res.redirect('/chat');
                        HA.register(req.body,user_uuid,session_uuid);
                    }).catch(err => {
                        res.sendFile(html_path + 'LoginPages/FailSignup.html');
                    });
                }).catch(err => res.sendFile(html_path + 'LoginPages/FailSignup.html'))
            } else {
                res.sendFile(html_path + 'LoginPages/UserExists.html');
            }
        });
    } else {
        res.sendFile(html_path + 'LoginPages/FailSignup.html');
    };
});

app.get('/createBot', function (req, res) {
    res.sendFile(html_path + 'BotPages/CreateBot.html');
});

app.post('/createBot', function (req, res) {
    var botname = req.body.botname;
    var password1 = req.body.password1;
    var password2 = req.body.password2;

    if (password1 == password2) {
        db.isntBotAlreadyRegistered(botname).then(result => {
            if (result) {
                console.log('New bot: ', botname);
                //TODO Add bot registration
                bcrypt.saveBot(botname, password1);
                db.loginBot(botname).then(result => {
                    res.cookie('bot_uuid', result);
                    res.sendFile(html_path + 'BotPages/BotCreated.html');
                }).catch(err => {
                    res.sendFile(html_path + 'BotPages/FailSignup.html');
                });

            } else {
                res.sendFile(html_path + 'BotPages/BotExists.html');
            }
        });
    } else {
        res.sendFile(html_path + 'BotPages/FailSignup.html');
    };
});

app.get('/login', function (req, res) {
    res.sendFile(html_path + 'LoginPages/Regular.html');
});

app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    db.getPasswordHash(username).then(hash => {
        bcrypt.verifyPromise(password, hash).then(same => {
            if (same) {
                console.log(username, 'logged in.')
                db.loginUser(username).then(user_uuid => {
                    res.cookie('hermes_uuid', user_uuid);
                    res.redirect('/chat');
                    HA.login(req.body, user_uuid);
                }).catch(err => {
                    //console.log(err);
                    res.sendFile(html_path + 'LoginPages/IncorrectPassword.html');
                });
            } else {
                res.sendFile(html_path + 'LoginPages/IncorrectPassword.html')
            }
        });
    }).catch(err => res.sendFile(html_path + 'LoginPages/UserNotFound.html'));
});

app.get('/setCookie/:uuid/:theme', function (req, res) {
    db.checkLoggedInUser(req.params.uuid).then(() => {
        res.cookie('hermes_uuid', req.params.uuid);
        res.cookie('hermes_style', req.params.theme);
        res.redirect('/chat');
    }).catch(err => res.redirect('/login'));
});

app.get('/setTheme/:theme', function (req, res) {
    res.cookie('hermes_style', req.params.theme);
    res.redirect('/');
});

// For PWA
app.get('/.well-known/assetlinks.json', function (req, res) { 
    fileExists(web_client_path + 'assetLinks.json', function (err, exists) {
        if (exists) {
            res.sendFile(web_client_path + 'assetLinks.json');
        } else {
            res.sendStatus(404);
        }
    });
});

app.get('*', function (req, res) {
    res.redirect('/');
});

let server = app.listen(config.port, function () {
    console.log('listening on *:'+config.port);
    //HA.startChecking()
});

let closing = false;
function close(){
    if(!closing){
        closing = true;
        console.log('Exiting process');
        //This is so that any closing needed will be made
        console.log('------------------------------------------');
        process.exit(0);
    }
}

//catches ctrl+c event
process.on('SIGINT', close);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', close);
process.on('SIGUSR2', close);
