const SaltRounds = 3;
const bcrypt = require('bcrypt')

module.exports = class {
    constructor(db) {
        this.db = db;
    }

    async verify(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    verifyPromise(password, hash) {
        return bcrypt.compare(password, hash);
    }

    save(username, password) {

        return new Promise((resolve, reject) => {
            bcrypt.hash(password, SaltRounds).then(hash => {
                this.db.registerUser(username, hash).then(uuid => resolve(uuid)).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    saveBot(botname, password) {

        return new Promise((resolve, reject) => {
            bcrypt.hash(password, SaltRounds).then(hash => {
                this.db.registerBot(botname, hash).then(uuid => resolve(uuid)).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    update(username, new_password) {

        return new Promise((resolve, reject) => {
            bcrypt.hash(new_password, SaltRounds).then(hash => {
                this.db.updatePasswordHash(username, hash).then(() => resolve()).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }
};
