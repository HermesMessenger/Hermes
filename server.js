const app = require('express')();
const db = require('./db')();
const bodyParser = require('body-parser'); // Peticiones POST
const cookieParser = require('cookie-parser'); // Cookies
const favicon = require('express-favicon'); // Favicon
const path = require('path');

const NULLCHAR = String.fromCharCode(0x0);
const NAMESEPCHAR = String.fromCharCode(0x1);
const PASSWORDSEPCHAR = String.fromCharCode(0x2);


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // for parsing cookies
app.use(favicon(path.join(__dirname, 'logos/HermesSquare.png')));

app.post('/', function(req, res){
    console.log('COOKIES:', req.cookies);
    res.cookie('hermes_username', req.body.username);
    res.sendFile(__dirname + '/web_client/index.html');
});

app.get('/', function(req, res){
    if (req.cookies && req.cookies.username) {
        res.sendFile(__dirname + '/web_client/index.html');
    }
    else {
        res.redirect('/getusername');
    }
});

app.get('/js/index.js', function(req, res){
    res.sendFile(__dirname + '/web_client/js/index.js');
});

app.get('/js/jquery.js', function(req, res){
    res.sendFile(__dirname + '/web_client/js/jquery.js');
});

app.get('/js/login.js', function(req, res){
    res.sendFile(__dirname + '/web_client/js/login.js');
});

app.get('/css/style.css', function(req, res){
    res.sendFile(__dirname + '/web_client/css/style.css');
});

/*app.get('/favicon.ico', function(req, res){
    res.sendFile(__dirname + '/web_client/favicon.ico');
});*/

app.get('/getusername', function(req, res){
    res.sendFile(__dirname + '/web_client/LoginPages/Regular.html');
});

app.get('/clearDB', function(req, res){
    db.clear();
    res.redirect('/');
    console.log('Cleared database');
});


app.get('/logout', function(req, res){
    res.clearCookie('hermes_username');
    res.redirect('/');
});

app.post('/register', function(req, res){
    var username=req.body.username;
    var password1=req.body.password1;
    var password2=req.body.password2;

    if (password1 == password2) {
        console.log('New user: ',username);
        redis.lpush('users', username+PASSWORDSEPCHAR+password1);
        res.sendFile(__dirname + '/web_client/LoginPages/Success.html');
    }

    else {
        res.sendFile(__dirname + '/web_client/LoginPages/FailSignup.html');
    };
});

app.post('/login', function(req, res){
    var username=req.body.username;
    var password=req.body.password;

    redis.lrange("users", 0, -1, function(err, result) {
        result.reverse();
        data = ''
        i = 0;
        result.forEach(function(value){
            data += value;
            i++;
            login=value.split(PASSWORDSEPCHAR);
            if ((login[0] == username) && (login[1] == password)) {
                res.cookie('hermes_username', username);
                res.sendFile(__dirname + '/web_client/index.html');
                console.log(login[0], 'logged in.')
                return 0;
            };
        });
    });
//    res.redirect('/getusername')
});



app.get('/loadmessages', function(req, res){
    redis.lrange("messages", 0, -1, function(err, result) {
        result.reverse();
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

app.get('/sendmessage/:username/:message', function(req, res){
    console.log('CHAT:',req.params.username+':',req.params.message);
    db.addMessage(req.params.username, req.params.message);
    res.sendStatus(200);
});

app.listen(8080, function(){
  console.log('listening on *:8080');
});
