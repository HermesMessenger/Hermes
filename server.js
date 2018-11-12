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
    res.cookie('hermes_username', req.body.username);
    res.redirect('/chat');
});

app.get('/', function(req, res){
    if (req.cookies.username) {
        res.redirect('/chat');
    }else {
        res.redirect('/login');
    }
});

app.get('/chat', function(req, res){
    res.sendFile(html_path + 'index.html');
});

app.get('/js/index.js', function(req, res){
    res.sendFile(js_path + 'index.js');
});

app.get('/js/jquery.js', function(req, res){
    res.sendFile(js_path + 'jquery.js');
});

app.get('/js/login.js', function(req, res){
    res.sendFile(js_path + 'login.js');
});

app.get('/css/index.css', function(req, res){
    res.sendFile(css_path + 'index.css');
});

app.get('/css/style.css', function(req, res){
    res.sendFile(css_path + 'style.css');
});

/*app.get('/favicon.ico', function(req, res){
    res.sendFile(__dirname + '/web_client/favicon.ico');
});*/

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

app.get('/logout', function(req, res){
    res.clearCookie('hermes_username');
    res.redirect('/');
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
    var verifying = false;
    db.getFromList("users", async function(err, result) {
        var i = 0;
        for(value of result){
            login=value.split(SEPCHAR);

            if (login[0] == username) {
                let same = await bcrypt.verify(password, login[1]);

                if (same){
                    console.log(username,'logged in.')
                    res.cookie('hermes_username', username);
                    res.redirect('/chat');
                    redirected = true;
                } else {
                    res.sendFile(html_path + 'LoginPages/IncorrectPassword.html')
                    redirected = true;
                }
            } else i++;
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


app.get('/api/loadmessages', function(req, res){
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
});

app.get('/api/sendmessage/:username/:message', function(req, res){
    db.addToMessages(req.params.username, req.params.message, utils.getNow());
    res.sendStatus(200);
});

app.get('/api/*', function(req, res){
    res.sendStatus(404);
});

app.get('*', function(req, res){
  res.redirect('/');
});

app.listen(8080, function(){
  console.log('listening on *:8080');
});
