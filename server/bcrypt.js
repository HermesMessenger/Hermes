const SEPCHAR = String.fromCharCode(0x1);

module.exports = class {
    constructor(db){
        this.bcrypt = require('bcrypt');
        this.db = db;
    }

    async verify(password, hash) {
        return await this.bcrypt.compare(password, hash);
    }

    save(username, password) {
        let db = this.db;
        this.bcrypt.hash(password, 3, function(err, hash) {
            db.addToUsers(username, hash);
        });
    }

    update(username, old_password, new_password, callback=function(ok){}) {
        let db = this.db;
        this.bcrypt.hash(new_password, 3, function(err, hash) {
            db.updateUserPassword(username, old_password, hash, this, callback);
        });
    }

};
