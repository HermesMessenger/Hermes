const fs = require('fs');
const fileExists = require('file-exists');
const TimeUUID = require('cassandra-driver').types.TimeUuid;
const configTemplate = 
`{
    "generalToken": "${new TimeUUID()}",
    "mainIP": "localhost:8080",
    "port": 8080
}`;

function writeJSON(){
    fs.writeFile('config.json', configTemplate, function (err) {
        if (err) throw err;
        console.log('config.json created');
    });
}

fileExists('config.json',(err,exists) => {
    if(err) throw err;
    if(exists) {
        const config = require('../config.json');
        if(!config.port || !config.mainIP || !config.generalToken){
            writeJSON();
        }else{
            console.log('config.json correct');
        }
    }else{
        writeJSON();
    }
});