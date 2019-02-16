const fs = require('fs');
const fileExists = require('file-exists');
const TimeUUID = require('cassandra-driver').types.TimeUuid;
const configTemplate = {
    generalToken: `${new TimeUUID()}`,
    mainIP: "localhost:8080",
    port: 8080
};

function writeJSON(json = {}){
    let config = configTemplate;
    for(key of Object.keys(config)){
        if(json[key]){
            config[key] = json[key]
        }
    }
    fs.writeFile('config.json', JSON.stringify(config, null, '\t'), function (err) {
        if (err) throw err;
        console.log('config.json created');
    });
}

fileExists('config.json',(err,exists) => {
    if(err) throw err;
    if(exists) {
        const config = require('../config.json');
        let config_correct = true;
        for(key of Object.keys(configTemplate)){
            if(!config[key]){
                config_correct = false;
            }
        }
        if(!config_correct){
            console.log('Something\'s missing in config.json, recreating it')
            writeJSON(config);
        }else{
            console.log('config.json is correct');
        }
    }else{
        writeJSON();
    }
});