const app = require('express')();
const db = new (require('./server/db'))();
const bcrypt = new (require('./server/bcrypt'))(db);
const utils = require('./server/utils');
const bodyParser = require('body-parser'); // Peticiones POST
const cookieParser = require('cookie-parser'); // Cookies
const favicon = require('express-favicon'); // Favicon
const fileExists = require('file-exists');
const path = require('path');

const web_client_path = __dirname + '/web_client/';
const html_path = web_client_path + 'html/';
const js_path = web_client_path + 'js/';
const css_path = web_client_path + 'css/';

const SESSION_TIMEOUT = 60 * 60 * 24 * 7 // A week in seconds

console.log('------------------------------------------');


const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);

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
app.use(favicon(path.join(__dirname, '/logos/HermesSquare.png')));

require('./server/api')(app, db, bcrypt, utils); // API Abstraction

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
    if(req.headers['user-agent'].indexOf('Electron') !== -1){
        res.sendFile(html_path + 'settingsPages/electron.html');
    }else{
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

app.get('/css/settings.css', function (req, res) {
    if(req.headers['user-agent'].indexOf('Electron') !== -1){
        res.sendFile(css_path + 'settingsCSS/electron.css');
    }else{
        res.sendFile(css_path + 'settingsCSS/regular.css');
    }
});

app.get('/css/settings_common.css', function (req, res) {
    res.sendFile(css_path + 'settingsCSS/common.css');
});

app.get('/css/dark/settings.css', function (req, res) {
    if(req.headers['user-agent'].indexOf('Electron') !== -1){
        res.sendFile(css_path + 'dark/settingsCSS/electron.css');
    }else{
        res.sendFile(css_path + 'dark/settingsCSS/regular.css');
    }
});

app.get('/css/dark/settings_common.css', function (req, res) {
    res.sendFile(css_path + 'dark/settingsCSS/common.css');
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
            if(result){
                console.log('New user: ', username);
                bcrypt.save(username, password1);
                db.loginUser(username).then(result => {
                    res.cookie('hermes_uuid', result);
                    res.redirect('/chat');
                }).catch(err => {
                    res.sendFile(html_path + 'LoginPages/FailSignup.html');
                });
                
            }else{
                res.sendFile(html_path + 'LoginPages/UserExists.html');
            }
        });
    } else {
        res.sendFile(html_path + 'LoginPages/FailSignup.html');
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

app.get('*', function (req, res) {
    res.redirect('/');
});

app.listen(8080, function () {
    console.log('listening on *:8080');
});
