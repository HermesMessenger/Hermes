const fs = require('fs');
const fileExists = require('file-exists');
const TimeUUID = require('cassandra-driver').types.TimeUuid;
const webPush = require('web-push');

const configTemplate = {
    generalToken: new TimeUUID(),
    mainIP: "localhost:8080",
    port: 8080,
    forceHAConnect: false,
    webPush: webPush.generateVAPIDKeys(), // Creates object with publicKey and privateKey 
    db: {
        hosts: ['127.0.0.1:9042'], // Default localhost Cassandra URL
        username: 'cassandra', // Default Cassandra username & password
        password: 'cassandra'
    }
};

function writeJSON(json = {}) {
    let config = configTemplate;
    for (key of Object.keys(config)) {
        if (json[key]) {
            config[key] = json[key]
        }
    }
    fs.writeFile('config.json', JSON.stringify(config, null, '\t'), err => {
        if (err) throw err;
        console.log('config.json created');
    });
}

fileExists('config.json', (err, exists) => {
    if (err) throw err;
    if (exists) {
        const config = require('../config.json');
        let config_correct = true;
        for (key of Object.keys(configTemplate)) {
            if (config[key] == undefined) {
                console.log(`${key} is missing from config.json`);
                config_correct = false;
                if(key == 'global_channel_uuid'){
                    console.log('Please set the global channel UUID')
                }
            }
        }
        if (!config_correct) {
            writeJSON(config);
        } else {
            console.log('config.json is correct');
        }
    } else {
        console.log('config.json is misssing');
        writeJSON();
    }
});