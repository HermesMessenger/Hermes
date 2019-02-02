function getRandomRGBPart() {
    return Math.floor(Math.random() * 150 + 50);
}

/**
 * A function that pads a number to have a zero if it is below ten
 * @param {Number} n The number to pad
 * @returns {String} The padded number
 */
function padNumber(n) {
    if (n < 10) {
        return '0' + n;
    }
    return n.toString();
}

/**
 * Check if app is running through Electron or not
 */
function isElectron() {
    return navigator.userAgent.indexOf('Electron') !== -1;
}

function setTheme(theme){
    location.assign('/setTheme/'+theme);
}

function getCookie(cname) { // From W3Schools
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/**
 * A function that makes a GET request to a url
 *  @param {String} theUrl: the url to make the GET request to
 *  @returns {String} The response text
 */
function httpGetSync(theUrl){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

/**
 * A function that makes a GET request to a url and only calls back if the response was 200
 *  @param {String} theUrl: the url to make the GET request to
 *  @param {function(String):void} callback: the function to be called with the responseText data
 */
function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

/**
 * A function that makes a GET request to a url and the response status
 *  @param {String} theUrl: the url to make the GET request to
 *  @param {function(String, int):void} callback: the function to be called with the responseText data & the status
 */
function httpGetStatusAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4)
            callback(xmlHttp.responseText, xmlHttp.status);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

/**
 * A function that makes a POST request to a url with some json data and only calls back if the response was 200
 *  @param {String} theUrl: the url to make the POST request to
 *  @param {JSON} jsonData: the data of the header, in json format
 *  @param {function(String):void} callback: thse function to be called with the responseText data
 */
function httpPostAsync(theUrl, jsonData, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(JSON.stringify(jsonData));
}

/**
 * A function that makes a POST request to a url with some json data and the response status
 *  @param {String} theUrl: the url to make the POST request to
 *  @param {JSON} jsonData: the data of the header, in json format
 *  @param {function(String, int):void} callback: thse function to be called with the responseText data & the status
 */
function httpPostStatusAsync(theUrl, jsonData, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState == 4)
            callback(xmlHttp.responseText, xmlHttp.status);
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(JSON.stringify(jsonData));
}