const quoteREGEX = /"(message-([0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}))"/

function loadChannels(closesidebar=true){
    httpPostAsync('/api/getChannels/', uuid_header, data => {
        my_channels = JSON.parse(data);
        $('#chats').empty()
        for (let channel of my_channels) {
            let new_channel = $('<li class="chatselect">');
            new_channel.attr('data-channel', channel.uuid);
            new_channel.append($('<img class="chatimg">').attr('src', `data:image/png;base64,${channel.icon}`));
            new_channel.append($('<p class="chatname">').text(channel.name));
            new_channel.click(() => changeChatTo(channel.uuid));
            $('#chats').append(new_channel)
        }

        changeChatTo(current_channel,closesidebar);
    });
}

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

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    document.execCommand('copy');
    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text)
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

function deleteCookie(name) {
    document.cookie = name + '=; Max-Age=-99999999;';
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

function removeFormatting(message) {
    return message
        .replace(quoteREGEX, '')
        .replace(/(\*\*([\S\s]+?)\*\*)/g, '$2')
        .replace(/(\*([\S\s]+?)\*)/g, '$2')
        .replace(/(?:[^*]|^)(\*([^*](?:.*?[^*])?)\*)(?:[^*]|$)/g, '$2')
        .replace(/~([\S\s]+?)~/g, '$1')
        .replace(/\[([\S\s]+?)\]\(((?:http:\/\/|https:\/\/).+?)\)/g, '$1')
        .replace(/`([\S\s]+?)`/g, '$1')
        .replace(/\|\|([\S\s]+?)\|\|/g, '$1')
}

function createQuoteHTML(message_id, loadedMessages = undefined) {
    let quoted_user;
    let quoted_message;
    let messageFound = false;
    $('#messages').find('#' + message_id).each(function (i) {
        messageFound = true;
        quoted_user = $(this).find('#m-username').text();
        quoted_message = `${quoted_user}${$(this).find('#m-body').text()}`
        quoted_user = quoted_user.substring(0, quoted_user.length - 2)
    })
    if (!messageFound && loadedMessages !== undefined) {
        loadedMessages.find('#' + message_id).each(function (i) {
            messageFound = true;
            quoted_user = $(this).find('#m-username').text();
            quoted_message = `${quoted_user}: ${$(this).find('#m-body').text()}`
        })
    }
    // TODO get the message from the server
    if (messageFound) {
        // Create the css for the quote

        // Replace all the unvalid charaters in css IDs
        let quoted_user_id = escapeStringForCSS(quoted_user);

        let quote_css =
            `.quote.user-${quoted_user_id.toLowerCase()} {
            border-left: 4px ${users[quoted_user.toLowerCase()].color} solid;
            background-color: ${users[quoted_user.toLowerCase()].color}50;
        }`
        // Create the quote span
        let quoteSpan = $(`<span class="quote user-${quoted_user_id.toLowerCase()}" onclick="quoteOnClick('#${message_id}')" data-quoted-id="${message_id}" >`).append(MDtoHTML(quoted_message));

        // Check if the CSS for the current user already exists
        let cssRuleExists = false;
        let css = $('#hermes_style')[0].sheet;

        for (var r = 0; r < css.cssRules.length; r++) {
            if (css.cssRules[r].selectorText) {
                if (css.cssRules[r].selectorText.includes(`.user-${quoted_user_id.toLowerCase()}`)) {
                    cssRuleExists = true;
                    break
                }
            }
        }

        if (!cssRuleExists) {
            css.insertRule(quote_css);
        }

        return quoteSpan[0];

    }
    return undefined;
}

function quote(id) {
    removeSQuote();
    addSQuote(id);
    $("#m").focus()
}

function removeSQuote() {
    $('#s-quote').text('')
    $('#s-quote').attr('data-quoted-id', '')
    $('#s-quote').hide()
    resizeInput()
    for (let cls of $('#s-quote')[0].classList) {
        if (cls.startsWith('user-')) {
            $('#s-quote').removeClass(cls)
        }
    }
}

function addSQuote(id) {
    let q = createQuoteHTML(id)
    if (q) {

        for (let cls of q.classList) {
            if (cls.startsWith('user-')) {
                $('#s-quote').addClass(cls)
            }
        }
        $('#s-quote').html(deconvertHTML(q.innerHTML) + '<span id="closeQuote" onclick="removeSQuote()">&times;</span>')
        $('#s-quote').attr('data-quoted-id', id)
        $('#s-quote').show()
        resizeInput();
    }
}

function resizeInput() {
    let height = countTextareaLines($('#m')[0]) * 18
    let vh = $(window).height() / 100

    if (height < 60 * vh) { // Prevent input from being over 60% tall
        $('#message_send_form').height(height + (($('#s-quote:hidden').length == 0) ? $('#s-quote').outerHeight(true) : 0))
        $('#m').height(height)
        $('#separator-bottom').height($('#message_send_form').height() + 42)
    
        $('#goBottom').css('bottom', $('#separator-bottom').height() + 4)

    } else $('#m').height(60 * vh - 26)
};

function resetInput() {
    $('#m').val('');
    removeSQuote();
    $('#m, #message_send_form').height(18) // Reset height to default 
}

function sendMessage() {
    msg = $('#m').val();
    if (!msg.match(/^\s*$/)) {
        httpPostAsync('/api/sendmessage/', {
            uuid: uuid_header.uuid,
            message: (($('#s-quote:hidden').length == 0) ? `"${$('#s-quote').attr('data-quoted-id')}"` : '') + msg,
            channel: current_channel,
        });
        resetInput()
    }
}

/**
 * urlBase64ToUint8Array
 * 
 * @param {string} base64String a public vavid key
 * @returns {Uint8Array} The array
 */
function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function isClientFocused() {
    return clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then(res => {
        let clientIsFocused = false;

        for (let i = 0; i < res.length; i++) {
            const windowClient = res[i];
            if (windowClient.focused) {
                clientIsFocused = true;
                break;
            }
        }

        return clientIsFocused;
    });
}

/**
 * Get the ID of the message at Y position
 * @param {Number} y The height to check for
 * @returns {String} The message ID (Prefixed with '#' for JQuery)
 */
function getMessageAtPosition(y) {
    let messages_li = $("#messages").find("li");
    messages_li.each(function (i) {
        if (i != messages_li.length - 1) {
            let start = $(this).offset().top
            let next = messages_li.eq(i + 1).offset().top

            if (y > start && y < next) {
                res = ($(this).attr('id'))
                return false
            }
        } else {
            res = $(this).attr('id');
        }
    })
    return res
}

function isAtBottom() {
    let scroll = $(document).height() - $(window).height() - $(window).scrollTop();
    if (scroll <= 100) return true
    return false
}

// Check if y is in scrolled part of the window
function isVisible(y) {
    let minScroll = $(window).scrollTop()
    let maxScroll = minScroll + window.innerHeight
    return y > minScroll && y < maxScroll
}

function getScrollDistance(y) {
    if (isVisible(y)) return 0

    let minScroll = $(window).scrollTop()
    let maxScroll = minScroll + window.innerHeight

    return Math.min(Math.abs(y - minScroll), Math.abs(y - maxScroll))
}

function scrollTo(y, callback) {
    let distance = getScrollDistance(y)
    if (distance) {
        $("HTML").animate({ scrollTop: y }, distance / 4, 'linear', () => {
            if (typeof callback == 'function') callback()
        });
    } else if (typeof callback == 'function') callback() // No need to scroll since message is already visible
}

function scrollToBottom(animate) {
    let bottom = $(document).height() - $(window).height();
    if (animate) $("HTML, BODY").animate({ scrollTop: bottom }, 200);
    else $("HTML, BODY").animate({ scrollTop: bottom }, 0);
}

function spoilerOnClick(t) {
    t.classList.replace('spoiler-hidden', 'spoiler-seen');
    t.onClick = undefined;
}

function quoteOnClick(message) {
    scrollTo($(message).offset().top - 60, function () {
        $(message).toggleClass("highlight_message");
        setTimeout(() => $(message).toggleClass("highlight_message"), 100);
        setTimeout(() => $(message).toggleClass("highlight_message"), 250);
        setTimeout(() => $(message).toggleClass("highlight_message"), 350);
    })
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
                        let link_jquery = $(`<a class="MD-link-explicit" href="${link}" target="_blank" rel="noopener">`).text(link) // replace it with an actual link
                        content = content.replaceIndex(match.index, match.index + match[0].length, link_jquery[0].outerHTML) // replace the current link found with the HTML generated

                        last_change_index = match.index + link_jquery[0].outerHTML.length; // Update the last edit index
                    }
                }
                if (node.classList ? !node.classList.contains('MD-img') : true) {
                    html_element.replaceChild(toFragment(content), node) // Replace the current element with a list(Fragment) of the elements generated in HTML
                }

            } else {
                replaceLinks(node); // If it has more than of child, apply this function
            }
    }
}

function changeChatTo(uuid, closesidebar=true) {
    if (closesidebar) $('#darkoverlay').click()
    setTimeout(() => {
        if (current_channel != uuid || first_load) {
            for (let chat of my_channels) {
                if (chat.uuid == uuid) {
                    current_channel = uuid;
                    $('#chatname').text(chat.name);
                    $('#chatimg').attr('src', `data:image/png;base64,${chat.icon}`);
                    $('#messages').empty();
                    resetInput()

                    $("#loading").show();

                    loadLast100Messages(() => {
                        populateChatInfo();
                        first_load = false;
                        loadMessages();
                    });
                    return;
                }
            }
        }
    }, 300) // Run this after 300ms to ensure sidebar is closed
}

function populateChatInfo() {
    $('#chatinfo_members').empty();
    $('#chatinfo_copylink').click(() => {
        copyTextToClipboard(`${window.location.origin}/joinChannel/${current_channel}`);
    });

    $('#leavechat').click(() => {
        httpPostAsync('api/leaveChannel', {
            uuid: uuid_header.uuid, 
            channel: current_channel
        }, () => {
            loadChannels()
            changeChatTo(GLOBAL_CHANNEL_UUID, false)
            $('#sidebarbtn').click() // Show sidebar
        })
    });

    for (let chat of my_channels) {
        if (chat.uuid == current_channel) {
            let i = 0
            for (let member of chat.members) {

                if (member.toLowerCase() !== 'admin') {
                    let li = $('<li>');
                    if (member in users) {
                        let user = users[member];
                        li.append($('<img>').attr('src', 'data:image/png;base64,' + user.image));
                        li.append($('<span>').css('color', user.color).text(user.displayname))

                        let star = $('<div class="star transparent">')
                        let css = {
                            position: 'absolute',
                            top: -41 + (i * 15) + 'px',
                            left: '8px',
                            transform: 'scale(0.6) rotate(180deg)'
                        }
                        star.css(css)

                        let currentname = $('#user').text()
                        currentname = currentname.substring(0, currentname.length - 1)

                        if (chat.admins) {
                            if (chat.admins.includes(member)) {
                                star.removeClass('transparent')

                            } if (chat.admins.includes(currentname)) {
                                if (star.hasClass('transparent')) {

                                    star.hover(() => star.toggleClass('transparent-admin'))
                                    star.click(() => {
                                        $(star).toggleClass('transparent')
                                        httpPostAsync('api/makeAdmin', {
                                            uuid: uuid_header.uuid, 
                                            user: member, 
                                            channel: current_channel
                                        })
                                    })

                                } else {

                                    star.hover(() => star.toggleClass('star-admin'))
                                    star.click(() => {
                                        $(star).toggleClass('transparent')
                                        httpPostAsync('api/removeAdmin', {
                                            uuid: uuid_header.uuid, 
                                            user: member, 
                                            channel: current_channel
                                        })
                                    })
                                }
                            }
                        }

                        li.append(star)

                        $('#chatinfo_members').append(li);

                    } else {
                        httpGetAsync('/api/getSettings/' + encodeURIComponent(member), data => {
                            httpGetAsync('/api/getDisplayName/' + encodeURIComponent(member), displayname => {
                                data = JSON.parse(data);
                                let li = $('<li>');
                                li.append($('<img>').attr('src', 'data:image/png;base64,' + data.image));
                                li.append($('<span>').css('color', data.color).text(displayname))

                                let star = $('<div class="star transparent">')
                                let css = {
                                    position: 'absolute',
                                    top: -41 + (i * 15) + 'px',
                                    left: '8px',
                                    transform: 'scale(0.6) rotate(180deg)'
                                }
                                star.css(css)
        
                                let currentname = $('#user').text()
                                currentname = currentname.substring(0, currentname.length - 1)
        
                                if (chat.admins) {
                                    if (chat.admins.includes(member)) {
                                        star.removeClass('transparent')
        
                                    } if (chat.admins.includes(currentname)) {
                                        if (star.hasClass('transparent')) {
        
                                            star.hover(() => star.toggleClass('transparent-admin'))
                                            star.click(() => {
                                                $(star).toggleClass('transparent')
                                                httpPostAsync('api/makeAdmin', {
                                                    uuid: uuid_header.uuid, 
                                                    user: member, 
                                                    channel: current_channel
                                                })
                                            })
        
                                        } else {
        
                                            star.hover(() => star.toggleClass('star-admin'))
                                            star.click(() => {
                                                $(star).toggleClass('transparent')
                                                httpPostAsync('api/removeAdmin', {
                                                    uuid: uuid_header.uuid, 
                                                    user: member, 
                                                    channel: current_channel
                                                })
                                            })
                                        }
                                    }
                                }
        
                                li.append(star)
                            });
                        });
                    }
                }
                i++
            }
        }
    }
}

function resizeChatInfo() {
    $('#chatinfo').css('left', $(window).width() / 2 - $('#chatinfo').outerWidth() / 2);
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

    var result = Math.round(_buffer.scrollHeight / lh);
    if (result == 0) result = 1;
    return result;
}

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

var swipe_right_handler = function () { }
var swipe_left_handler = function () { }

var swipe_up_handler = function () { }
var swipe_down_handler = function () { }

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
            swipe_left_handler(xUp, yUp);
        } else {
            swipe_right_handler(xUp, yUp);
        }
    } else {
        if (yDiff > 0) {
            swipe_up_handler(xUp, yUp);
        } else {
            swipe_down_handler(xUp, yUp);
        }
    }
    /* reset values */
    xDown = null;
    yDown = null;
};