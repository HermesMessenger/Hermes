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

module.exports.getThemes = function () {
    const fs = require('fs');
    let themes = [];
    let base_path = 'web_client/scss/themes';
    let files = fs.readdirSync(base_path);
    for (let file of files) {
        if (file.endsWith('.scss')) {
            let first_line = fs.readFileSync(`${base_path}/${file}`, { encoding: 'utf8' }).split('\n')[0].trim();
            let n_theme = {
                theme_name: file.replace(/\.scss$/, ''),
                display_name: file.replace(/\.scss$/, '')
            }
            if (/^\/\/.+/.test(first_line)) {
                n_theme.display_name = first_line.substring(2).trim();
            }
            themes.push(n_theme);
        }
    }
    return themes;
}
// This three functions are from StackOverflow, they're for converting the binary number in a string to a 
// decimal number in a string, because IPv6 int representations are too big for the JS number type, so
// we're using the BigInt type

function parseBigInt(bigint, base) {
    //convert bigint string to array of digit values
    for (var values = [], i = 0; i < bigint.length; i++) {
        values[i] = parseInt(bigint.charAt(i), base);
    }
    return values;
}

function formatBigInt(values, base) {
    //convert array of digit values to bigint string
    for (var bigint = '', i = 0; i < values.length; i++) {
        bigint += values[i].toString(base);
    }
    return bigint;
}

function convertBase(bigint, inputBase, outputBase) {
    //takes a bigint string and converts to different base
    var inputValues = parseBigInt(bigint, inputBase),
        outputValues = [], //output array, little-endian/lsd order
        remainder,
        len = inputValues.length,
        pos = 0,
        i;
    while (pos < len) { //while digits left in input array
        remainder = 0; //set remainder to 0
        for (i = pos; i < len; i++) {
            //long integer division of input values divided by output base
            //remainder is added to output array
            remainder = inputValues[i] + remainder * inputBase;
            inputValues[i] = Math.floor(remainder / outputBase);
            remainder -= inputValues[i] * outputBase;
            if (inputValues[i] == 0 && i == pos) {
                pos++;
            }
        }
        outputValues.push(remainder);
    }
    outputValues.reverse(); //transform to big-endian/msd order
    return formatBigInt(outputValues, outputBase);
}

module.exports.ipToInt = function (ip) {
    const ipAddr = require('ipaddr.js');
    try {
        let ipObj = ipAddr.parse(ip);
        if (ipObj.kind() == 'ipv6') {
            // For ipv6 
            let parts = [];
            ipObj.parts.forEach(function (it) {
                let bin = it.toString(2);
                while (bin.length < 16) {
                    bin = "0" + bin;
                }
                parts.push(bin);
            })
            let bin = parts.join("");
            let dec = BigInt(convertBase(bin, 2, 10));
            return dec;
        } else if (ipObj.kind() == 'ipv4') { // TODO Convert IPv4 to IPv6
            // To change to IPv6:
            // ipToInt(`::ffff:${ip}`); // Call this function with the IPv6 version
            let ipOctets = ipObj.octets;
            return BigInt((ipOctets[0] << 24) + (ipOctets[1] << 16) + (ipOctets[2] << 8) + (ipOctets[3]));
        } else {
            return // Something strange happened
        }
    } catch (err) {
        return // Invalid IP
    }
}