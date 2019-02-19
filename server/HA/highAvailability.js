const TimeUUID = require('cassandra-driver').types.TimeUuid;

const spawn = require('child_process').spawnSync;
const ipaddr = require('ipaddr.js');

const config = require('../../config.json');
const utils = require('../utils.js');
const types = require('./types.js');
const check_domain = require('./check_domain.js');
const ServerObject = types.ServerObject;
const Connection = types.Connection;
const FORCE_CONNECT = config.forceHAConnect;


let connectedIPs = [];
let serverStatus = -1; // 0 -> I'm the server; 1 -> I'm not the server
let connection = undefined;
let closing = false;

module.exports = {
    init: function (app, db, bcrypt, utils) {
        //#region Main Server API methods
        app.post('/api/HA/hello', function (req, res) {
            // if ip.kind() == 'ipv6' then to make requests we have to add brackets '[ip]'
            // For example if ip = ::1 then ip.kind() == 'ipv6', so to call it we have to do [::1]
            // This is already handled in the ServerObject class, with the toString()
            let address = new ServerObject(ipaddr.parse(req.headers['x-forwarded-for'] || req.connection.remoteAddress), req.body.port);
            if (serverStatus == 0 && req.body.token == config.generalToken) {
                if (!(connectedIPs.includes(address))) {
                    connectedIPs.push(address);
                    console.log(address.toString(), 'has connected as a secondary server');
                }
                res.status(200).send(address.server_session.toString());
            } else {
                res.sendStatus(403); // Forbidden
            }
        });

        app.post('/api/HA/bye', function (req, res) {
            let address = new ServerObject(ipaddr.parse(req.headers['x-forwarded-for'] || req.connection.remoteAddress), req.body.port, TimeUUID.fromString(req.body.server_session));
            if (serverStatus == 0 && req.body.token == config.generalToken) {
                let includes = false;
                for (addr of connectedIPs){
                    if (address.equals(addr)){
                        includes = true;
                        break;
                    }
                }
                if (includes) {
                    connectedIPs.remove(address);
                    console.log(address.toString(), 'has disconnected');
                }
                res.status(200).send('');
            } else {
                res.sendStatus(403); // Forbidden
            }
        });
        //#endregion Main Server API methods
        
        //#region Secondary server API methods
        app.post('/api/HA/login', function (req, res) {
            if(req.body.server_session == connection.server_session.toString()){
                db.loginHA(req.body.username, req.body.session_uuid).then(() => {
                    res.sendStatus(200);
                }).catch(err => {
                    res.sendStatus(500);
                })
            }
        });

        //TODO: Add the rest of the methods
        //#endregion


        //TODO make the code for recieving & sending the clear token
    },
    startChecking: function () {
        let checkStatus = check_domain(config.mainIP);
        serverStatus = checkStatus.status;
        if (serverStatus == 1) {
            
            if (connection != checkStatus.ip) {
                utils.request('POST', 'http://' + checkStatus.ip + '/api/HA/hello', { token: config.generalToken, port: config.port }).then(body => {
                    console.log('Connected to', 'http://' + checkStatus.ip, `(${body})`);
                    connection = new Connection(checkStatus.ip, body);
                }).catch(err => console.log(err))
            }
        }
        if (FORCE_CONNECT) {
            if (connection != config.mainIP) {
                utils.request('POST', 'http://' + config.mainIP + '/api/HA/hello', { token: config.generalToken, port: config.port }).then(body => {
                    console.log('Connected to', 'http://' + config.mainIP, `(${body})`);
                    connection = new Connection(config.mainIP, body);
                }).catch(err => console.log(err))
            }
        }
        if(closing)
            console.log('Check HA function finished')
        else
            setTimeout(() => this.startChecking(), 2000);
    },

    close: function () {
        closing = true;
        if (connection) {
            utils.request('POST', 'http://' + connection.ip + '/api/HA/bye', { token: config.generalToken, port: config.port, server_session: connection.server_session }).then(body => {
                console.log('Disconnected from', 'http://' + connection.ip);
            }).catch(err => console.log(err));
        }
    },

    login: async function (body, session_uuid) {
        console.log('HA LOGIN:', body.username);
        //TODO make POST request to /api/HA/login {username, session_uuid, server_session}
    },

    register: async function (body, user_uuid, session_uuid) {
        console.log('HA REGISTER:', body.username);
        //TODO make POST request to /api/HA/register {username, password, user_uuid, server_session}
        //TODO make POST request to /api/HA/login {username, session_uuid, server_session}
    },

    logout: async function (body) {
        console.log('HA LOGOUT:', body.uuid);
        //TODO make POST request to /api/logout {session_uuid}
    },

    sendMessage: async function (body, message_uuid) {
        console.log('HA SENDMESSAGE:', body.message);
        //TODO make POST request to /api/HA/sendmessage {message, message_uuid, server_session}
    },

    deleteMessage: async function (body) {
        console.log('HA DELETEMESSAGE:', body.message_uuid);
        //TODO make POST request to /api/deletemessage body
    },

    editMessage: async function (body) {
        console.log('HA EDITMESSAGE:', body.newmessage);
        //TODO make POST request to /api/editmessage body
    },

    updatePassword: async function (body) {
        console.log('HA UPDATEPASSWORD');
        //TODO make POST request to /api/updatepassword body
    },

    saveSettings: async function (body) {
        console.log('HA SAVESETTINGS');
        //TODO make POST request to /api/savesettings body
    },

    clearMessages: async function (token) { },

    clearUsers: async function (token) { },

    clearSessions: async function (token) { },
}