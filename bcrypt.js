const DB = require('./db');
let db = new DB();

module.exports = class {
    constructor(){
        this.bcrypt = require('bcrypt');
    }


    verify(password, hash) {
        this.bcrypt.compare(password, hash, function(err, res) {
            console.log(res)
            return res;
        });
}
    save(username, password) {
        this.bcrypt.hash(password, 3, function(err, hash) {
            db.add('users', username, hash);
        });
    }

};