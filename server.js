var app = require('express')();
var http = require('http').Server(app);
//var io = require('socket.io')(http);
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

/*
io.on('connection', function(socket){
    redis.lrange("messages", 0, -1, function(err, result) {
        result.reverse();
        result.forEach(function(value){
            io.sockets.connected[socket.id].emit('loadMessages', value);
            io.sockets.connected[socket.id].emit('loadMessages', 'TEST: '+socket.id);
        });
    }); 
    socket.on('message', function(msg){
        redis.lpush('messages',  msg);
        io.emit('message', msg);
    });
});*/
http.listen(8080, function(){
  console.log('listening on *:8080');
});