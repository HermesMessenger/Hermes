const NULLCHAR = String.fromCharCode(0x0);
const SEPCHAR = String.fromCharCode(0x1);

module.exports = class {
    constructor(){
        this.redis = require('redis').createClient();
    }

    add(db, user, message) {
        this.redis.lpush(db, user+SEPCHAR+message);
    }

    get(db, callback){
        this.redis.lrange(db, 0, -1, function(err, result){
            result.reverse();
            callback(err, result);
        });
    }

    clear(db){
        this.redis.del(db);
    }
}