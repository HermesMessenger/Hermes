const SaltRounds = 3;
const bcrypt = require('bcrypt')
const db = require('./db')

module.exports = {

    async verify(password, hash) {
        return await bcrypt.compare(password, hash);
    },

    async save(username, password) {

        const hash = await bcrypt.hash(password, SaltRounds)
        const uuid = await db.registerUser(username, hash)

        return uuid
    },

    async saveBot(botname, password) {

        const hash = await bcrypt.hash(password, SaltRounds)
        const uuid = await db.registerBot(botname, hash)

        return uuid
    },

    async update(username, new_password) {

        const hash = await bcrypt.hash(new_password, SaltRounds)
        await db.updatePasswordHash(username, hash)

        return
    }
};
