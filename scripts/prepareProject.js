const fs = require('fs');
const fileExists = require('file-exists');
const TimeUUID = require('cassandra-driver').types.TimeUuid;
const webPush = require('web-push');

const configTemplate = {
    generalToken: (new TimeUUID()).toString(),
    mainIP: "localhost:8080",
    port: 8080,
    forceHAConnect: false,
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
            if (info && !obj[key]){
                console.log(`${path}${key} is missing from ${name}`);
                if(fix) console.log(`Adding ${path}${key}`)
            }
            if (info && obj[key]){
                console.log(`${path}${key} isn't the correct type set in ${name}. It should be ${typeof template[key]}, but it is ${typeof obj[key]}`);
                if(fix) console.log(`Changing ${path}${key} from ${typeof obj[key] == 'string'?`"${obj[key]}"`:obj[key]} to ${typeof template[key] == 'string'?`"${template[key]}"`:template[key]}`)
            }
            
            correct = false;
        } else if ((typeof obj[key]) === 'object') {
            robj = checkObject(obj[key], template[key], name, fix, info, `${path}${key}.`)
            correct = robj.correct
            if(fix){
                correctedObj[key] = robj.correctedObj
            }
        }else if(fix){
            correctedObj[key] = obj[key]
        }
    }
    return {correct, correctedObj};
}

fileExists('config.json', (err, exists) => {
    if (err) throw err;
    let config_o = {...configTemplate} // Cloning the object
    let config_correct = false;
    
    if (exists) {
        const config = require('../config.json');
        let o = checkObject(config, configTemplate, 'config.json', true)
        config_correct = o.correct
        config_o = o.correctedObj
        if (config_correct) {
            console.log('config.json is correct');
        }
    } else {
        console.log('config.json is misssing');
    }
    if(!config_correct){
        fs.writeFile('config.json', JSON.stringify(config_o, null, '\t'), err => {
            if (err) throw err;
            console.log(`config.json ${exists?'updated':'created'}`);
        });
    }
});