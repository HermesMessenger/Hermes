module.exports = {
    //TODO Add HA API
    init: function (app, db, bcrypt, utils) {
        app.post('/API/HA/hello', function(req, res){

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