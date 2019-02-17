const spawn = require('child_process').spawnSync;
const ipaddr = require('ipaddr.js');

const config = require('../config.json');
const utils = require('./utils.js');
const FORCE_CONNECT = true;


let connectedIPs = [];
let serverStatus = -1;
let connection = undefined;
let closing = false;

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};


class Address {
    /**
     * @param {ipaddr.IPv4 | ipaddr.IPv6} ip 
     * @param {Number} port 
     */
    constructor(ip, port){
        this.ip = ip;
        this.port = port;
    }

    toString(){
        let ip_str = this.ip.toString();
        if(this.ip.kind() == 'ipv6'){
            ip_str = `[${ip_str}]`
        }
        return `${ip_str}:${this.port}`
    }

    equals(other){
        if(other.prototype == this.prototype){
            return this.toString() == other.toString();
        }
    }
}

module.exports = {
    //TODO Add HA API
    init: function (app, db, bcrypt, utils) {
        app.post('/api/HA/hello', function (req, res) {
            // if ip.kind() == 'ipv6' then to make requests we have to add brackets '[ip]'
            // For example if ip = ::1 then ip.kind() == 'ipv6', so to call it we have to do [::1]
            let address = new Address(ipaddr.parse(req.headers['x-forwarded-for'] || req.connection.remoteAddress), req.body.port);
            if (serverStatus == 0 && req.body.token == config.generalToken) {
                if (!(connectedIPs.includes(address))) {
                    connectedIPs.push(address);
                    console.log(address.toString(), 'has connected as a secondary server');
                }
                res.status(200).send('');
            } else {
                res.sendStatus(403); // Forbidden
            }
        });

        app.post('/api/HA/bye', function (req, res) {
            let address = new Address(ipaddr.parse(req.headers['x-forwarded-for'] || req.connection.remoteAddress), req.body.port);
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
        //TODO make the code for recieving & sending the clear token
    },
    startChecking: function () {
        let checkStatus = spawn('bash', ['scripts/check_domain.sh', config.mainIP]);
        let stderr = checkStatus.stderr.toString('utf8').trim()
        if (stderr != '') throw new Error(stderr);
        let stdout = checkStatus.stdout.toString('utf8').trim()
        serverStatus = checkStatus.status;
        if (serverStatus == 1) {
            if (connection != stdout) {
                utils.request('POST', 'http://' + stdout + '/api/HA/hello', { token: config.generalToken, port: config.port }).then(body => {
                    console.log('Connected to', 'http://' + stdout)
                }).catch(err => console.log(err))
                connection = stdout
            }
        }
        if (FORCE_CONNECT) {
            if (connection != config.mainIP) {
                utils.request('POST', 'http://' + config.mainIP + '/api/HA/hello', { token: config.generalToken, port: config.port }).then(body => {
                    console.log('Connected to', 'http://' + config.mainIP)
                }).catch(err => console.log(err))
                connection = config.mainIP
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
            utils.request('POST', 'http://' + connection + '/api/HA/bye', { token: config.generalToken, port: config.port }).then(body => {
                console.log('Disconnected from', 'http://' + connection);
            }).catch(err => console.log(err));
        }
    },

    //TODO Add HA function calls to make post requests
    login: async function (body, session_uuid) {
        console.log('HA LOGIN:', body.username);
    },

    register: async function (body, user_uuid, session_uuid) {
        console.log('HA REGISTER:', body.username);
    },

    logout: async function (body) {
        console.log('HA LOGOUT:', body.uuid);
    },

    sendMessage: async function (body, message_uuid) {
        console.log('HA SENDMESSAGE:', body.message);
    },

    deleteMessage: async function (body) {
        console.log('HA DELETEMESSAGE:', body.message_uuid);
    },

    editMessage: async function (body) {
        console.log('HA EDITMESSAGE:', body.newmessage);
    },

    updatePassword: async function (body) {
        console.log('HA UPDATEPASSWORD');
    },

    saveSettings: async function (body) {
        console.log('HA SAVESETTINGS');
    },

    clearMessages: async function (token) { },

    clearUsers: async function (token) { },

    clearSessions: async function (token) { },
}