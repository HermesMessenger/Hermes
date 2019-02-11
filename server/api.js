let USER_NOT_FOUND_ERROR = new Error('User not found');
USER_NOT_FOUND_ERROR.code = 10000;
let USER_NOT_LOGGED_IN_ERROR = new Error('User not found or not logged in');
USER_NOT_LOGGED_IN_ERROR.code = 10001;
let FIELD_REQUIRED_ERROR = new Error('Fields required where left blank');
FIELD_REQUIRED_ERROR.code = 10002;
let TOKEN_INVALID_ERROR = new Error('Token was invalid');
TOKEN_INVALID_ERROR.code = 10003;

const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);

const TimeUUID = require('cassandra-driver').types.TimeUuid;
const Events = require('./events');
const {EventManager, EventHandler} = Events;

let eventManager = new EventManager();
let HAeventManager = new EventManager();
//example event:
//eventManager.setSendMessangeHandler(new EventHandler(Events.shellEventHandler, 'python3 newMessage'));

let deleted_messages = []
let edited_messages = []

module.exports = function (app, db, bcrypt, utils) {

    app.post('/api/loadmessages', function (req, res) {
        db.checkLoggedInUser(req.body.uuid).then(ok => {
            if (ok) {
                db.getMessages().then(result => {
                    let data = '';
                    for (let i = 0; i < result.length; i++) {
                        data += result[i].uuid + SEPCHAR;
                        data += result[i].username + SEPCHAR;
                        data += result[i].message + SEPCHAR;
                        data += result[i].timesent.getTime();
                        if (i != result.length - 1)
                            data += NULLCHAR;
                    }

                    res.send(data);
                }).catch(err => console.error('ERROR:', err));
            } else {
                res.sendStatus(401); // Unauthorized
            }
        }).catch(err => {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        });
    });

    app.post('/api/loadmessages/:message_uuid', function (req, res) {
        db.checkLoggedInUser(req.body.uuid).then(ok => {
            if (ok) {
                db.getMessagesFrom(req.params.message_uuid).then(result => {
                    
                    let newm = [];
                    for (let i = 0; i < result.length; i++) {
                        let json_data = {};
                        json_data.uuid = result[i].uuid;
                        json_data.username = result[i].username;
                        json_data.message = result[i].message;
                        json_data.time = result[i].timesent.getTime();
                        json_data.edited = false;
                        newm.push(json_data);
                    }
                    let from_date = TimeUUID.fromString(req.params.message_uuid).getDate().getTime();
                    let delm = [];
                    deleted_messages.forEach((message)=>{
                        if(message.del_time>from_date){
                            delm.push({
                                uuid: message.uuid,
                                del_time: message.del_time, 
                                time_uuid: message.time_uuid, 
                                original_message: message.original_message
                            });
                        }
                    });

                    edited_messages.forEach((message)=>{
                        if(message.edit_time>from_date){
                            newm.push({
                                uuid: message.uuid,
                                message: message.message,
                                time_uuid: message.time_uuid,
                                time: message.time,
                                username: message.username,
                                edited: true,
                            });
                        }
                    });
                    res.json({newmessages: newm, deletedmessages: delm});
                }).catch(err => console.error('ERROR:', err));
            } else {
                res.sendStatus(401); // Unauthorized

            }
        }).catch(err => {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        });
    });

    app.get('/api/loadmessages', function (req, res) {
        res.sendStatus(401);
    });

    app.post('/api/sendmessage/', function (req, res) {
        db.getUserForUUID(req.body.uuid).then(user => {
            db.addMessage(user, req.body.message);
            res.sendStatus(200);
            eventManager.callSendMessageHandler([user, req.body.message, user]);
            HAeventManager.callSendMessageHandler([user, req.body.message, req.body.uuid]);
        }).catch(err => {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        });
    });

    app.get('/api/sendmessage/', function (req, res) {
        res.sendStatus(401);
    });
	
	app.post('/api/deletemessage/', function (req, res) {
        db.getUserForUUID(req.body.uuid).then(user => {
            db.getSingleMessage(req.body.message_uuid).then(message => {
                if(user == message.username){
                    db.deleteMessage(req.body.message_uuid);
                    deleted_messages.push({
                        uuid: req.body.message_uuid, 
                        del_time: new Date().getTime(), 
                        time_uuid: new TimeUUID(), 
                        original_message: {
                            uuid: message.uuid,
                            username: message.username,
                            message: message.message,
                            timesent: new Date(message.timesent).getTime(), 
                        }
                    });
                    res.sendStatus(200);
                    eventManager.callDeleteMessageHandler([user, req.body.message_uuid]);
                    HAeventManager.callDeleteMessageHandler([user, req.body.message_uuid, req.body.uuid]);
                }else{
                    res.sendStatus(403); // Forbidden
                }
            }).catch(err => {
                console.error('ERROR:', err);
                res.sendStatus(500); // Internal Server Error
            });
        }).catch(err => {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        });
    });

    app.get('/api/deletemessage/', function (req, res) {
        res.sendStatus(401);
    });
	
	app.post('/api/editmessage/', function (req, res) {
        db.getUserForUUID(req.body.uuid).then((user) => {
            db.getMessageSender(req.body.message_uuid).then(sender => {
                if(user == sender){
                    db.editMessage(req.body.message_uuid, req.body.newmessage);
                    edited_messages.push({
                        uuid: req.body.message_uuid, 
                        message: req.body.newmessage, 
                        edit_time: new Date().getTime(), 
                        time_uuid: new TimeUUID(),
                        username: user,
                        time: new TimeUUID(req.body.message_uuid).getDate().getTime()
                    });
                    res.sendStatus(200);
                    eventManager.callEditMessageHandler([user, req.body.newmessage]);
                    HAeventManager.callEditMessageHandler([user, req.body.newmessage, req.body.uuid, req.body.message_uuid]);
                }else{
                    res.sendStatus(500); // Internal Server Error
                }
            }).catch(err => {
                console.error('ERROR:', err);
                res.sendStatus(500); // Internal Server Error
            });
        }).catch(err => {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        });
    });

    app.get('/api/editmessage/', function (req, res) {
        res.sendStatus(401);
    });

    app.post('/api/getusername', function (req, res) {
        db.getUserForUUID(req.body.uuid).then(user => {
            res.send(user);
        }).catch(err => {
            if (err == USER_NOT_FOUND_ERROR) {
                res.sendStatus(401); // Unauthorized
            } else {
                console.error('ERROR:', err);
                res.sendStatus(500);
            }
        });
    });

    app.get('/api/getusername', function (req, res) {
        res.sendStatus(405); // Bad method (GET instead of POST)
    });

    app.post('/api/login', function (req, res) {
        username = req.body.username;
        password = req.body.password;
        if (username && password) {
            db.getPasswordHash(username).then(hash => {
                bcrypt.verifyPromise(password, hash).then(same => {
                    if (same) {
                        console.log(username, 'logged in through the API.')
                        db.loginUser(username).then(user_uuid => {
                            res.status(200).send(user_uuid);
                            eventManager.callLoginUserHandler([username]);
                            HAeventManager.callLoginUserHandler([username, password, user_uuid]);
                        }).catch(err => {
                            console.error('ERROR: ', err);
                            res.sendStatus(500); // Server error
                        });
                    } else {
                        res.sendStatus(400); // Bad request: either username and/or pasword are not present
                    }
                });
            }).catch(err => {
                if (err == USER_NOT_FOUND_ERROR) {
                    res.sendStatus(400); // Bad request: either username and/or pasword are not present
                } else {
                    console.error('ERROR: ', err);
                    res.sendStatus(500); // Server error
                }
            });
        } else {
            res.sendStatus(400); // Bad request: either username and/or pasword are not present
        }
    });

    app.post('/api/register', function (req, res) {
        var username = req.body.username;
        var password1 = req.body.password1;
        var password2 = req.body.password2;

        if (username && password1 && password2) {
            if (password1 == password2) {
                db.isntAlreadyRegistered(username).then(result => {
                    if(result){
                        console.log('New user: ', username);
                        bcrypt.save(username, password1);
                        db.loginUser(username).then(uuid => {
                            res.status(200).send(uuid);
                            eventManager.callRegisterUserHandler([username]);
                            HAeventManager.callRegisterUserHandler([username, password1, password2, uuid]);
                        }).catch(err => res.sendStatus(500)) // Server Error
                    } else res.sendStatus(409) // Conflict
                }).catch(err => res.sendStatus(500)) // Server Error
            } else res.sendStatus(400);    
        } else res.sendStatus(400);    
    });


    app.get('/api/login', function (req, res) {
        res.sendStatus(405); // Bad Method
    });

    app.post('/api/logout', function (req, res) {
        db.logoutUser(req.body.uuid);
        eventManager.callLogoutUserHandler([req.body.uuid]);
        HAeventManager.callLogoutUserHandler([req.body.uuid]);
        res.sendStatus(200);
    });

    app.get('/api/logout', function (req, res) {
        res.sendStatus(405); // Bad Method
    });

    app.post('/api/updatePassword', function (req, res) {
        let old_password = req.body.old_password;
        let new_password = req.body.new_password;
        let new_password_repeat = req.body.new_password_repeat;
        let uuid = req.body.uuid;
        db.getUserForUUID(uuid).then(user => {
            if (new_password == new_password_repeat) {
                db.getPasswordHash(user).then(hash => {
                    bcrypt.verifyPromise(old_password, hash).then(ok => {
                        if (ok) {
                            bcrypt.update(user, new_password).then(() => {
                                res.sendStatus(200); // Success
                            }).catch(err => {
                                if (err == USER_NOT_FOUND_ERROR) {
                                    res.sendStatus(401); // Unauthorized
                                } else {
                                    console.error('ERROR:', err);
                                    res.sendStatus(500);
                                }
                            });
                        } else {
                            res.sendStatus(401); // Unauthorized
                        }
                    }).catch(err => {
                        if (err == USER_NOT_FOUND_ERROR) {
                            res.sendStatus(401); // Unauthorized
                        } else {
                            console.error('ERROR:', err);
                            res.sendStatus(500);
                        }
                    });
                }).catch(err => {
                    if (err == USER_NOT_FOUND_ERROR) {
                        res.sendStatus(401); // Unauthorized
                    } else {
                        console.error('ERROR:', err);
                        res.sendStatus(500);
                    }
                });
            } else {
                res.sendStatus(400); // Bad request
            }
        }).catch(err => {
            if (err == USER_NOT_FOUND_ERROR) {
                res.sendStatus(401); // Unauthorized
            } else {
                console.error('ERROR:', err);
                res.sendStatus(500);
            }
        });
    });

    app.get('/api/verifyUUID/:uuid', function (req, res) { // For Hermes Desktop
        let uuid = req.params.uuid;
        if (uuid) {
            db.checkLoggedInUser(uuid).then(() => {
                res.sendStatus(200);
            }).catch(err => res.sendStatus(400));
        } else {
            res.sendStatus(400);
        };
    });

    app.post('/api/saveSettings', function (req, res) {
        let color = req.body.color;
        let dark = req.body.dark;
        let notifications = req.body.notifications;
        let image_b64 = decodeURIComponent(req.body.image_b64);
        let uuid = req.body.uuid;

        db.getUserForUUID(uuid).then(user => {
            console.log('Saving settings for', user + ':', '#' + color, parseInt(notifications), dark);
            db.saveSettingWithUsername(user, color, parseInt(notifications), image_b64, dark).then(() => res.sendStatus(200)).catch(err => {
                if (err == USER_NOT_FOUND_ERROR) {
                    res.sendStatus(401); // Unauthorized
                } else {
                    console.error('ERROR:', err);
                    res.sendStatus(500);
                }
            });
        }).catch(err => {
            if (err == USER_NOT_FOUND_ERROR) {
                res.sendStatus(401); // Unauthorized
            } else {
                console.error('ERROR:', err);
                res.sendStatus(500);
            }
        });
    });

    app.get('/api/getSettings/:username', function (req, res) { // Only for chat (Color & image only)
        db.getSettingUsername(decodeURIComponent(req.params.username)).then((data) => {
            let color = data[0];
            let image_b64 = data[2];
            console.log(decodeURIComponent(req.params.username), 'got its chat settings:', '#' + color);
            res.status(200).send({
                color: '#' + color,
                image: image_b64
            });
        }).catch(err => {
            if (err == FIELD_REQUIRED_ERROR) {
                res.sendStatus(400); // Bad request
            } else if (err == USER_NOT_FOUND_ERROR) {
                res.sendStatus(401); // Unauthorized
            } else {
                console.error('ERROR:', err);
                res.sendStatus(500);
            }
        });
    });

    app.post('/api/getSettings/', function (req, res) {
        let uuid = req.body.uuid;
        db.getUserForUUID(uuid).then(user => {
            db.getSettingUsername(user).then((data) => {
                let color = data[0];
                let notifications = data[1];
                let image_b64 = data[2];
                let dark = data[3];
                console.log(user, 'got its settings:', '#' + color, notifications, dark);
                res.status(200).send({
                    color: '#' + color,
                    notifications: notifications,
                    image: image_b64,
                    dark: dark
                });
            }).catch(err => {
                if (err == FIELD_REQUIRED_ERROR) {
                    res.sendStatus(400); // Bad request
                } else if (err == USER_NOT_FOUND_ERROR) {
                    res.sendStatus(401); // Unauthorized
                } else {
                    console.error('ERROR:', err);
                    res.sendStatus(500);
                }
            });
        }).catch(err => {
            if (err == USER_NOT_FOUND_ERROR) {
                res.sendStatus(401); // Unauthorized
            } else {
                console.error('ERROR:', err);
                res.sendStatus(500);
            }
        });
    });

    app.get('/api/clearMessages/:token', function (req, res) {
        db.checkToken(req.params.token).then(() => {
            db.clear('messages');
            res.redirect('/');
            console.log('Cleared messages');
        }).catch(err => res.sendStatus(403));
    });

    app.get('/api/clearUsers/:token', function (req, res) {
        db.checkToken(req.params.token).then(() => {
            db.clear('users');
            db.clear('settings');
            res.redirect('/');
            console.log('Cleared users.');
        }).catch(err => res.sendStatus(403));
    });

    app.get('/api/clearSessions/:token', function (req, res) {
        db.checkToken(req.params.token).then(() => {
            db.clear('sessions');
            res.redirect('/');
            console.log('Cleared logged in users.');
        }).catch(err => res.sendStatus(403));
    });

    app.get('/api/teapot', function (req, res) {
        console.log('I\'m a teapot!');
        res.sendStatus(418); // I'm a teapot
        eventManager.callTeapotHandler([]);
    });

    app.get('/api/*', function (req, res) {
        console.log('Tried to access a not implemented part of the API: ' + req.url);
        res.sendStatus(404); // Not found
    });

};