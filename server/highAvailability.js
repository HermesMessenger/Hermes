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
    login: function (body, session_uuid) { },

    register: function (body, user_uuid, session_uuid) { },

    logout: function (body) { },

    sendMessage: function (body, message_uuid) { },

    deleteMessage: function (body) { },

    editMessage: function (body) { },

    updatePassword: function (body) { },

    saveSettings: function (body) { },

    clearMessages: function (token) { },

    clearUsers: function (token) { },

    clearSessions: function (token) { },
}