var last_message_timestamp = 0;
var last_message_uuid = '13814000-1dd2-11b2-8080-808080808080'; // Smallest posible UUID for timestamp 0 (1/1/1970 00:00:00)
var last_message_timestamp_notified = 0;
let prev_json = {};
var first_load = true;

const users = {};

var notifications_supported = true;
var notifications_allowed = false;

if (isElectron()) window.sendUUID(getCookie('hermes_uuid'));
if (getCookie('hermes_style') == 'dark') {
    $('#hermes_style').attr('href', 'css/dark/chat.css');
}

swipe_right_handler = function () {
    $("#sidebarbtn").click();
}

swipe_left_handler = function (x, y) {

    if ($("#darkoverlay").is(":visible")) {
        $("#darkoverlay").click();

    } else { // Quote the message that was swipted left on 

        let id = '#' + getMessageAtPosition(y + window.scrollY)

        quote(id)

        if ($(id).hasClass('myMessage')) {
            $(id).toggleClass('myMessageLeft')
            setTimeout(() => {
                $(id).toggleClass('myMessageLeft')
            }, 100)
        } else {
            $(id).toggleClass('theirMessageLeft')
            setTimeout(() => {
                $(id).toggleClass('theirMessageLeft')
            }, 100)
        } // Animation to move the message to the left and back
    }
}

$(window).on('load', function () {

    const uuid_header = {
        uuid: getCookie('hermes_uuid')
    };

    $("#rightclick").hide();
    $(document).click(function () {
        $("#rightclick").hide(100); //Hide on click outside
    });


    var username;
    httpPostAsync('/api/getSettings', uuid_header, function (res) {
        res = JSON.parse(res)
        username = res.username;
        $('#user').text(username + ':');
        $("#myModal").load("settings", function () {
            $('#logout_uuid').val(getCookie('hermes_uuid'));
            loadSettingsJS(res);
        });

        if ($(window).width() > 600) {  // Run only if app is using the desktop layout 
            $("#m").width($(window).width() - 170 - $("#user").width())

        } else {  // Run only if app is using the mobile layout 
            $("#color").focus(() => $(this).blur()); // Prevent color from being an input field

        }

        $('#message_send_form').submit(function () {
            sendMessage()
            return false;
        });

        document.onkeydown = e => {
            let evtobj = window.event ? event : e
            let modifier = evtobj.ctrlKey || evtobj.metaKey; // Ctrl on Windows, Cmd on Mac
            if (evtobj.keyCode == 13 && modifier) { // Ctrl/Cmd + enter to send the message
                sendMessage()
            }
        }

        $("#quote").click(function () {
            let id = getMessageAtPosition($("#rightclick").position().top)
            quote(id)

        });

        $("#delete").click(function () {
            let id = '#' + getMessageAtPosition($("#rightclick").position().top)

            let header = uuid_header;
            header.message_uuid = id.substr(9);
            httpPostAsync('/api/deletemessage/', header);
        });

        var edit_header = uuid_header;
        let EDIT_HTML_RULES = getCustomRules(HTML_RULES, {
            tag: 'span',
            class: 'quote',
            md: '"$TEXT"'
        })
        edit_header.message = HTMLtoMD($(this).find('b').next().html(), EDIT_HTML_RULES);

        var is_editing = false;

        function setup_edit(ctx, username_element) {
            edit_header.message = HTMLtoMD(username_element.next().html(), EDIT_HTML_RULES);
            edit_header.message_uuid = $(ctx).attr('id').substr(8);
            is_editing = true;
            let input = $('<textarea id="editing">').val(edit_header['message']);
            input.keydown(function (e) { // Add an event listener for this input
                let evtobj = window.event ? event : e
                let modifier = evtobj.ctrlKey || evtobj.metaKey; // Ctrl on Windows, Cmd on Mac
                if (evtobj.keyCode == 13 && modifier) { // Ctrl/Cmd + enter to send the message
                    if ($(this).val() != '') {
                        edit_header['newmessage'] = (input.parent().parent().find(".quote").length != 0 ? "\"" + input.parent().parent().find(".quote").attr('data-quoted-id') + "\"" : "") + $(this).val();
                        httpPostAsync('/api/editmessage/', edit_header);
                        editing_message_timestamp = 0;
                        is_editing = false;
                    } else {
                        httpPostAsync('/api/deletemessage/', edit_header);
                        is_editing = false;
                    }
                }
            });
            username_element.next().remove();
            username_element.parent().append(input);
            input.attr('rows', countTextareaLines(input[0]) + '');
            input.parent().parent().height(input.height() + 16 + (input.parent().parent().find(".quote").length != 0 ? input.parent().parent().find(".quote").height() + 10 : 0));
            input.bind('input propertychange', function () {

                input.attr('rows', countTextareaLines(input[0]) + '');
                input.parent().parent().height(input.height() + 16 + (input.parent().parent().find(".quote").length != 0 ? input.parent().parent().find(".quote").height() + 10 : 0));
            });
            username_element.next().focus();
        }
        $("#edit").click(function () { // TODO: update
            $("#messages").find("li").each(function (i) {
                let username_element = $(this).find('#m-username');
                let sender = username_element.text()
                sender = sender.substr(0, sender.length - 2);
                if (i != $("#messages").find("li").length - 1) {
                    let click = $("#rightclick").position().top
                    let start = $(this).offset().top
                    let next = $("#messages").find("li").eq(i + 1).offset().top
                    if (click > start && click < next) {
                        if (!is_editing && username == sender) {
                            setup_edit(this, username_element);
                            return false;
                        }
                    }
                } else {
                    setup_edit(this, username_element);
                }
            });
        });

        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications");
            notifications_supported = false;
        }
        if (notifications_supported) {
            Notification.requestPermission(function () {
                notifications_allowed = (Notification.permission == 'granted');
            });
        }

        document.addEventListener('contextmenu', function (e) {
            $("#rightclick").hide();
            e.preventDefault(); // Prevent the default menu
            let chat_message;
            for (let element of e.composedPath()) {
                if (element.classList && element.classList.contains('message')) {
                    chat_message = element;
                    break;
                }

            }
            if (chat_message) {

                // Load certain context menu items depending on the message
                if (chat_message.classList.contains('theirMessage'))
                    $("#delete, #edit").hide();
                else
                    $("#delete, #edit").show();

                $("#rightclick").show(100).css({ // Show #rightclick at cursor position
                    top: e.pageY + "px",
                    left: e.pageX + "px"
                })
            }
        }, false);

        $("#sidebarbtn").click(function () {
            $("#darkoverlay").fadeIn(200);
            $("#sidebar").css("left", "0px");
        });

        $("#darkoverlay").click(function () {
            $("#darkoverlay").fadeOut(200);
            $("#sidebar").css("left", "-300px");
        });

        window.sessionStorage.clear();


        loadLast100Messages(() => {
            first_load = false;
            loadMessages();
        });
    });


    $(window).resize(function () {
        $("#messages").find("li").each(function () {
            $(this).height($(this).find(".message_body").height() + ($(this).find(".quote").length ? $(this).find(".quote").height() + 16 : 0));
        });

        if ($(window).width() > 600) $("#m").width($(window).width() - 175 - $("#user").width())

        resizeInput()
    });

    $(document).on('scroll mousedown wheel DOMMouseScroll mousewheel', function (evt) {
        // detect only user initiated, not by an .animate though
        if ($('body,html').scrollTop() == 0 && $("#loading-oldmessages").css('display') == 'none' && !hasLoadedEveryMessage) {
            $("#loading-oldmessages").show();
            loadNext100Messages($('#messages').find('.message').first().attr('id').substr(8));
        }
    });

    $('#m').on('input propertychange', resizeInput)
});


// ---------------------
//       Functions
// ---------------------

function loadMessages() {
    httpPostAsync('/api/loadmessages/' + last_message_uuid, uuid_header, function (res) {
        if (res !== '[]') {

            res = JSON.parse(res);
            let messages = res.newmessages;
            let delm = res.deletedmessages;
            delm.forEach(message => {
                $('li#message-' + message.uuid).remove();
                last_message_uuid = message.time_uuid;
            });

            printMessages(messages);

            if (first_load) {
                $("#loading").hide()
                first_load = false;
            }
        }
    });
    setTimeout(loadMessages, 500)
};

let hasLoadedEveryMessage = false;

function loadLast100Messages(callback) {
    httpPostAsync('/api/load100messages/', uuid_header, function (res) {
        if (res !== '[]') {
            res = JSON.parse(res);
            if (res.length != 100) hasLoadedEveryMessage = true;
            printMessages(res, true);
        }
        $("#loading").hide()
        if (callback) callback();
    });
};

function loadNext100Messages(uuid, callback) {
    httpPostAsync('/api/load100messages/' + uuid, uuid_header, function (res) {
        if (res !== '[]') {
            res = JSON.parse(res);
            if (res.length != 100) hasLoadedEveryMessage = true;
            let old_first_message = $('#messages').children().first();

            printMessages(res, true);
            $("#loading-oldmessages").hide()
            $(document).scrollTop(old_first_message.offset().top + $('#separator-top').outerHeight());

        }
        if (callback) callback();
    });
};

function printMessages(messages, prepend) {
    let loadedMessages = $('<div>');
    let prev_day = '';
    $("#messages").append(loadedMessages);
    for (let i = 0; i < messages.length; i++) {

        let message_json = messages[i];
        let username = message_json.username;
        let message = convertHTML(message_json.message);


        let time = new Date(message_json.time);
        let day = time.getDate() + '/' + (time.getMonth() + 1) + '/' + time.getFullYear();
        let hour = padNumber(time.getHours()) + ':' + padNumber(time.getMinutes()) + ':' + padNumber(time.getSeconds());

        last_message_timestamp = message_json.time;
        last_message_uuid = message_json.uuid;

        if ($("#messages").find(`#${day.replaceAll(/\//g, '\\/')}`).length == 0 && day != prev_day) {
            let date_message = $('<li>').attr("class", "date").attr("id", day).append(day);
            loadedMessages.append(date_message);
        }

        if (!Object.keys(users).includes(username.toLowerCase())) {
            let response = httpGetSync("/api/getSettings/" + encodeURIComponent(username));
            users[username.toLowerCase()] = JSON.parse(response);
        }

        let color = users[username.toLowerCase()].color;
        let new_message = $(`<li id="message-${last_message_uuid}" class="message" >`);

        let name = $("#message_send_form").find('p').text()
        name = name.substr(0, name.length - 1);

        if (username == name) new_message.addClass('myMessage')
        else new_message.addClass('theirMessage')

        new_message.append($('<img>').attr('src', IMG_URL_HEADER + users[username.toLowerCase()].image).attr("id", "chat_prof_pic"));
        let new_message_body = $('<span>');
        new_message_body.append($('<b id="m-username">').text(username + ': ').css("color", color));

        let messageHTML = message;

        let quoteMatch = message.match(quoteREGEX);
        // So that we dont parse the MD in the quote
        let convertedMDstart = 0;
        let convertedMDend = 0;
        if (quoteMatch) {
            let quote = createQuoteHTML(quoteMatch[1], loadedMessages);
            if (quote) {
                quote = quote.outerHTML;
                convertedMDstart = quoteMatch.index;
                convertedMDend = quoteMatch.index + quote.length;
                messageHTML = messageHTML.replace(quoteMatch[0], quote)
            }
        }

        //We're going to replace the string before & after the convertedMD
        let message_first_replace = messageHTML.substr(0, convertedMDstart);
        let message_second_replace = messageHTML.substr(convertedMDend, messageHTML.length);
        let message_fisrt_MD = MDtoHTML(message_first_replace);
        let message_second_MD = MDtoHTML(message_second_replace);
        messageHTML = messageHTML.replace(message_first_replace, message_fisrt_MD);
        messageHTML = messageHTML.replace(message_second_replace, message_second_MD);

        let m_body_element = $('<span id="m-body">').html(messageHTML);

        // find the links
        replaceLinks(m_body_element[0]);

        // Mentions
        try {
            let mention_regex = /(@([^ ]+))/g

            let match
            while (match = mention_regex.exec(message)) {
                let mention = $('<b class="mention">').css('color', users[match[2].toLowerCase()].color).text(match[1])[0].outerHTML
                m_body_element[0].innerHTML = m_body_element[0].innerHTML.replace(match[1], mention)
            }
        } catch (err) { } // Don't do anything, the mention was invalid so just don't parse it 

        new_message_body.append(deconvertHTML(m_body_element[0].outerHTML));


        if (username != getCookie('hermes_username') && !first_load && last_message_timestamp_notified < last_message_timestamp) {
            sendNotifiaction("New message from " + username, username + ": " + removeFormatting(message), 'data:image/png;base64,' + users[username.toLowerCase()].image);
            last_message_timestamp_notified = last_message_timestamp;
        }
        let time_el = $("<span class='time'>")

        $(window).width() > 600 ? time_el.text(hour) : time_el.text(hour.substring(0, 5)) // Hide seconds from time if on mobile

        new_message_body.attr('class', 'message_body');

        new_message.append(new_message_body);
        new_message.append(time_el);

        //Insert the quote after the image, this has to be done with all the message created
        new_message.find(".quote").insertBefore(new_message.find("img")).css("display", "block");

        if (message_json.edited) { // It's an edited message
            $('li#message-' + message_json.uuid).replaceWith(new_message);
            message_with_body = $('li#message-' + message_json.uuid);
            last_message_uuid = message_json.time_uuid;
        } else {
            if ($('#messages').find('li#message-' + message_json.uuid).length == 0) {
                loadedMessages.append(new_message);
            }
        }


        new_message.height(new_message_body.height() + (new_message.find(".quote").length != 0 ? new_message.find(".quote").height() + 16 : 0)); //Change message height to cover the quote on top


        if (first_load) $(document).scrollTop($("#separator-bottom").offset().top)
        else if (!message_json.edited) {
            var scroll = $(document).height() - $(window).height() - $(window).scrollTop() - $('#messages').children().last().outerHeight();
            if (scroll <= 100) window.scroll({
                top: $("#separator-bottom").offset().top,
                left: 0,
                behavior: 'smooth'
            })
        }
        prev_day = day;
    }
    let lmessagesHTML = loadedMessages.html();

    loadedMessages.remove();
    if (prepend) {
        $('#messages').prepend(lmessagesHTML);
    } else {
        $('#messages').append(lmessagesHTML);
    }
}
