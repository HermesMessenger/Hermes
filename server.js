const app = require('express')();
const db = require('./db')();
const bodyParser = require('body-parser'); // Peticiones POST
const cookieParser = require('cookie-parser'); // Cookies
const favicon = require('express-favicon'); // Favicon
const path = require('path');

const NULLCHAR = String.fromCharCode(0x0);
const NAMESEPCHAR = String.fromCharCode(0x1);

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
    if(req.cookies && req.cookies.username){
        res.sendFile(__dirname + '/web_client/index.html');
    }else{
        res.redirect('/getusername');
    }
});

app.get('/index.js', function(req, res){
    res.sendFile(__dirname + '/web_client/index.js');
});

app.get('/jquery.js', function(req, res){
    res.sendFile(__dirname + '/web_client/lib/jquery-1.11.1.min.js');
});

/*app.get('/favicon.ico', function(req, res){
    res.sendFile(__dirname + '/web_client/favicon.ico');
});*/

app.get('/getusername', function(req, res){
    res.sendFile(__dirname + '/web_client/username.html');
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

app.get('/loadmessages/', function(req, res){
    db.getMessages(function(err, result) {
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
