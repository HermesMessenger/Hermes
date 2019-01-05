const cassandra = require('cassandra-driver');
const SESSION_TIMEOUT = 60 * 60 * 24 * 7 // A week in seconds
const BOT_SESSION_TIMEOUT = 60 * 60 * 24 * 30 * 3 // 3 months in seconds
const DEFAULT_IMAGE = '/9j/4AAQSkZJRgABAQEASABIAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwAEAgMDAwIEAwMDBAQEBAUJBgUFBQULCAgGCQ0LDQ0NCwwMDhAUEQ4PEw8MDBIYEhMVFhcXFw4RGRsZFhoUFhcW/8AACwgAgACAAQERAP/EABwAAQACAwEBAQAAAAAAAAAAAAAGBwMEBQIBCP/EADgQAAICAQICBwQJAwUAAAAAAAABAgMEBREGIQcSEzFBUWFxgZGhFBUiMlKxweHwIzOyQmOCktH/2gAIAQEAAD8A/RQAAAAAAAAAAAAAAAAAAAAAAAAABkxaLsjIhRRXKy2x9WMYrdtk74a4Foqgr9Xfa2Nb9hCW0I+1rm37OXtJZhYGFhxUcbEopS/BWonrMw8TKj1cnFpuT8LK1L8yLcR8C4eRB3aVL6Nd39lJt1y/Vfl6EBzsa/Dyp4+TXKu2t7Si/AwgAAAAs7o84fhpmnrMyIL6Zet3uudUX3RXr5/DwJMACP8AHOg16xp0p1QSzKYt1S8ZL8D9H4eT95Vkk4ycZJxaezT70fAAAAdfgbBjn8T41M1vXCXaT9VHnt73sveW6AACqukvAjhcU2uEdoZMVckvN7qXzTfvOAAAACV9ECT4nu3S3WJLb/vAskAAFe9MiX1phPbn2Muf/IhoAAAO70cZccTi7H672jf1qm/Vrl80i1wAAVf0qZayeKpVRe6xao1vbz5yf+W3uI2AAAD1XOULIzhJxlFpxku9PzLc4R1erWdIryOsu2glG+K/0z/8fev2OsADncSanRpGl2ZlzTcVtXDfnOXgv54blQZV1mTk2ZF0utZbNynLzbe7MYAAAB0eGdSz9N1KNmApWTn9mVKTkrV5NItfSMi3LwoX3YluLOX3qrdusv2+HsNwGvqWRPFw53wxrciUVyqrScpFUcW6rqGqalKWdCVKr3UMdppVr2Px82coAAAA7/CHC2XrUlfY3Rhp87Guc/SK/Xu9pYui6Rp+lUKvCxlB7bSm1vKXtf8AEdAAGhrOk6fqtHZZuNCzZfZl3Tj7Jd6K74w4VytHbyKW78Pf+5t9qv0kv1/IjwAABIuAOHXrGY8jJTWHRJdf/cl+Ffr+5Z1VcKq1XXFRhBJRilskl4IyAAAx21wtrddkVKE01KMlumn4MrLpA4c+qMpZWLFvDulsl39lL8L9PL+bxwAA2NKw7tQ1GnCoW9l01Fb9y82/RLd+4uHSMKjTtOqwseO1dUeqn4t+Lfq3zNsAAAGrquHTn4FuHfFOu6PVfmvJr1T5lPaxhW6dqd+Ff9+mbjvt95eD962ZrAAm3Q/p6nfk6nOO6r/o1P1fOXy2+LJ8AAAACB9MGnJSxtUrjt1v6NrXxi/8vkQcAFs9HmKsXhLEW2zti7ZPz6z3Xy2O2AAAADi8e4v0zhPMhtzrr7WL8nH7T+Sa95UoALr0mpU6VjUpbKumEfhFI2QAAAAYNQgrsG+p81OqUfimikgf/9k='


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
        const query = 'INSERT INTO Bots (UUID, Botname, PasswordHash) values(now(),?,?) IF NOT EXISTS;';
        let data = [bot, passwordHash];
        return new Promise((resolve, reject) => {
            this.client.execute(query, data, { prepare: true }).then(result => resolve()).catch(err => reject(err));
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
        const query = 'SELECT COUNT (*) as count from Bots where Botname = ? ALLOW FILTERING;';
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