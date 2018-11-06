//const DB = require('./db');
//let db = new DB();

module.exports = class {
    constructor(db){
        this.bcrypt = require('bcrypt');
        this.db = db;
    }


    verify(password, hash) {
        this.bcrypt.compare(password, hash, function(err, res) {
            console.log(res)
            return res;
        });
}
    save(username, password) {
        this.bcrypt.hash(password, 3, function(err, hash) {
            this.db.add('users', username, hash);
        });
    }

};