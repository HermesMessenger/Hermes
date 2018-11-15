const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);
const uuid = require('uuid/v4');

const getCurrentTimeStamp = require('./utils').getCurrentTimeStamp;

module.exports = class {
    constructor() {
        this.redis = require('redis').createClient();
    }

    addToList(listname, element) {
        this.redis.rpush(listname, element);
    }

    addToMessages(user, message, time) {
        this.addToList('messages', user + SEPCHAR + message + SEPCHAR + time);
    }

    addToUsers(user, hash) {
        this.addToList('users', user + SEPCHAR + hash);
    }

    updateUserPassword(user, new_hash, callback=function(ok){}) {
        let this_db = this;
        this.getFromList('users', function (err, res) {
            var idx = 0;
            var ok = false;
            for (let element of res) {
                if (element) {
                    data = element.split(SEPCHAR);
                    if(data[0] == user){
                        var new_data = data;
                        new_data[1] = new_hash;
                        var r = '';
                        for(var i = 0;i<new_data.length;i++){
                            if(i!=0){
                                r = r+SEPCHAR+new_data[i]
                            }else{
                                r = new_data[0]
                            }
                        }
                        this_db.redis.lset('users', idx, r);
                        ok = true;
                        break;
                    }
                    idx++;
                }
            }
            callback(ok);
        });
    }

    logInUser(user) {
        let user_uuid = uuid();
        this.addToList('logged_in_users', user + SEPCHAR + user_uuid + SEPCHAR + getCurrentTimeStamp());
        return user_uuid;
    }

    updateLoginExpiration(idx, username, user_uuid) {
        let timestamp = getCurrentTimeStamp(); // TODO: put more than timestamp
        this.redis.lset('logged_in_users', idx, username+SEPCHAR+user_uuid+SEPCHAR+timestamp);
        return timestamp;
    }

    checkExpriation(max_time, callback=function(removed_users){}) {
        let this_db = this;
        this.getFromList('logged_in_users', function (err, res) {
            var i = 0;
            for (let element of res) {
                if (element) {
                    if((getCurrentTimeStamp() - parseInt(element.split(SEPCHAR)[2])) >= max_time){
                        // Session has expired
                        this_db.removeFromList('logged_in_users', element); // delete session
                        i++;
                    }
                }
            }
            callback(i);
        });
    }

    getLoggedInUserTimeFromUUID(user_uuid, callback, update_time=true) {
        let this_db = this;
        this.getFromList('logged_in_users', function (err, res) {
            var user;
            var time;
            var i = 0;
            for (let element of res) {
                if (element) {
                    let data = element.split(SEPCHAR);
                    if (data[1] == user_uuid) {
                        user = data[0];
                        if(update_time){
                            time = this_db.updateLoginExpiration(i, user, user_uuid); // Update current timestamp
                            
                        }else{
                            time = data[2];
                        }
                        
                        break;
                    }
                    i++;
                }
            }
            if (user && time) {
                callback(user, time, true);
            } else {
                callback(user, time, false);
            }

        });
    }

    logoutUUID(user_uuid) {
        let this_db = this;
        this.getLoggedInUserTimeFromUUID(user_uuid, function (user, time, ok) {
            if (ok) {
                this_db.removeFromList('logged_in_users', user + SEPCHAR + user_uuid + SEPCHAR + time);
            }
        });
    }

    isValidUUID(user_uuid, callback, update_time=true) {
        this.getLoggedInUserTimeFromUUID(user_uuid, function (user, time, ok) {
            callback(ok);
        }, update_time);
    }

    getFromList(listname, callback) {
        this.redis.lrange(listname, 0, -1, function (err, result) {
            callback(err, result);
        });
    }

    removeFromList(listname, element) {
        this.redis.lrem(listname, 0, element);
    }

    clear(element) {
        this.redis.del(element);
    }
}
