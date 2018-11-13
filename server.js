const app = require('express')();
const DB = require('./server/db');
const BCRYPT = require('./server/bcrypt');
const utils = require('./server/utils');
const bodyParser = require('body-parser'); // Peticiones POST
const cookieParser = require('cookie-parser'); // Cookies
const favicon = require('express-favicon'); // Favicon
const path = require('path');

const web_client_path = __dirname + '/web_client/';

const html_path = web_client_path+'html/';

const js_path = web_client_path+'js/';
const css_path = web_client_path+'css/';

let db = new DB();
console.log('------------------------------------------');

let bcrypt = new BCRYPT(db);

const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // for parsing cookies
app.use(favicon(path.join(__dirname, '/logos/HermesSquare.png')));

app.post('/', function(req, res){
    console.log('COOKIES:', req.cookies);
    //res.cookie('hermes_username', req.body.username);
    res.cookie('hermes_uuid', req.body.uuid);
    res.redirect('/chat');
});

app.get('/', function(req, res){
    if (req.cookies.uuid) {
        res.redirect('/chat');
    }else {
        res.redirect('/login');
    }
});

app.get('/chat', function(req, res){
    res.sendFile(html_path + 'index.html');
});

app.get('/js/:file', function(req, res){
    res.sendFile(js_path + req.params.file);
});

app.get('/css/:file', function(req, res){
    res.sendFile(css_path + req.params.file);
});

app.get('/clearMessages', function(req, res){
    db.clear('messages');
    res.redirect('/');
    console.log('Cleared messages');
});

app.get('/clearUsers', function(req, res){
    db.clear('users');
    res.redirect('/');
    console.log('Cleared users.');
});

app.get('/clearLoggedInUsers', function(req, res){
    db.clear('logged_in_users');
    res.redirect('/');
    console.log('Cleared logged in users.');
});

app.post('/logout', function(req, res){
    if(req.body.uuid){
        db.getLoggedInUserFromUUID(req.body.uuid, function(user, ok){
            if(ok){
                console.log(user + ' logged out');
                res.clearCookie('hermes_username'); // TODO: remove; kept for legacy purposes
                res.clearCookie('hermes_uuid');
                db.logoutUUID(req.body.uuid);
                res.redirect('/');
            }else{
                res.redirect('/chat');
            }
        });
    }else{
        res.redirect('/chat');
    }
});

app.get('/logout', function(req, res){
    res.redirect('/chat');
});

app.get('/register', function(req, res){
    res.redirect('/login');
});

app.post('/register', function(req, res){
    var username=req.body.username;
    var password1=req.body.password1;
    var password2=req.body.password2;

    if (password1 == password2) {
        db.getFromList("users", async function(err, result) {
            var i = 0;
            for (value of result) {
                login = value.split(SEPCHAR);

                if (login[0] == username) {
                    var exists = true;
                    res.sendFile(html_path + 'LoginPages/UserExists.html');
                } else i++;
            }

            if (!exists) { // User doesn't exist
                console.log('New user: ',username);
                bcrypt.save(username, password1);
                res.cookie('hermes_username', username);
                res.redirect('/chat');
            }
        });
    }

    else {
        res.sendFile(html_path + 'LoginPages/FailSignup.html');
    };
});

app.get('/login', function(req, res){
    res.sendFile(html_path + 'LoginPages/Regular.html');
});

app.post('/login', function(req, res){
    var username=req.body.username;
    var password=req.body.password;
    var redirected = false;
    db.getFromList("users", async function(err, result) {
        for(value of result){
            login=value.split(SEPCHAR);

            if (login[0] == username) {
                let same = await bcrypt.verify(password, login[1]);

                if (same){
                    console.log(username,'logged in.')
                    let user_uuid = db.logInUser(username);
                    res.cookie('hermes_username', username); // TODO: remove; kept for legacy purposes
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

/*
---------------------------------------------------------------------------------
                                _    ____ ___
                               / \  |  _ \_ _|
                              / _ \ | |_) | |
                             / ___ \|  __/| |
                            /_/   \_\_|  |___|

---------------------------------------------------------------------------------
*/

app.post('/api/loadmessages', function(req, res){
    db.isValidUUID(req.body.uuid, function(ok){
        if(ok){
            db.getFromList('messages', function(err, result) {
                data = ''
                i = 0;
                result.forEach(function(value){
                    if(i!=0){
                        data += NULLCHAR;
                    }
                    data += value;
                    i++;
                });
                res.send(data);
            });
        }else{
            res.sendStatus(401); // Unauthorized
        }
    });
});

app.get('/api/loadmessages', function(req,res){
    res.sendStatus(401);
});

app.post('/api/sendmessage/:message', function(req, res){
    db.getLoggedInUserFromUUID(req.body.uuid, function(username, ok){
        if(ok){
            db.addToMessages(username, req.params.message, utils.getNow());
            res.sendStatus(200); // Success
        }else{
            res.sendStatus(401); // Unauthorized
        }
    });
})

app.get('/api/sendmessage/:message', function(req,res){
    res.sendStatus(401);
});

app.post('/api/getusername', function(req, res){
    db.getLoggedInUserFromUUID(req.body.uuid, function(user, status){
        if(status){
            res.send(user);
        }else{
            res.sendStatus(401); // Unauthorized
        }
    });
});

app.get('/api/getusername', function(req, res){
    res.sendStatus(405); // Bad method (GET instead of POST)
});

app.post('/api/login', function(req,res){
    username = req.body.username;
    password = req.body.password;
    if(username && password){
        var redirected = false;
    db.getFromList("users", async function(err, result) {
        for(value of result){
            login=value.split(SEPCHAR);

            if (login[0] == username) {
                let same = await bcrypt.verify(password, login[1]);

                if (same){
                    console.log(username,'logged in.')
                    let user_uuid = db.logInUser(username);
                    res.cookie('hermes_username', username); // TODO: remove; kept for legacy purposes
                    res.cookie('hermes_uuid', user_uuid);
                    res.redirect('/chat');
                    redirected = true;
                } else {
                    res.sendStatus(419).send('Login error');
                    redirected = true;
                }
            }
        }
        if (!redirected) {
            res.sendStatus(419).send('Login error');
        }
    });
    }else{
        res.sendStatus(400); // Bad request: either username and/or pasword are not present
    }
});

app.get('/api/login', function(req,res){
    res.sendStatus(405); // Bad Method
});

app.post('/api/logout', function(req,res){
    user_uuid = req.body.uuid;
    db.getLoggedInUserFromUUID(user_uuid, function(user, ok){
        if(ok){
            db.logoutUUID(user_uuid);
            console.log(user + ' logged out');
            res.sendStatus(200); // Success
        }else{
            res.sendStatus(401); // Unauthorized
        }
    });
});

app.get('/api/logout', function(req,res){
    res.sendStatus(405); // Bad Method
});

app.get('/api/teapot', function(req, res){
    console.log('I\'m a teapot!');
    res.sendStatus(418); // I'm a teapot
});

app.get('/api/*', function(req, res){
    console.log('Tried to access a not implemented part of the API: ' + req.url);
    res.sendStatus(404); // Not found
});

app.get('*', function(req, res){
  res.redirect('/');
});

app.listen(8080, function(){
  console.log('listening on *:8080');
});
