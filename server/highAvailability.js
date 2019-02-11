module.exports = {
    //TODO Fill this up
    init: function (app, db, bcrypt, utils) {
        app.post('/HA/hello', function(req, res){
            
        })
    },

    login: function (body, uuid) { },

    register: function (body, user_uuid, login_uuid) { },

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