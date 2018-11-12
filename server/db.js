const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);

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

    getFromList(listname, callback){
        this.redis.lrange(listname, 0, -1, function(err, result){
            result.reverse();
            callback(err, result);
        });
    }

    clear(element){
        this.redis.del(element);
    }
}
