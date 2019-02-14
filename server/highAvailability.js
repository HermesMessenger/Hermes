const TimeUUID = require('cassandra-driver').types.TimeUuid;

mytoken = new TimeUUID();
//! When using the server as the main one change this or:
// TODO: Load this from an independent file
generalToken = '2d903f7d-e6cb-4e28-83e8-7a2573eff3e3'

connectedIPs = []

module.exports = {
    //TODO Add HA API
    init: function (app, db, bcrypt, utils) {
        app.post('/API/HA/hello', function(req, res){
            if(req.body.token == generalToken){
                connectedIPs.push(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
                res.status(200).send(token.toString());
            }else{
                res.sendStatus(403); // Forbidden
            }
        });

        //TODO make the code for recieving & sending the clear token
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