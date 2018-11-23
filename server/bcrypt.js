const SEPCHAR = String.fromCharCode(0x1);

module.exports = class {
    constructor(db){
        this.bcrypt = require('bcrypt');
        this.db = db;
    }

    async verify(password, hash) {
        return await this.bcrypt.compare(password, hash);
    }

    verifyPromise(password, hash) {
        return this.bcrypt.compare(password, hash);
    }

    save(username, password) {
        let t = this;
        return new Promise((resolve, reject)=>{
            t.bcrypt.hash(password, 3).then(hash=>{
                t.db.registerUser(username, hash).then(() => resolve()).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    update(username, new_password) {
        let t = this;
        return new Promise((resolve, reject)=>{
            t.bcrypt.hash(new_password, 3)
            .then(hash => {
                t.db.updateUserPasswordHash(username, hash, this).then(()=> resolve()).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }
};
