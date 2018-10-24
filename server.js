var express = require('express');
var requestIp = require('request-ip');

var app = express();
var server = app.listen(1300,"10.0.0.12");

app.use(express.static('public'));
app.use(requestIp.mw())
app.use(function(req, res) {
    const ip = req.clientIp;
    res.end(ip);
});

console.log("Chat App started!");

var socket = require("socket.io");
var io = socket(server);

var messages=[];
var names={};

io.sockets.on('connection', newConn);

function newConn(socket){
	console.log(socket.handshake.address);
	var address = socket.handshake;
	console.log("new connection: "+socket.id);
	//console.log(names)
	if(names[address.address]==undefined)
		names[address.address]="User_"+Math.floor(Math.random()*3000);
	socket.emit('yourName', {"name":names[address.address]});
	socket.emit("recieveMsg", {"messages":messages});
	console.log(names)

	socket.on("msgSent", broadcastMsg);
	setTimeout(function() {
		socket.emit("recieveMsg", {"messages":messages});
	},1000)
	function broadcastMsg(msg) {
		d=new Date();
		h=d.getHours()<10 ? "0"+d.getHours() : d.getHours()
		m=d.getMinutes()<10 ? "0"+d.getMinutes() : d.getMinutes()
		messages.push({"msg":msg,"from":names[address.address],"timeSent":h+":"+m});
		io.sockets.emit("recieveMsg", {"messages":messages});
	}
}