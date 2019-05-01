"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('source-map-support').install();
console.log('Started index.ts');
const express = require("express");
const path = require("path");
const ws = require("ws");
const http = require("http");
let app = express();
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/index.html'));
});
app.get('/index.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/index.js'));
});
app.get('/index.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../web/index.css'));
});
let server = http.createServer(app);
let wss = new ws.Server({ server });
wss.on('connection', (ws) => {
    ws.send('HELLO THERE');
    ws.on('message', (message) => { console.log(message); });
});
server.listen(8080, () => {
    console.log('Listening on *:8080');
});
//# sourceMappingURL=index.js.map