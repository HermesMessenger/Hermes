const app = require('express')();
const db = new (require('./server/db'))();
const bcrypt = new (require('./server/bcrypt'))(db);
const utils = require('./server/utils');
const bodyParser = require('body-parser'); // Peticiones POST
const cookieParser = require('cookie-parser'); // Cookies
const favicon = require('express-favicon'); // Favicon
const fileExists = require('file-exists');
const path = require('path');

require('./server/api')(app, db, bcrypt, utils); // API Abstraction

const web_client_path = __dirname + '/web_client/';
const html_path = web_client_path + 'html/';
const js_path = web_client_path + 'js/';
const css_path = web_client_path + 'css/';

const SESSION_TIMEOUT = 60 * 60 * 24 * 7 // A week in seconds

console.log('------------------------------------------');


const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // for parsing cookies
app.use(favicon(path.join(__dirname, '/logos/HermesSquare.png')));

app.post('/', function (req, res) {
    console.log('COOKIES:', req.cookies);
    //res.cookie('hermes_username', req.body.username);
    res.cookie('hermes_uuid', req.body.uuid);
    res.redirect('/chat');
});

app.get('/', function (req, res) {
    if (req.cookies.uuid) {
        res.redirect('/chat');
    } else {
        res.redirect('/login');
    }
});

app.get('/chat', function (req, res) {
    res.sendFile(html_path + 'index.html');
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

app.get('/css/:file', function (req, res) {
    fileExists(css_path + req.params.file, function (err, exists) {
        if (exists) {
            res.sendFile(css_path + req.params.file);
        } else {
            res.sendStatus(404)
        }
    });
});

app.get('/clearMessages/:token', function (req, res) {
    db.checkToken(req.params.token).then(() => {
        db.clear('messages');
        res.redirect('/');
        console.log('Cleared messages');
    }).catch(err => res.sendStatus(403));
});

app.get('/clearUsers/:token', function (req, res) {
    db.checkToken(req.params.token).then(() => {
        db.clear('users');
        db.clear('settings');
        res.redirect('/');
        console.log('Cleared users.');
    }).catch(err => res.sendStatus(403));
});

app.get('/clearSessions/:token', function (req, res) {
    db.checkToken(req.params.token).then(() => {
        db.clear('sessions');
        res.redirect('/');
        console.log('Cleared logged in users.');
    }).catch(err => res.sendStatus(403));
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

    if (password1 == password2) {//FIXME: Update
        db.getFromList("users", async function (err, result) {
            var i = 0;
            for (value of result) {
                login = value.split(SEPCHAR);

                if (login[0] == username) {
                    var exists = true;
                    res.sendFile(html_path + 'LoginPages/UserExists.html');
                } else i++;
            }

            if (!exists) { // User doesn't exist
                console.log('New user: ', username);
                bcrypt.save(username, password1);
                res.cookie('hermes_username', username);
                res.cookie('hermes_uuid', db.logInUser(username)); // KEPT FOR LEGACY PURPOSES
                res.redirect('/chat');
            }
        });
    }

    else {
        res.sendFile(html_path + 'LoginPages/FailSignup.html');
    };
});

app.get('/login', function (req, res) {
    res.sendFile(html_path + 'LoginPages/Regular.html');
});

app.post('/login', function (req, res) { // FIXME: update
    var username = req.body.username;
    var password = req.body.password;
    var redirected = false;
    db.getFromList("users", async function (err, result) {
        for (value of result) {
            login = value.split(SEPCHAR);

            if (login[0] == username) {
                let same = await bcrypt.verify(password, login[1]);

                if (same) {
                    console.log(username, 'logged in.')
                    let user_uuid = db.logInUser(username);
                    res.cookie('hermes_username', username); // FIXME: remove; kept for legacy purposes
                    res.cookie('hermes_uuid', user_uuid);
                    res.redirect('/chat');
                    redirected = true;
                } else {
                    res.sendFile(html_path + 'LoginPages/IncorrectPassword.html')
                    redirected = true;
                }
            }
        }
        if (!redirected) {
            res.sendFile(html_path + 'LoginPages/UserNotFound.html');
        }

    });

});

app.get('*', function (req, res) {
    res.redirect('/');
});

app.listen(8080, function () {
    console.log('listening on *:8080');
});

const login_cleanup_interval = setInterval(function(){
    db.checkExpriation(SESSION_TIMEOUT, function(removed_sessions){ // FIXME: update
        console.log('Cleaned up ' + removed_sessions + ' session(s) from the db');
    });
},1000*60*60);
