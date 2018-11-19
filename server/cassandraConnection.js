const cassandra = require('cassandra-driver');
const SESSION_TIMEOUT = 60 * 60 * 24 * 7 // A week in seconds
const USER_NOT_EXISTANT_ERROR = 0;

module.exports = class {
    constructor(){
        this.client = new cassandra.Client({contactPoints: ['127.0.0.1:9042'], keyspace: 'hermes'})
    }

    // TODO: Make multiple channels (for now 'general' is always used)
    addMessage(user, message){
        const query = 'INSERT INTO Messages (Channel, Username, Message, TimeSent) values(?,?,?,toTimestamp(now()));';
        let data = ['general', user, message];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, {prepare: true}).then(result => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    registerUser(user, passwordHash){
        const query = 'INSERT INTO Users (UUID, Username, PasswordHash) values(now(),?,?);';
        let data = [user, passwordHash];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, {prepare: true}).then(result => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    getPasswordHash(user){
        const query = 'SELECT PasswordHash from Users where Username = ?;';
        let data = [user];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, {prepare: true}).then(result => {
                let hashRow = result.first();
                if(hashRow.passwordhash){
                    resolve(hashRow.passwordhash);
                }else{
                    reject('User not existant');
                }
            }).catch(err => {
                reject(err);
            });
        });
    }

    loginUser(user){
        // TODO: check if user is already logged in, to update it
        const query = 'INSERT INTO Sessions (UUID, Username) values(now(),?) USING TTL ?;';
        let data = [user, SESSION_TIMEOUT];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, {prepare: true}).then(result => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    getUserForUUID(uuid){
        const query = 'SELECT Username FROM Sessions WHERE UUID=?';
        let data = [uuid];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, {prepare: true}).then(result => {
                let userRow = result.first();

                if(userRow.username){
                    resolve(userRow.username);
                }else{
                    reject('User not existant or not logged in');
                }
            }).catch(err => {
                reject(err);
            });
        });
    }

    updateLoggedInUser(uuid){
        // TODO: update the TTL
        const query = 'INSERT INTO Sessions (UUID, Username) values(?,?) USING TTL ?';
        return new Promise((resolve, reject) => {
            this.getUserForUUID(uuid).then(user => {
                let data = [uuid, user, SESSION_TIMEOUT];
                this.client.execute(query, data, {prepare: true}).then(result => {
                    resolve();
                }).catch(err => reject(err));
            }).catch(err => reject(err));
            
        });
    }
}