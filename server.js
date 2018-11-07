const app = require('express')();
const DB = require('./db');
const BCRYPT = require('./bcrypt');
const bodyParser = require('body-parser'); // Peticiones POST
const cookieParser = require('cookie-parser'); // Cookies
const favicon = require('express-favicon'); // Favicon
const path = require('path');

let db = new DB();
console.log('------------------------------------------');

let bcrypt = new BCRYPT(db);

const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cookieParser()); // for parsing cookies
app.use(favicon(path.join(__dirname, 'logos/HermesSquare.png')));

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
    res.sendFile(__dirname + '/web_client/index.html');
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

app.get('/clearDB', function(req, res){
    db.clear('messages');
    db.clear('users');
    res.redirect('/');
    console.log('Cleared database');
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
        console.log('New user: ',username);
        bcrypt.save(username, password1);
        res.cookie('hermes_username', username);
        res.redirect('/chat');
    }

    else {
        res.sendFile(__dirname + '/web_client/LoginPages/FailSignup.html');
    };
});

app.get('/login', function(req, res){
    res.sendFile(__dirname + '/web_client/LoginPages/Regular.html');
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
                
                if(same){
                    console.log(username,'logged in.')
                    res.cookie('hermes_username', username);
                    res.redirect('/chat');
                    redirected = true;
                }else{
                    //console.log(username+': INCORRECT PASSWORD');
                    res.sendFile(__dirname + '/web_client/LoginPages/IncorrectPassword.html');
                    redirected = true;
                    i++;
                }
            }else{
                i++;
            }
        }
        if(!redirected){
            //console.log(username, 'not found');
            res.sendFile(__dirname + '/web_client/LoginPages/UserNotFound.html');
        }
        
    });
    
});

app.get('/loadmessages', function(req, res){
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

app.get('/sendmessage/:username/:message', function(req, res){
    console.log('CHAT:',req.params.username+':',req.params.message);
    db.addToList('messages', req.params.username, req.params.message);
    res.sendStatus(200);
});

app.listen(8080, function(){
  console.log('listening on *:8080');
});
