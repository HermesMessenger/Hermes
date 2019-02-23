/**
 * A function that converts a TimeUUID to a timestamp
 * @param {String} UUID The UUID
 * @returns {Date} The timestamp
 */
function toTimestamp(uuid) {
    uuid = uuid.split('-')
    let time = [
        uuid[2].substring(1),
        uuid[1],
        uuid[0]
    ].join('')

    time = parseInt(time, 16) - 122192928000000000 / 10000
    return new Date(time)
}

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

function sendNotifiaction(user, message, image) {
    if (notifications_allowed && notifications_supported && !(ifvisible.now())) {
        new Notification(user, {
            body: message,
            icon: image
        })
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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

function escapeStringForCSS(string){
    return string
        .replace(/[ ]/g, "space")
        .replace(/[:]/g, "colon")
        .replace(/[.]/g, "dot")
        .replace(/[#]/g, "hashtag")
        .replace(/[{]/g, "openkey")
        .replace(/[}]/g, "closekey")
        .replace(/\[/g, "openbracket")
        .replace(/\]/g, "closebracket")
        .replace(/\$/g, "dollarsign")
        .replace(/[@]/g, "at")
        .replace(/[;]/g, "semicolon")
        .replace(/[!]/g, "exclamation");
}

function parseQuote(context) {
    let b = context.find("#m-username")
    let message_body = context.find("#m-body");
    let res = b.text() + message_body.html();

    res = res.replace(/"([^:]+):  "/, '')
    return ` "${HTMLtoMD(res)}" `
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
            if (callback)  callback(xmlHttp.responseText);
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
            if (callback)  callback(xmlHttp.responseText, xmlHttp.status);
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
            if (callback)  callback(xmlHttp.responseText);
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
            if (callback)  callback(xmlHttp.responseText, xmlHttp.status);
    }
    xmlHttp.open("POST", theUrl, true); // true for asynchronous
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(JSON.stringify(jsonData));
}

//#region Textarea Lines
/** @type {HTMLTextAreaElement} */
var _buffer;

/**
* Returns the lines in a textarea, including wrapped lines.
*
* __NOTE__:
* [textarea] should have an integer line height to avoid rounding errors.
*/
function countTextareaLines(textarea) {
    if (_buffer == null) {
        _buffer = document.createElement('textarea');
        _buffer.style.border = 'none';
        _buffer.style.height = '0';
        _buffer.style.overflow = 'hidden';
        _buffer.style.padding = '0';
        _buffer.style.position = 'absolute';
        _buffer.style.left = '0';
        _buffer.style.top = '0';
        _buffer.style.zIndex = '-1';
        document.body.appendChild(_buffer);
    }

    var cs = window.getComputedStyle(textarea);
    var pl = parseInt(cs.paddingLeft);
    var pr = parseInt(cs.paddingRight);
    var lh = parseInt(cs.lineHeight);

    // [cs.lineHeight] may return 'normal', which means line height = font size.
    if (isNaN(lh)) lh = parseInt(cs.fontSize);

    // Copy content width.
    _buffer.style.width = (textarea.clientWidth - pl - pr) + 'px';

    // Copy text properties.
    _buffer.style.font = cs.font;
    _buffer.style.letterSpacing = cs.letterSpacing;
    _buffer.style.whiteSpace = cs.whiteSpace;
    _buffer.style.wordBreak = cs.wordBreak;
    _buffer.style.wordSpacing = cs.wordSpacing;
    _buffer.style.wordWrap = cs.wordWrap;

    // Copy value.
    _buffer.value = textarea.value;

    var result = Math.floor(_buffer.scrollHeight / lh);
    if (result == 0) result = 1;
    return result;
}
//#endregion
function toFragment(html){
    var temp = document.createElement('template');
    temp.innerHTML = html;
    return temp.content;
}

String.prototype.replaceIndex=function(findex, tindex, replacement) {
    return this.substr(0, findex) + replacement+ this.substr(tindex);
}

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};