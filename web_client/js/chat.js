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

swipe_left_handler = function () {
    if ($("#darkoverlay").css("opacity") != 0) $("#darkoverlay").click();

    else (console.log('hidden, we should quote'))
}


$(window).on('load', function () {
    setupSeparators();

    const uuid_header = {
        uuid: getCookie('hermes_uuid')
    };

    $("#rightclick").hide();
    $(document).click(function () {
        $("#rightclick").hide(100); //Hide on click outside
    });
    $("#myModal").load("settings", function () {
        $('#logout_uuid').val(getCookie('hermes_uuid'));
    });

    var username;
    httpPostAsync('/api/getSettings', uuid_header, function (res) {
        res = JSON.parse(res)
        username = res.username;
        $('#user').text(username + ':');

        loadSettingsJS(res);

        if ($(window).width() > 600) {  // Run only if app is using the desktop layout 
            $("#m").width($(window).width() - 175 - $("#user").width())

        } else {  // Run only if app is using the mobile layout 
            $("#color").focus(() => $(this).blur()); // Prevent color from being an input field
            
        }

        $('#message_send_form').submit(function () {
            msg = $('#m').val();
            if (!msg.match(/^\s*$/)) {
                var header = uuid_header;
                header['message'] = msg;
                httpPostAsync('/api/sendmessage/', header);
                $('#m').val('');
            }
            return false;
        });

        $("#quote").click(function () {
            let msg = $("#m").val()
            msg = msg.replace(/"([^:]*): *(.+)" /, '') // Delete any quotes already in the message

            let messages_li = $("#messages").find("li");
            messages_li.each(function (i) {
                if (i != messages_li.length - 1) {
                    let click = $("#rightclick").position().top
                    let start = $(this).offset().top
                    let next = messages_li.eq(i + 1).offset().top

                    if (click > start && click < next) {

                        let res = parseQuote($(this))
                        $("#m").val(res + msg)

                        return false;
                    }
                } else {
                    let res = parseQuote($(this))
                    $("#m").val(res + msg)
                }
            })
        });

        $("#delete").click(function () {
            let messages_li = $("#messages").find("li");
            messages_li.each(function (i) {

                if (i != messages_li.length - 1) {

                    let click = $("#rightclick").position().top
                    let start = $(this).offset().top
                    let next = messages_li.eq(i + 1).offset().top

                    if (click > start && click < next) {

                        let header = uuid_header;
                        header.message_uuid = $(this).attr('id').substr(8);
                        httpPostAsync('/api/deletemessage/', header);

                        return false;
                    }
                } else {
                    let header = uuid_header;
                    header.message_uuid = $(this).attr('id').substr(8);
                    httpPostAsync('/api/deletemessage/', header);
                }
            })
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
            input.keypress(function (e) { // Add an event listener for this input
                if (e.keyCode == 13 && is_editing) {
                    if ($(this).val() != '') {
                        edit_header['newmessage'] = $(this).val();
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
            input.parent().parent().height(input.height() + 16);
            input.bind('input propertychange', function () {

                input.attr('rows', countTextareaLines(input[0]) + '');
                input.parent().parent().height(input.height() + 16);
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
            let chat_message = undefined;
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
                    top: event.pageY + "px",
                    left: event.pageX + "px"
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

        loadMessages();
    });


    $(window).resize(function () {
        $("#messages").find("li").each(function () {
            $(this).height($(this).find(".message_body").height());
        });

        if ($(window).width() > 600) $("#m").width($(window).width() - 175 - $("#user").width())

        setupSeparators();
    });

});


// ---------------------
//       Functions
// ---------------------

function loadMessages() {
    prev_html = $('#messages').html();
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

            $("#loading").hide()
            first_load = false;
        }
    });
    setTimeout(loadMessages, 500)
};

function printMessages(messages) {

    for (let i = 0; i < messages.length; i++) {
        let message_json = messages[i];
        let username = message_json.username;
        let message = convertHTML(message_json.message);


        let time = new Date(message_json.time);
        let day = time.getDate() + '/' + (time.getMonth() + 1) + '/' + time.getFullYear();
        let hour = padNumber(time.getHours()) + ':' + padNumber(time.getMinutes()) + ':' + padNumber(time.getSeconds());

        let prev_time = new Date(prev_json.time);
        let prev_day = prev_time.getDate() + '/' + (prev_time.getMonth() + 1) + '/' + prev_time.getFullYear();

        last_message_timestamp = message_json.time;
        last_message_uuid = message_json.uuid;

        if ((day != prev_day) && $("#messages").find(`#${day.replaceAll(/\//g, '\\/')}`).length == 0) {
            let date_message = $('<li>').attr("class", "date").attr("id", day).append(day);
            $("#messages").append(date_message);
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


        let quoteREGEX = /(\"(.+?): (.+)\")/;

        let messageHTML = message;

        let quoteMatch = message.match(quoteREGEX);
        // So that we dont parse the MD in the quote
        let convertedMDstart = 0;
        let convertedMDend = 0;
        if (quoteMatch) {
            //#region create a quote
            let quoted_user = quoteMatch[2]
            let quoted_message = `${quoted_user}: ${quoteMatch[3]}`
            let message_id;
            $('#messages').find('.message').each(function (i) {

                if ($(this).find('#m-username').text() == quoted_user + ': ' && convertHTML(HTMLtoMD($(this).find('#m-body').html())) == quoteMatch[3]) {

                    message_id = $(this).attr('id');

                }
            })
            if (message_id) {
                //Create the css for the quote
                let quote_css =
                    `
                    border-left: 3px ${users[quoted_user.toLowerCase()].color} solid;
                    background-color: ${users[quoted_user.toLowerCase()].color}50;
                    `
                // Replace all the unvalid charaters in css IDs
                let quoted_user_id = escapeStringForCSS(quoted_user);
                //Create the quote span
                let quoteSpan = $(`<span class="quote user-${quoted_user_id}" onclick="quoteOnClick('${message_id}')" >`).append(MDtoHTML(quoted_message));
                
                //Check if the CSS for the current user already exists
                let cssRuleExists = false;
                let css = document.styleSheets;

                for (var r = 0; r < css[css.length - 1].rules; r++) {
                    if (css[css.length - 1].rules[r].selectorText.includes(`user-${quoted_user_id}`)) {
                        cssRuleExists = true;
                        break
                    }
                }
                if (!cssRuleExists) {
                    css[css.length - 1].addRule(`.quote.user-${quoted_user}`, quote_css);
                }

                convertedMDstart = quoteMatch.index;
                convertedMDend = quoteMatch.index + quoteSpan[0].outerHTML.length;

                messageHTML = messageHTML.replace(quoteMatch[0], quoteSpan[0].outerHTML)

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
        } catch (err) {} // Don't do anything, the mention was invalid so just don't parse it 

        new_message_body.append(deconvertHTML(m_body_element[0].outerHTML));

        
        if (username != getCookie('hermes_username') && !first_load && last_message_timestamp_notified < last_message_timestamp) {
            sendNotifiaction("New message from " + username, username + ": " + message, 'data:image/png;base64,' + users[username.toLowerCase()].image);
            last_message_timestamp_notified = last_message_timestamp;
        }
        let time_el = $("<span class='time'>")

        $(window).width() > 600 ? time_el.text(hour) : time_el.text(hour.substring(0, 5)) // Hide seconds from time if on mobile

        if (username == name) time_el.attr('class', 'myTime')
        else time_el.attr('class', 'theirTime')

        new_message_body.attr('class', 'message_body');

        new_message.append(new_message_body);
        new_message.append(time_el);

        if (message_json.edited) { // It's an edited message
            $('li#message-' + message_json.uuid).replaceWith(new_message);
            message_with_body = $('li#message-' + message_json.uuid);
            last_message_uuid = message_json.time_uuid;
        } else {
            if ($('#messages').find('li#message-' + message_json.uuid).length == 0) {
                $('#messages').append(new_message);
            }
        }

        new_message.height(new_message_body.height());

        if (first_load) $(document).scrollTop($("#separator-bottom").offset().top)
        else if (!message_json.edited) {
            var scroll = $(document).height() - $(window).height() - $(window).scrollTop() - new_message.outerHeight();
            if (scroll <= 100) window.scroll({
                top: $("#separator-bottom").offset().top,
                left: 0,
                behavior: 'smooth'
            })
        }
        prev_json = message_json;
    }
}

function setupSeparators() {
    $('#separatot-top').height($('#menutop').height());
    updateBottomSeparator();
}

function updateBottomSeparator() {
    $('#separator-bottom').height($('#message_send_form').outerHeight(true));
}