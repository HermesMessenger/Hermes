var app = require('express')();
var redis = require("redis").createClient();

const NULLCHAR = String.fromCharCode(0x0);
const NAMESEPCHAR = String.fromCharCode(0x1);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/index.js', function(req, res){
    res.sendFile(__dirname + '/index.js');
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
        console.log('DATA: ' + data.split(NULLCHAR));
        res.send(data);
    }); 
});

app.get('/sendmessage/:username/:message', function(req, res){
    console.log(req.params.username+':',req.params.message);
    redis.lpush('messages', req.params.username+NAMESEPCHAR+req.params.message);
    res.sendStatus(200);
});
app.listen(8080, function(){
  console.log('listening on *:8080');
});