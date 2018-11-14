const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);
const uuid = require('uuid/v4');

module.exports = class {
    constructor(){
        this.redis = require('redis').createClient();
    }

    addToMessages(user, message, time){
        this.addToList('messages', user+SEPCHAR+message+SEPCHAR+time);
    }

    addToUsers(user, hash){
        this.addToList('users', user+SEPCHAR+hash);
    }

    

    addToList(listname, element) {
        this.redis.lpush(listname, element);
    }

    logInUser(user){
        let user_uuid = uuid();
        this.addToList('logged_in_users', user+SEPCHAR+user_uuid);
        return user_uuid;
    }

    /*
    NOT USED
    getLoggedInUserUUID(user, callback){
        this.getFromList('logged_in_users', function(err, res){
            var user_uuid;
            for(element of res){
                if(element){
                    data = element.split(SEPCHAR);
                    if(data[0] == user){
                        user_uuid = data[1];
                        break;
                    }
                }
            }
            if(user_uuid){
                callback(user_uuid, true);
            }else{
                callback(user_uuid, false);
            }
            
        });
    }*/

    getLoggedInUserFromUUID(user_uuid, callback){
        this.getFromList('logged_in_users', function(err, res){
            var user;
            for(let element of res){
                if(element){
                    let data = element.split(SEPCHAR);
                    if(data[1] == user_uuid){
                        user = data[0];
                        break;
                    }
                }
            }
            if(user){
                callback(user, true);
            }else{
                callback(user, false);
            }
            
        });
    }

    /*
    NOT USED
    logoutUser(user){
        let this_db = this;
        this.getLoggedInUserIDX_UUID(user, function(user_uuid, ok){
            if(ok){
                this_db.removeFromList('logged_in_users', user+SEPCHAR+user_uuid);
            }
        });
    }
    */

    logoutUUID(user_uuid){
        let this_db = this;
        this.getLoggedInUserFromUUID(user_uuid, function(user, ok){
            if(ok){
                this_db.removeFromList('logged_in_users', user+SEPCHAR+user_uuid);
            }
        });
    }

    isValidUUID(user_uuid, callback){
        this.getLoggedInUserFromUUID(user_uuid,function(user, ok){
            callback(ok);
        });
    }

    getFromList(listname, callback){
        this.redis.lrange(listname, 0, -1, function(err, result){
            result.reverse();
            callback(err, result);
        });
    }

    removeFromList(listname, element){
        this.redis.lrem(listname, 0, element);
    }

    clear(element){
        this.redis.del(element);
    }
}
