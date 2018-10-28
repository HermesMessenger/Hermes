var app = require('express')();
var redis = require("redis").createClient();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

const NULLCHAR = String.fromCharCode(0x0);
const NAMESEPCHAR = String.fromCharCode(0x1);

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // for parsing cookies


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

app.get('/getusername', function(req, res){
    res.sendFile(__dirname + '/web_client/username.html');
});

app.get('/logout', function(req, res){
    res.clearCookie('hermes_username');
    res.redirect('/');
});

app.get('/loadmessages/', function(req, res){
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
        //console.log('DATA: ' + data.split(NULLCHAR));
        res.send(data);
    }); 
});

app.get('/sendmessage/:username/:message', function(req, res){
    console.log('CHAT:',req.params.username+':',req.params.message);
    redis.lpush('messages', req.params.username+NAMESEPCHAR+req.params.message);
    res.sendStatus(200);
});
app.listen(8080, function(){
  console.log('listening on *:8080');
});