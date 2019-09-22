const fs = require('fs');
const TimeUUID = require('cassandra-driver').types.TimeUuid;
const webPush = require('web-push');

const configTemplate = {
    //generalToken: (new TimeUUID()).toString(),
    //mainIP: "localhost:8080",
    port: 8080,
    //forceHAConnect: false,
    webPush: webPush.generateVAPIDKeys(), // Creates object with publicKey and privateKey 
    db: {
        hosts: ['127.0.0.1:9042'], // Default localhost Cassandra URL
        username: 'cassandra', // Default Cassandra username & password
        password: 'cassandra',
        datacenter: 'datacenter1'
    }
};

function checkObject(obj, template, name = 'object', fix=false, info = true, path = '') {
    let correct = true;
    let correctedObj = {...template}; // Copy the template
    for (let key in template) {
        if (typeof obj[key] !== typeof template[key]) {
            if (info && obj[key] === undefined){
                console.log(`[prepare-project] ${path}${key} is missing from ${name}`);
                if(fix) {
                    console.log(`[prepare-project] Adding ${path}${key}`)
                }
            }
            if (info && obj[key]){
                console.log(`[prepare-project] ${path}${key} isn't the correct type set in ${name}. It should be ${typeof template[key]}, but it is ${typeof obj[key]}`);
                if(fix) {
                    console.log(`[prepare-project] Changing ${path}${key} from ${typeof obj[key] == 'string'?`"${obj[key]}"`:obj[key]} to ${typeof template[key] == 'string'?`"${template[key]}"`:template[key]}`)
                }
            }
            //console.log(key, false);
            correct = false;
        } else if ((typeof obj[key]) === 'object') {
            robj = checkObject(obj[key], template[key], name, fix, info, `${path}${key}.`)
            if (correct) {
                correct = robj.correct
            }
            if(fix){
                correctedObj[key] = robj.correctedObj
            }
        }else if(fix){
            correctedObj[key] = obj[key]
        }
    }
    return {correct, correctedObj}
}

fs.access('config.json', err => {
    if (!err) {
        const config = require('../config.json');
        let config_correct = checkObject(config, configTemplate, 'config', fix=true);
        /*for (key of Object.keys(configTemplate)) {
            if (config[key] == undefined) {
                console.log(`[prepare-project] ${key} is missing from config.json`);
                config_correct = false;
                if(key == 'global_channel_uuid'){
                    console.log('[prepare-project] Please set the global channel UUID')
                }
            }
        }*/
        if (config_correct.correct) {
            console.log('[prepare-project] config.json is correct');
        } else {
            console.log('[prepare-project] Writing fixed config')
            writeJSON(config_correct.correctedObj);
        }
    } else {
        console.log('[prepare-project] config.json is misssing');
        writeJSON(configTemplate);
    }
});

function writeJSON(json) {
    //console.log(json)
    fs.writeFileSync('config.json', JSON.stringify(json, null, '\t'))
}