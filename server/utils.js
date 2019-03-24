const Request = require('request-promise')

module.exports.getNowStr = function () {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return day + "/" + month + "/" + year + "$" + hour + ":" + min + ":" + sec;
}

module.exports.getCurrentTimeStamp = function () {
    return parseInt(new Date()); // Gets the UNIX timestamp in milliseconds
}

/**
* A function that sends API requests
* @param {String} method The HTTP method to send the request with (GET, POST, etc.)
* @param {String} location The sub URL to send the request to (api/sendmessage)
* @param {Object} formData (Optional) Data to send in the body of the request
*/
module.exports.request = async function (method, location, formData) {
    // the 3rd or 4th argument could be a callback
    let callback
    if (typeof arguments[3] == 'function') {
        callback = arguments[3]
    } else if (typeof arguments[2] == 'function') {
        callback = arguments[2]
        formData = null
    }

    let options = {
        method: method,
        uri: location,
        body: formData,
        json: true,
        resolveWithFullResponse: true,
        simple: false
    }

    try {
        const res = await Request(options)
        if (res) {
            if (res.statusCode == 200) {
                if (callback) {
                    callback(null, res.body)
                }
                return res.body
            } else if (res.statusCode == 418) {
                return '418'
            } else {
                throw new Error('Bad status code: ' + res.statusCode)
            }
        }
    } catch (err) {
        if (err.name == 'RequestError') {
            console.error("Error: Can't connect to IP. ")
        }
    }

}

module.exports.getThemes = function(){
    const fs = require('fs');
    let themes = [];
    let base_path = 'web_client/scss/themes';
    let files = fs.readdirSync(base_path);
    for(let file of files){
        if(file.endsWith('.scss')){
            let first_line = fs.readFileSync(`${base_path}/${file}`, {encoding: 'utf8'}).split('\n')[0].trim();
            if(/^\/\/.+/.test(first_line)){
                let n_theme = {
                    theme_name: file.replace(/\.scss$/,''),
                    display_name: first_line.substring(2).trim()
                }
                themes.push(n_theme);
            }
        }
    }
    return themes;
}