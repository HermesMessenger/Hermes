const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);

module.exports = class {
    constructor(){
        this.redis = require('redis').createClient();
        
    }

    addToList(listname, user, message) {
        this.redis.lpush(listname, user+SEPCHAR+message);
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