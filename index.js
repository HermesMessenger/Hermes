var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require("redis").createClient();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
io.on('connection', function(socket){
    redis.lrange("messages", 0, -1, function(err, result) {
        result.reverse();
        result.forEach(function(value){
            io.sockets.connected[socket.id].emit('loadMessages', value);
            io.sockets.connected[socket.id].emit('loadMessages', socket.id);
        });
    }); 
    socket.on('message', function(msg){
        redis.lpush('messages',  msg);
        io.emit('message', msg);
    });
});
http.listen(8080, function(){
  console.log('listening on *:8080');
});