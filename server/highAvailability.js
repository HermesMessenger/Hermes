const TimeUUID = require('cassandra-driver').types.TimeUuid;
const spawn = require('child_process').spawnSync;

const config = require('../config.json');
const utils = require('./utils.js')


connectedIPs = []
serverStatus = -1
connection = undefined

module.exports = {
    //TODO Add HA API
    init: function (app, db, bcrypt, utils) {
        app.post('/api/HA/hello', function(req, res){
            let IP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            if(serverStatus == 0 && req.body.token == config.generalToken){
                if(!(connectedIPs.includes(IP))){
                    connectedIPs.push(IP);
                    console.log(IP, 'has connected as a secondary server');
                }
                res.status(200).send('');
            }else{
                res.sendStatus(403); // Forbidden
            }
        });
        

        //TODO make the code for recieving & sending the clear token
    },
    startChecking: function(){
        let checkStatus = spawn('bash', ['scripts/check_domain.sh', config.mainIP]);
        let stderr = checkStatus.stderr.toString('utf8').trim()
        if (stderr != '') throw new Error(stderr);
        let stdout = checkStatus.stdout.toString('utf8').trim()
        serverStatus = checkStatus.status;
        if(serverStatus == 1){
            if(connection != stdout) {
                utils.request('POST', 'http://'+stdout+'/api/HA/hello', {token: config.generalToken}).then(body => {
                    console.log('Connected to', 'http://'+stdout)
                }).catch(err => console.log(err))
                connection = stdout
            }
        }
        setTimeout(() => this.startChecking(),2000);
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