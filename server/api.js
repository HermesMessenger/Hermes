module.exports = function(app, db, bcrypt, utils){

    app.post('/api/loadmessages', function (req, res) { // FIXME: update
        db.isValidUUID(req.body.uuid, function (ok) {
            if (ok) {
                db.getFromList('messages', function (err, result) {
                    data = ''
                    i = 0;
                    result.forEach(function (value) {
                        if (i != 0) {
                            data += NULLCHAR;
                        }
                        data += value;
                        i++;
                    });
                    res.send(data);
                });
            } else {
                res.sendStatus(401); // Unauthorized
            }
        });
    });

    app.get('/api/loadmessages', function (req, res) {
        res.sendStatus(401);
    });

    app.post('/api/sendmessage/:message', function (req, res) { // FIXME: update
        db.getLoggedInUserTimeFromUUID(req.body.uuid, function (username, time, ok) {
            if (ok) {
                db.addToMessages(username, req.params.message, utils.getNowStr());
                res.sendStatus(200); // Success
            } else {
                
                res.sendStatus(401); // Unauthorized
            }
        });
    })

    app.get('/api/sendmessage/:message', function (req, res) {
        res.sendStatus(401);
    });

    app.post('/api/getusername', function (req, res) { // FIXME: update
        db.getLoggedInUserTimeFromUUID(req.body.uuid, function (user, time, status) {
            if (status) {
                res.send(user);
            } else {
                res.sendStatus(401); // Unauthorized
            }
        });
    });

    app.get('/api/getusername', function (req, res) {
        res.sendStatus(405); // Bad method (GET instead of POST)
    });

    app.post('/api/login', function (req, res) { // FIXME: update
        username = req.body.username;
        password = req.body.password;
        if (username && password) {
            var redirected = false;
            db.getFromList("users", async function (err, result) {
                for (value of result) {
                    login = value.split(SEPCHAR);

                    if (login[0] == username) {
                        let same = await bcrypt.verify(password, login[1]);

                        if (same) {
                            console.log(username, 'logged in.')
                            let user_uuid = db.logInUser(username);
                            res.cookie('hermes_username', username); // FIXME: remove; kept for legacy purposes
                            res.cookie('hermes_uuid', user_uuid);
                            res.redirect('/chat');
                            redirected = true;
                        } else {
                            res.sendStatus(419).send('Login error');
                            redirected = true;
                        }
                    }
                }
                if (!redirected) {
                    res.sendStatus(419).send('Login error');
                }
            });
        } else {
            res.sendStatus(400); // Bad request: either username and/or pasword are not present
        }
    });

    app.get('/api/login', function (req, res) {
        res.sendStatus(405); // Bad Method
    });

    app.post('/api/logout', function (req, res) { // FIXME: update
        user_uuid = req.body.uuid;
        // If the uuid is not valid, logoutUUID will error out
        db.getLoggedInUserTimeFromUUID(user_uuid, function (user, time, ok) {
            if (ok) {
                db.logoutUUID(user_uuid);
                console.log(user + ' logged out');
                res.sendStatus(200); // Success
            } else {
                res.sendStatus(401); // Unauthorized
            }
        });
    });

    app.get('/api/logout', function (req, res) {
        res.sendStatus(405); // Bad Method
    });

    app.post('/api/updatePassword', function(req, res){ // FIXME: update
        let old_password = req.body.old_password;
        let new_password = req.body.new_password;
        let new_password_repeat = req.body.new_password_repeat;
        let uuid = req.body.uuid;
        db.getLoggedInUserTimeFromUUID(uuid,function(user, time, ok){
            if(ok){
                if(new_password == new_password_repeat){
                    bcrypt.update(user,old_password, new_password, function(ok){
                        if(ok){
                            res.sendStatus(200); // Success
                        }else{
                            res.sendStatus(500); // Server error
                        }
                    });
                }else{
                    res.sendStatus(401); // Unauthorized
                }
            }else{
                res.sendStatus(401); // Unauthorized
            }
            
        });
        
    });

    app.get('/api/teapot', function (req, res) {
        console.log('I\'m a teapot!');
        res.sendStatus(418); // I'm a teapot
    });

    app.get('/api/*', function (req, res) {
        console.log('Tried to access a not implemented part of the API: ' + req.url);
        res.sendStatus(404); // Not found
    });

};