let USER_NOT_FOUND_ERROR = new Error('User not found');
USER_NOT_FOUND_ERROR.code = 10000;
let USER_NOT_LOGGED_IN_ERROR = new Error('User not found or not logged in');
USER_NOT_LOGGED_IN_ERROR.code = 10001;
let FIELD_REQUIRED_ERROR = new Error('Fields required where left blank');
FIELD_REQUIRED_ERROR.code = 10002;
let TOKEN_INVALID_ERROR = new Error('Token was invalid');
TOKEN_INVALID_ERROR.code = 10003;

const TimeUUID = require('cassandra-driver').types.TimeUuid;
const { EventManager, EventHandler } = require('./events');


let eventManager = new EventManager();
//example event:
//eventManager.setSendMessangeHandler(new EventHandler(Events.shellEventHandler, 'python3 newMessage'));

let deleted_messages = []
let edited_messages = []

module.exports = function (app, db, bcrypt, webPush, utils, HA) {

    app.post('/api/load100messages/:message_uuid', async function (req, res) {
        try {
            const ok = await db.checkLoggedInUser(req.body.uuid)
            if (ok) {
                const messages = await db.get100Messages(req.body.channel, req.params.message_uuid)

                let newm = [];
                for (const message of messages) {
                    let json = {
                        uuid: message.uuid,
                        username: message.username,
                        message: message.message,
                        time: message.timesent.getTime(),
                    }
                    newm.push(json);
                }
                res.send(newm.reverse());

            } else res.sendStatus(401); // Unauthorized

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        };
    });

    app.post('/api/load100messages/', async function (req, res) {
        try {
            const ok = await db.checkLoggedInUser(req.body.uuid)
            if (ok) {
                const messages = await db.get100Messages(req.body.channel)
                let newm = [];
                for (const message of messages) {
                    let json = {
                        uuid: message.uuid,
                        username: message.username,
                        message: message.message,
                        time: message.timesent.getTime(),
                    }
                    newm.push(json);
                }
                res.send(newm.reverse());

            } else res.sendStatus(401); // Unauthorized

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        };
    });

    app.post('/api/loadmessages/:message_uuid', async function (req, res) {
        try {
            const ok = await db.checkLoggedInUser(req.body.uuid)
            if (ok) {
                const messages = await db.getMessagesFrom(req.body.channel, req.params.message_uuid)

                let newm = [];
                for (const message of messages) {
                    let json = {
                        uuid: message.uuid,
                        username: message.username,
                        message: message.message,
                        time: message.timesent.getTime(),
                    }
                    newm.push(json);
                }

                let from_date = TimeUUID.fromString(req.params.message_uuid).getDate().getTime();
                let delm = [];
                deleted_messages.forEach(message => {
                    if (message.del_time > from_date) {
                        delm.push({
                            uuid: message.uuid,
                            del_time: message.del_time,
                            time_uuid: message.time_uuid,
                            original_message: message.original_message
                        });
                    }
                });

                edited_messages.forEach(message => {
                    if (message.edit_time > from_date) {
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
                res.send({
                    newmessages: newm,
                    deletedmessages: delm
                });

            } else res.sendStatus(401); // Unauthorized

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        };
    });

    app.get('/api/loadmessages', async function (req, res) {
        res.sendStatus(401);
    });

    app.post('/api/sendmessage/', async function (req, res) {
        try {
            const user = await db.getUserForUUID(req.body.uuid)
            const message_uuid = await db.addMessage(req.body.channel, user, req.body.message)

            res.sendStatus(200);
            eventManager.callSendMessageHandler([user, req.body.message]);
            HA.sendMessage(req.body, message_uuid);

            const subs = webPush.getSubscriptions()
            const pushMessage = {
                sender: user,
                message: req.body.message
            }

            for (const sub in subs) {
                if (sub !== req.body.uuid) {
                    webPush.sendNotifiaction(subs[sub], JSON.stringify(pushMessage)).catch(err => webPush.deleteSubscription(sub))
                }
            }

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        }
    });

    app.get('/api/sendmessage/', async function (req, res) {
        res.sendStatus(401);
    });

    app.post('/api/deletemessage/', async function (req, res) {
        try {
            const user = await db.getUserForUUID(req.body.uuid)
            const message = await db.getSingleMessage(req.body.channel, req.body.message_uuid)

            if (user === message.username) {
                db.deleteMessage(req.body.channel, req.body.message_uuid);
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
                HA.deleteMessage(req.body);

            } else res.sendStatus(403); // Forbidden

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        }
    });

    app.get('/api/deletemessage/', async function (req, res) {
        res.sendStatus(401);
    });

    app.post('/api/editmessage/', async function (req, res) {
        try {
            const user = await db.getUserForUUID(req.body.uuid)
            const sender = await db.getMessageSender(req.body.channel, req.body.message_uuid)

            if (user === sender) {
                db.editMessage(req.body.channel, req.body.message_uuid, req.body.newmessage);
                edited_messages.push({
                    channel: req.body.channel,
                    uuid: req.body.message_uuid,
                    message: req.body.newmessage,
                    edit_time: new Date().getTime(),
                    time_uuid: new TimeUUID(),
                    username: user,
                    time: new TimeUUID(req.body.message_uuid).getDate().getTime()
                });
                res.sendStatus(200);
                eventManager.callEditMessageHandler([user, req.body.newmessage]);
                HA.editMessage(req.body);

            } else res.sendStatus(403); // Forbidden

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500); // Internal Server Error
        };
    });

    app.get('/api/editmessage/', async function (req, res) {
        res.sendStatus(401);
    });

    app.post('/api/login', async function (req, res) {
        try {
            const username = req.body.username;
            const password = req.body.password;

            const hash = await db.getPasswordHash(username)
            const same = await bcrypt.verifyPromise(password, hash)

            if (same) {
                const uuid = await db.loginUser(username)
                res.send(uuid);
                eventManager.callLoginUserHandler([username]);
                HA.login(body, uuid);

            } else res.sendStatus(400); // Bad request: either username and/or pasword are not present

        } catch (err) {
            console.error('ERROR: ', err);
            res.sendStatus(500); // Server error
        };
    });

    app.post('/api/register', async function (req, res) {
        try {

            const username = req.body.username;
            const password1 = req.body.password1;
            const password2 = req.body.password2;

            if (username && password1 && password2 && (password1 === password2)) {
                const result = await db.isntAlreadyRegistered(username)

                if (result) {
                    const uuid = await bcrypt.save(username, password1)
                    res.send(uuid);
                    eventManager.callRegisterUserHandler([username]);

                } else res.sendStatus(409) // Conflict

            } else res.sendStatus(400); // Bad Request: invalid input

        } catch (err) {
            console.error('ERROR: ', err);
            res.sendStatus(500); // Server error
        }
    });


    app.get('/api/login', async function (req, res) {
        res.sendStatus(405); // Bad Method
    });

    app.post('/api/logout', async function (req, res) {
        try {
            await db.logoutUser(req.body.uuid);
            res.sendStatus(200);
            eventManager.callLogoutUserHandler([req.body.uuid]);
            HA.logout(req.body)
        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        }
    });

    app.get('/api/logout', async function (req, res) {
        res.sendStatus(405); // Bad Method
    });

    app.post('/api/updatePassword', async function (req, res) {
        try {
            const old_password = req.body.old_password;
            const new_password = req.body.new_password;
            const new_password_repeat = req.body.new_password_repeat;
            const uuid = req.body.uuid;

            if (new_password === new_password_repeat) {

                const user = await db.getUserForUUID(uuid)
                const hash = await db.getPasswordHash(user)
                const ok = await bcrypt.verifyPromise(old_password, hash)

                if (ok) {
                    await bcrypt.update(user, new_password)
                    res.sendStatus(200); // Success
                    HA.updatePassword(req.body)

                } else res.sendStatus(401); // Unauthorized

            } else res.sendStatus(400); // Bad request

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        }
    });

    app.get('/api/verifyUUID/:uuid', async function (req, res) { // For Hermes Desktop
        try {
            await db.checkLoggedInUser(req.params.uuid)
            res.sendStatus(200);

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        };
    });

    app.post('/api/saveSettings', async function (req, res) {
        try {
            const uuid = req.body.uuid;
            const color = req.body.color;
            const notifications = parseInt(req.body.notifications);
            const image_b64 = decodeURIComponent(req.body.image_b64);
            const theme = req.body.theme;

            const user = await db.getUserForUUID(uuid)
            await db.saveSetting(user, color, notifications, image_b64, theme)
            res.sendStatus(200);
            HA.saveSettings(req.body);

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        }
    });

    app.post('/api/getChannels', async function (req, res) {
        try {
            const user = await db.getUserForUUID(req.body.uuid)
            const channels = await db.getChannels(user)
            let r = [];
            for (const channel of channels) {
                const p = await db.getChannelProperties(channel)
                r.push(p)
            }
            res.send(r)
        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        }
    });

    app.post('/api/createChannel', async function (req, res) {
        try {
            const user = await db.getUserForUUID(req.body.uuid)
            const uuid = await db.createChannel(user, req.body.name)
            res.send(uuid)

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        }
    });

    app.post('/api/joinChannel', async function (req, res) {
        try {
            const user = await db.getUserForUUID(req.body.uuid)
            const exists = await db.channelExists(req.body.channel)

            if (exists) {
                await db.joinChannel(user, req.body.channel)
                res.sendStatus(200)

            } else res.sendStatus(404) // Channel not found

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        }
    });

    app.post('/api/leaveChannel', async function (req, res) {

        try {
            const user = await db.getUserForUUID(req.body.uuid)
            await db.leaveChannel(user, req.body.channel)
            res.sendStatus(200)

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        }
    });

    app.get('/api/getSettings/:username', async function (req, res) { // Only for chat (Color & image only)
        try {
            const settings = await db.getSetting(decodeURIComponent(req.params.username))

            res.send({
                color: '#' + settings[0],
                image: settings[2]
            });
        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        };
    });

    app.post('/api/getSettings/', async function (req, res) {
        try {
            const user = await db.getUserForUUID(req.body.uuid)
            const settings = await db.getSetting(user)

            res.send({
                username: user,
                color: '#' + settings[0],
                notifications: settings[1],
                image: settings[2],
                theme: settings[3]
            });

        } catch (err) {
            console.error('ERROR:', err);
            res.sendStatus(500);
        };
    });

    app.get('/api/teapot', async function (req, res) {
        res.sendStatus(418); // I'm a teapot
        eventManager.callTeapotHandler([]);
    });

    app.get('/api/getThemes', async function (req, res) {
        res.send(utils.getThemes());
    });

    HA.init(app, db, bcrypt, utils);

    app.get('/api/*', async function (req, res) {
        res.sendStatus(404); // Not found
    });
};