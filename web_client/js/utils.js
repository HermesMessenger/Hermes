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

function removeFormatting(message) {
    return message
        .replace(/("(.+?): (.+)") /g, '')
        .replace(/(\*\*(.+?)\*\*)/g, '$2')
        .replace(/(\*(.+?)\*)/g, '$2')
        .replace(/(?:[^*]|^)(\*([^*](?:.*?[^*])?)\*)(?:[^*]|$)/g, '$2')
        .replace(/~(.+?)~/g, '$2')
        .replace(/\[(.+?)\]\(((?:http:\/\/|https:\/\/).+?)\)/g, '$1')
        .replace(/`(.+?)`/g, '$2')
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

function setTheme(theme) {
    location.assign('/setTheme/' + theme);
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

function escapeStringForCSS(string) {
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
    return `"${HTMLtoMD(res)}" `
}

function quoteOnClick(message_id) {
    let message = document.getElementById(message_id);
    window.scroll({
        top: $(message).offset().top - $(message).height() - $('#menutop').height(),
        left: 0,
        behavior: 'smooth',
        speed: 'slow'
    })
    let background = $(message).css("background-color");
    $(message).toggleClass("highlight_message");
    $(message).animate({
        backgroundColor: background,
        queue: false
    }, 400, function () {
        $(message).css("background-color", '');
        $(message).toggleClass("highlight_message");
    });
}

function replaceLinks(html_element) {
    const linkREGEX = /([\w\d]+):\/\/([\w\d\.-]+)\.([\w\d]+)\/?([\w\d-@:%_\+.~#?&/=]*)/g;

    for (let node of html_element.childNodes) {
        if (node.childNodes.length == 0) { // If the element doesn't have children:
            let content = node.nodeValue; // get the elements text
            let last_change_index = -1; // We use this so that we don't override the href property in the HTML
            // Find every link in the content
            while (match = linkREGEX.exec(content)) {
                // if its past the last edit && it's not a MD-link or MD-link-explicit
                if (match.index > last_change_index && !html_element.classList.contains('MD-link') && !html_element.classList.contains('MD-link-explicit')) {
                    let link = match[0] // get the whole link
                    let link_jquery = $(`<a class="MD-link-explicit" href="${link}" target="_blank">`).text(link) // replace it with an actual link
                    content = content.replaceIndex(match.index, match.index + match[0].length, link_jquery[0].outerHTML) // replace the current link found with the HTML generated

                    last_change_index = match.index + link_jquery[0].outerHTML.length; // Update the last edit index
                }

            }
            html_element.replaceChild(toFragment(content), node) // Replace the current element with a list(Fragment) of the elements generated in HTML

        } else {
            replaceLinks(node); // If it has more than of child, apply this function
        }
    }
}

/**
 * A function that makes a GET request to a url
 *  @param {String} theUrl: the url to make the GET request to
 *  @returns {String} The response text
 */
function httpGetSync(theUrl) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", theUrl, false); // false for synchronous request
    xmlHttp.send(null);
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
            if (callback) callback(xmlHttp.responseText);
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
            if (callback) callback(xmlHttp.responseText, xmlHttp.status);
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
            if (callback) callback(xmlHttp.responseText);
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
            if (callback) callback(xmlHttp.responseText, xmlHttp.status);
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
function toFragment(html) {
    var temp = document.createElement('template');
    temp.innerHTML = html;
    return temp.content;
}

String.prototype.replaceIndex = function (findex, tindex, replacement) {
    return this.substr(0, findex) + replacement + this.substr(tindex);
}

Array.prototype.remove = function () {
    var what, a = arguments,
        L = a.length,
        ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);

var swipe_right_handler = function () {}
var swipe_left_handler = function () {}

var swipe_up_handler = function () {}
var swipe_down_handler = function () {}

var xDown = null;
var yDown = null;

function getTouches(evt) {
    return evt.touches || evt.originalEvent.touches; // jQuery
}

function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
};

function handleTouchMove(evt) {
    if (!xDown || !yDown) {
        return;
    }

    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = xDown - xUp;
    var yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
        /*most significant*/
        if (xDiff > 0) {
            swipe_left_handler();
        } else {
            swipe_right_handler();
        }
    } else {
        if (yDiff > 0) {
            swipe_up_handler();
        } else {
            swipe_down_handler();
        }
    }
    /* reset values */
    xDown = null;
    yDown = null;
};