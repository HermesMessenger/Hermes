const NULLCHAR = String.fromCharCode(0x0);
const NAMESEPCHAR = String.fromCharCode(0x1);

module.exports = class {
    constructor(){
        this.redis = require('redis').createClient();
    }

    addMessage(user, message) {
        redis.lpush('messages', user+NAMESEPCHAR+message);
    }

    getMessages(callback){
        this.redis.lrange('messages', 0, -1, function(err, result){
            result.reverse();
            callback(err, result);
        });
    }

    clear(){
        this.redis.del('messages');
    }
}