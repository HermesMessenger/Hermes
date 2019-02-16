const fs = require('fs');
const fileExists = require('file-exists');
const TimeUUID = require('cassandra-driver').types.TimeUuid;
const configTemplate = 
`{
    "generalToken": "${new TimeUUID()}",
    "mainIP": "localhost:8080"
}`;

fileExists('config.json',(err,exists) => {
    if(err) throw err;
    if(!exists) {
        fs.writeFile('config.json', configTemplate, function (err) {
            if (err) throw err;
            console.log('config.json created');
        });
    }
});