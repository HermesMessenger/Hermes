const cassandra = require('cassandra-driver');
const SESSION_TIMEOUT = 60 * 60 * 24 * 7 // A week in seconds
const BOT_SESSION_TIMEOUT = 60 * 60 * 24 * 30 * 3 // 3 months in seconds
const DEFAULT_IMAGE = '/9j/4AAQSkZJRgABAQEASABIAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwAEAgMDAwIEAwMDBAQEBAUJBgUFBQULCAgGCQ0LDQ0NCwwMDhAUEQ4PEw8MDBIYEhMVFhcXFw4RGRsZFhoUFhcW/8AACwgAgACAAQERAP/EABwAAQACAwEBAQAAAAAAAAAAAAAGBwMEBQIBCP/EADgQAAICAQICBwQJAwUAAAAAAAABAgMEBREGIQcSEzFBUWFxgZGhFBUiMlKxweHwIzOyQmOCktH/2gAIAQEAAD8A/RQAAAAAAAAAAAAAAAAAAAAAAAAABkxaLsjIhRRXKy2x9WMYrdtk74a4Foqgr9Xfa2Nb9hCW0I+1rm37OXtJZhYGFhxUcbEopS/BWonrMw8TKj1cnFpuT8LK1L8yLcR8C4eRB3aVL6Nd39lJt1y/Vfl6EBzsa/Dyp4+TXKu2t7Si/AwgAAAAs7o84fhpmnrMyIL6Zet3uudUX3RXr5/DwJMACP8AHOg16xp0p1QSzKYt1S8ZL8D9H4eT95Vkk4ycZJxaezT70fAAAAdfgbBjn8T41M1vXCXaT9VHnt73sveW6AACqukvAjhcU2uEdoZMVckvN7qXzTfvOAAAACV9ECT4nu3S3WJLb/vAskAAFe9MiX1phPbn2Muf/IhoAAAO70cZccTi7H672jf1qm/Vrl80i1wAAVf0qZayeKpVRe6xao1vbz5yf+W3uI2AAAD1XOULIzhJxlFpxku9PzLc4R1erWdIryOsu2glG+K/0z/8fev2OsADncSanRpGl2ZlzTcVtXDfnOXgv54blQZV1mTk2ZF0utZbNynLzbe7MYAAAB0eGdSz9N1KNmApWTn9mVKTkrV5NItfSMi3LwoX3YluLOX3qrdusv2+HsNwGvqWRPFw53wxrciUVyqrScpFUcW6rqGqalKWdCVKr3UMdppVr2Px82coAAAA7/CHC2XrUlfY3Rhp87Guc/SK/Xu9pYui6Rp+lUKvCxlB7bSm1vKXtf8AEdAAGhrOk6fqtHZZuNCzZfZl3Tj7Jd6K74w4VytHbyKW78Pf+5t9qv0kv1/IjwAABIuAOHXrGY8jJTWHRJdf/cl+Ffr+5Z1VcKq1XXFRhBJRilskl4IyAAAx21wtrddkVKE01KMlumn4MrLpA4c+qMpZWLFvDulsl39lL8L9PL+bxwAA2NKw7tQ1GnCoW9l01Fb9y82/RLd+4uHSMKjTtOqwseO1dUeqn4t+Lfq3zNsAAAGrquHTn4FuHfFOu6PVfmvJr1T5lPaxhW6dqd+Ff9+mbjvt95eD962ZrAAm3Q/p6nfk6nOO6r/o1P1fOXy2+LJ8AAAACB9MGnJSxtUrjt1v6NrXxi/8vkQcAFs9HmKsXhLEW2zti7ZPz6z3Xy2O2AAAADi8e4v0zhPMhtzrr7WL8nH7T+Sa95UoALr0mpU6VjUpbKumEfhFI2QAAAAYNQgrsG+p81OqUfimikgf/9k='
const DEFAULT_IMAGE_BOT = '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'

let USER_NOT_FOUND_ERROR = new Error('User not found');
USER_NOT_FOUND_ERROR.code = 10000;
let USER_NOT_LOGGED_IN_ERROR = new Error('User not found or not logged in');
USER_NOT_LOGGED_IN_ERROR.code = 10001;
let FIELD_REQUIRED_ERROR = new Error('Fields required where left blank');
FIELD_REQUIRED_ERROR.code = 10002;
let TOKEN_INVALID_ERROR = new Error('Token was invalid');
TOKEN_INVALID_ERROR.code = 10003;

const NOTIFICATIONS_ON = 0;
const NOTIFICATIONS_SOMETIMES = 1;
const NOTIFICATIONS_OFF = 2;

function escapeCQL(str = '') {
    // Takes the string until the ';'
    let idx = str.indexOf(';');
    str = str.substring(0, idx < 0 ? str.length : idx);  // FIXME replace more cases
    return str;
}

function getRandomHEXPart() {
    // Random RGB part to hex
    var hexString = (Math.floor(Math.random() * 150 + 50)).toString(16);
    if (hexString.length % 2) {
        // Pad it of it's small
        hexString = '0' + hexString;
    }
    return hexString;
}

function createColor(){
    return getRandomHEXPart()+getRandomHEXPart()+getRandomHEXPart();
}

module.exports = class {
    constructor() {
        this.client = new cassandra.Client({ contactPoints: ['127.0.0.1:9042'], keyspace: 'hermes' })
    }

    // TODO: Make multiple channels (for now 'general' is always used)
    addMessage(user, message) {

        const query = 'INSERT INTO Messages (Channel, Username, Message, TimeSent) values(?,?,?,toTimestamp(now()));';
        let data = ['general', user, message];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }
	// TODO: Make multiple channels (for now 'general' is always used)
    deleteMessage(timestamp) {

        const query = 'DELETE FROM Messages WHERE channel=? and TimeSent=?;';
        let data = ['general', timestamp];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }
	
	// TODO: Make multiple channels (for now 'general' is always used)
    editMessage(message, newmessage, timesent) {

        const query = 'UPDATE Messages SET message=? WHERE channel=? and TimeSent=? IF message=?;';
        let data = [newmessage, 'general', timesent, message];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                resolve();
            }).catch(err => {
                reject(err);
            });
        });
    }

    getMessages() {
        const query = 'SELECT Username, Message, TimeSent FROM Messages WHERE channel=\'general\' ORDER BY TimeSent;';
        return new Promise((resolve, reject) => {
            this.client.execute(query, { prepare: true }).then(result => {
                resolve(result.rows);
            }).catch(err => {
                reject(err);
            });
        });
    }

    getMessagesFrom(timestamp) {
        const query = 'SELECT Username, Message, TimeSent FROM Messages WHERE channel=\'general\' and TimeSent>? ORDER BY TimeSent;';
        return new Promise((resolve, reject) => {
            let data = [timestamp];
            this.client.execute(query, data,{ prepare: true }).then(result => {
                resolve(result.rows);
            }).catch(err => {
                reject(err);
            });
        });
    }

    registerUser(user, passwordHash) {
        const query = 'INSERT INTO Users (UUID, Username, PasswordHash) values(now(),?,?) IF NOT EXISTS;';
        let data = [user, passwordHash];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                this.saveSettingWithUsername(user,createColor()).then(result => resolve()).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    registerBot(bot, passwordHash) {
        const query = 'INSERT INTO Users (UUID, Username, PasswordHash) values(now(),?,?) IF NOT EXISTS;';
        let data = [bot, passwordHash];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                this.saveSettingWithUsername(bot, createColor(), NOTIFICATIONS_OFF, DEFAULT_IMAGE_BOT)
                .then(result => resolve()).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    updatePasswordHash(user, passwordHash) {
        const query = 'SELECT UUID from Users where Username = ? ALLOW FILTERING;';
        let data = [user];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                let hashRow = result.first();
                if (hashRow) {
                    const newquery = 'UPDATE Users SET passwordHash=? WHERE UUID=? AND Username=?;';
                    let newdata = [passwordHash, hashRow.uuid, user];
                    this.client.execute(newquery, newdata, { prepare: true }).then(result => resolve()).catch(err => reject(err));
                } else {
                    reject(USER_NOT_FOUND_ERROR);
                }
            }).catch(err => reject(err));
        });

    }

    getPasswordHash(user) {
        const query = 'SELECT PasswordHash from Users where Username = ? ALLOW FILTERING;';
        let data = [user];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                let hashRow = result.first();
                if (hashRow) {
                    resolve(hashRow.passwordhash);
                } else {
                    reject(USER_NOT_FOUND_ERROR);
                }
            }).catch(err => reject(err));
        });
    }

    isntAlreadyRegistered(user) {
        const query = 'SELECT COUNT (*) as count from Users where Username = ? ALLOW FILTERING;';
        let data = [user];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                resolve(result.first().count.low == 0);
            }).catch(err => reject(err));
        });
    }

    isntBotAlreadyRegistered(bot) {
        const query = 'SELECT COUNT (*) as count from Users where Username = ? ALLOW FILTERING;';
        let data = [bot];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                resolve(result.first().count.low == 0);
            }).catch(err => reject(err));
        });
    }

    loginUser(user) {
        // FIXME: check if user is already logged in, to update it
        const query = 'INSERT INTO Sessions (UUID, Username) values(now(),?) IF NOT EXISTS USING TTL ?;';
        const uuid_query = 'SELECT UUID FROM Sessions WHERE Username = ? ALLOW FILTERING;';
        //let user_uuid = uuidv1();
        let data = [user, SESSION_TIMEOUT];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                this.client.execute(uuid_query, [user], {prepare: true}).then(result =>{
                    resolve(result.first().uuid.toString());
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    loginBot(bot) {
        // FIXME: check if bot is already logged in, to update it
        const query = 'INSERT INTO Sessions (UUID, Username) values(now(),?) IF NOT EXISTS USING TTL ?;';
        const uuid_query = 'SELECT UUID FROM Sessions WHERE Username = ? ALLOW FILTERING;';
        //let user_uuid = uuidv1();
        let data = [bot, BOT_SESSION_TIMEOUT];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                this.client.execute(uuid_query, [bot], {prepare: true}).then(result =>{
                    resolve(result.first().uuid.toString());
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    getUserForUUID(uuid) {
        const query = 'SELECT Username FROM Sessions WHERE UUID=?';
        let data = [uuid];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                let userRow = result.first();
                if (userRow) {
                    resolve(userRow.username);
                } else {
                    reject(USER_NOT_LOGGED_IN_ERROR);
                }
            }).catch(err => reject(err));
        });
    }

    updateLoggedInUser(uuid) {
        const query = 'INSERT INTO Sessions (UUID, Username) values(?,?) USING TTL ?';
        return new Promise((resolve, reject) => {
            this.getUserForUUID(uuid).then(user => {
                let data = [uuid, user, SESSION_TIMEOUT];
                this.client.execute(query, data, { prepare: true }).then(result => {
                    resolve();
                }).catch(err => reject(err));
            }).catch(err => reject(err));

        });
    }

    checkLoggedInUser(uuid) {
        const query = 'SELECT UUID FROM sessions WHERE UUID=?;';
        let data = [uuid];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                let uuidRow = result.first();
                if (uuidRow) {
                    resolve(uuidRow.uuid);
                } else {
                    reject(USER_NOT_LOGGED_IN_ERROR);
                }
            }).catch(err => reject(err));
        });
    }

    logoutUser(uuid) {
        const query = 'DELETE FROM Sessions WHERE UUID=?;';
        let data = [uuid];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => resolve()).catch(err => reject(err));
        });
    }

    clear(table) {
        const query = 'TRUNCATE ' + escapeCQL(table) + ';';
        return new Promise((resolve, reject) => {
            this.client.execute(query).then(result => resolve()).catch(err => reject(err));
        });
    }

    saveSettingWithUsername(username, color, notifications = NOTIFICATIONS_ON, image_b64 = DEFAULT_IMAGE, dark = false) {
        const query = 'SELECT UUID FROM Users WHERE Username=? allow filtering;';
        let data = [username];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                let uuidRow = result.first();
                if (uuidRow) {
                    this.saveSetting(uuidRow.uuid, username, color, notifications, image_b64, dark).then(() => {
                        resolve();
                    }).catch(err => reject(err));
                } else {
                    reject(USER_NOT_FOUND_ERROR);
                }
            }).catch(err => reject(err));
        });
    }

    saveSettingWithUUID(uuid, color, notifications = NOTIFICATIONS_ON, image_b64 = DEFAULT_IMAGE, dark = false) {
        const query = 'SELECT Username FROM Users WHERE UUID=?;';
        let data = [uuid];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                let userRow = result.first();
                if (userRow) {
                    this.saveSetting(uuid, userRow.username, color, notifications, image_b64, dark).then(() => {
                        resolve();
                    }).catch(err => reject(err));
                } else {
                    reject(USER_NOT_LOGGED_IN_ERROR);
                }
            }).catch(err => reject(err));
        });
    }

    saveSetting(uuid, username, color, notifications = NOTIFICATIONS_ON, image_b64 = DEFAULT_IMAGE, dark = false) {
        const query = 'INSERT INTO Settings (UUID, Username, Color, Notifications, Image, dark) values(?,?,?,?,textAsBlob(?),?);';
        return new Promise((resolve, reject) => {
            let data = [uuid, username, color, notifications, image_b64, dark];
            //console.log(data);
            this.client.execute(query, data, { prepare: true }).then(result => {
                resolve();
            }).catch(err => reject(err));
        });
    }

    getSettingUUID(uuid) {
        return this.getSetting(uuid);
    }

    getSettingUsername(username) {
        return this.getSetting(undefined, username);
    }

    getSetting(uuid = undefined, username = undefined) {
        if (uuid) {
            const query = 'SELECT color, notifications, blobAsText(image) as image, dark FROM Settings WHERE uuid=?;';
            return new Promise((resolve, reject) => {
                let data = [uuid];
                this.client.execute(query, data, { prepare: true }).then(result => {
                    let userRow = result.first();
                    if (userRow) {
                        resolve([userRow.color, userRow.notifications, userRow.image, userRow.dark]);
                    } else {
                        reject(USER_NOT_FOUND_ERROR);
                    }
                }).catch(err => reject(err));
            });
        } else if (username) {
            const query = 'SELECT color, notifications, blobAsText(image) as image, dark FROM Settings WHERE username=? ALLOW FILTERING;';
            return new Promise((resolve, reject) => {
                let data = [username];
                this.client.execute(query, data, { prepare: true }).then(result => {
                    let userRow = result.first();
                    if (userRow) {
                        resolve([userRow.color, userRow.notifications, userRow.image, userRow.dark]);
                    } else {
                        reject(USER_NOT_FOUND_ERROR);
                    }
                }).catch(err => reject(err));
            });
        } else {
            return new Promise((resolve, reject) => {
                reject(FIELD_REQUIRED_ERROR);
            });
        }
    }

    checkToken(token) {
        const query = 'SELECT COUNT (*) AS count FROM tokens WHERE UUID=?;';
        let data = [token];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => {
                if (result.first().count.low > 0) {
                    resolve();
                } else {
                    reject(TOKEN_INVALID_ERROR);
                }

            }).catch(err => reject(err));
        });
    }
}