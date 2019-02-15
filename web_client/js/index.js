var notifications_supported = true;
var notifications_allowed = false;

if (isElectron()) window.sendUUID(getCookie('hermes_uuid'));

if (getCookie('hermes_style') == 'dark') {
    $('#hermes_style').attr('href', 'css/dark/chat.css');
}

$(window).on('load', function () {
    const uuid_header = {
        uuid: getCookie('hermes_uuid')
    };

    $("#rightclick").hide();
    $(document).click(function () {
        $("#rightclick").hide(100); //Hide on click outside
    });
    $("#myModal").load("settings", function () {
        $('#logout_uuid').val(getCookie('hermes_uuid'));
        loadSettingsJS();
    });

    var username;
    httpPostAsync('/api/getusername', uuid_header, res => {
        username = res;
        $('#user').text(username + ':');

        $("#m").width($(window).width() - $("#user").width() - 175)

        $('#message_send_form').submit(() => {
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
            $("li").each(function (i) {

                if (i != $('li').length - 1) {

                    let click = $("#rightclick").position().top
                    let start = $(this).offset().top
                    let next = $('li').eq(i + 1).offset().top

                    if (click > start && click < next) {

                        let res = parseQuote($(this))
                        $("#m").val(res + $("#m").val())

                        return false;
                    }
                } else {
                    let res = parseQuote($(this))
                    $("#m").val(res + $("#m").val())
                }
            })
        });

        $("#delete").click(function () {
            $("li").each(function (i) {

                if (i != $('li').length - 1) {

                    let click = $("#rightclick").position().top
                    let start = $(this).offset().top
                    let next = $('li').eq(i + 1).offset().top

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
        edit_header.message = $(this).find('b').next().text();
        var is_editing = false;
        $("#edit").click(function () {
            $("li").each(function (i) {
                if (i != $('li').length - 1) {

                    let click = $("#rightclick").position().top
                    let start = $(this).offset().top
                    let next = $('li').eq(i + 1).offset().top

                    let sender = $(this).find('b').text()
                    sender = sender.substr(0, sender.length - 2);


                    if (click > start && click < next) {

                        if (!is_editing && username == sender) {
                            edit_header.message = $(this).find('b').next().text();
                            edit_header.message_uuid = $(this).attr('id').substr(8);

                            is_editing = true;

                            prev_html = $('#messages').html();
                            let input = $('<textarea>').val(edit_header['message']);
                            input.attr('id', 'editing');

                            $(this).find('b').next().remove();
                            $(this).find('b').parent().append(input);
                            input.attr('rows', countTextareaLines(input[0]) + '');
                            input.parent().parent().height(input.height() + 20);

                            //input.width($(window).width() - input.offset().left - $(this).find('b').width() - 120);
                            input.bind('input propertychange', function () {

                                input.attr('rows', countTextareaLines(input[0]) + '');
                                input.parent().parent().height(input.height() + 20);
                            });
                            $(this).find('b').next().focus();
                            editing_message_val = $(this).find('b').next().val();
                        }

                        return false;

                    }

                } else {

                    let sender = $(this).find('b').text()
                    sender = sender.substr(0, sender.length - 2);

                    if (!is_editing && username == sender) {
                        edit_header.message = $(this).find('b').next().text();
                        edit_header.message_uuid = $(this).attr('id').substr(8);

                        is_editing = true;

                        prev_html = $('#messages').html();
                        let input = $('<textarea>').val(edit_header['message']);
                        input.attr('id', 'editing');

                        $(this).find('b').next().remove();
                        $(this).find('b').parent().append(input);
                        input.attr('rows', countTextareaLines(input[0]) + '');
                        input.parent().parent().height(input.height() + 20);

                        //input.width($(window).width() - input.offset().left - $(this).find('b').width() - 120);
                        input.bind('input propertychange', function () {

                            input.attr('rows', countTextareaLines(input[0]) + '');
                            input.parent().parent().height(input.height() + 20);
                        });
                        $(this).find('b').next().focus();
                        editing_message_val = $(this).find('b').next().val();
                    }
                }
            });
        });

        var users = {};

        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications");
            notifications_supported = false;
        }
        if (notifications_supported) {
            Notification.requestPermission(() => {
                notifications_allowed = (Notification.permission == 'granted');
            });
        }

        window.sessionStorage.clear();

        var last_message_timestamp = 0;
        var last_message_uuid = '13814000-1dd2-11b2-8080-808080808080'; // Smallest posible UUID for timestamp 0 (1/1/1970 00:00:00)
        var last_message_timestamp_notified = 0;
        let prev_json = {};
        let first_load = true;

        const interval = window.setInterval(function () {
            prev_html = $('#messages').html();
            httpPostAsync('/api/loadmessages/' + last_message_uuid, uuid_header, res => {
                if (res !== '' || res !== '[]') {

                    let res_json = JSON.parse(res);
                    let messages = res_json.newmessages;
                    let delm = res_json.deletedmessages;
                    delm.forEach((message) => {
                        $('li#message-' + message.uuid).remove();
                        last_message_uuid = message.time_uuid;
                    });

                    for (let i = 0; i < messages.length; i++) {
                        let message_json = messages[i];
                        let username = message_json.username;
                        let message = message_json.message;
                        last_message_timestamp = message_json.time;
                        last_message_uuid = message_json.uuid;


                        let time = new Date(message_json.time);
                        let prev_time = new Date(prev_json.time);
                        let day = time.getDate() + '/' + (time.getMonth() + 1) + '/' + time.getFullYear();
                        let hour = padNumber(time.getHours()) + ':' + padNumber(time.getMinutes()) + ':' + padNumber(time.getSeconds());
                        let prev_day = prev_time.getDate() + '/' + (prev_time.getMonth() + 1) + '/' + prev_time.getFullYear();
                        if (day != prev_day) {
                            let date_message = $('<li>').attr("class", "date").append(day);
                            $("#messages").append(date_message);
                        }

                        if (!Object.keys(users).includes(username)) {
                            let response = httpGetSync("/api/getSettings/" + encodeURIComponent(username));
                            users[username] = JSON.parse(response);
                        }
                        let color = users[username].color;
                        let new_message = $('<li id=message-' + last_message_uuid + '>');

                        let name = $("#message_send_form").find('p').text()
                        name = name.substr(0, name.length - 1);

                        if (username == name) {
                            new_message.attr('class', 'myMessage')
                        } else {
                            new_message.attr('class', 'theirMessage')
                        }

                        new_message.append($('<img>').attr('src', IMG_URL_HEADER + users[username].image).attr("id", "chat_prof_pic")); //.css("display", 'inline_block').css("width", '2%').css("height", '2%'));
                        let new_message_body = $('<span>');
                        new_message_body.append($('<b>').text(username + ': ').css("color", color));

                        let linkMatch = message.match(/([\w\d]+):\/\/([\w\d\.-]+)\.([\w\d]+)\/?([\w\d-@:%_\+.~#?&/=]*)/g);
                        let quoteMatch = message.match(/\"(.+): ((.)+)\"/);
                        let quotecss = "";
                        let quoteuser = "";
                        if (quoteMatch) {
                            quotecss = "border-left: 3px  " + users[quoteMatch[1]].color + " solid; background-color: " + users[quoteMatch[1]].color + "50;";
                            quoteuser = quoteMatch[1]
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

                        if (linkMatch && quoteMatch) { // Both links and quotes in message

                            let linkStart = message.search(linkMatch[0]);
                            let linkEnd = linkStart + (linkMatch[0].length - 1);
                            let linkNum = linkMatch.length;
                            let linkSpan = '<a target="_blank" href="' + linkMatch[0] + '">' + linkMatch[0] + '</a>';

                            let quoteStart = message.search(quoteMatch[0]);
                            let quoteEnd = quoteStart + (quoteMatch[0].length);
                            let quoteText = quoteMatch[0].substring(1, quoteMatch[0].length - 1)
                                .replace(linkMatch[0], linkSpan);

                            let quoteSpan = $("<span>").append(quoteText).attr("class", "quote user-" + quoteuser);

                            let cssRuleExists = false;
                            for (var r = 0; r < document.styleSheets[document.styleSheets.length - 1].rules; r++) {
                                if (document.styleSheets[document.styleSheets.length - 1].rules[r].selectorText.includes('user-' + quoteuser)) {
                                    cssRuleExists = true;
                                    break
                                }
                            }
                            if (!cssRuleExists) {
                                document.styleSheets[document.styleSheets.length - 1].addRule(".quote.user-" + quoteuser, quoteMatch);
                            }

                            if (quoteStart < linkStart && quoteEnd > linkEnd) { // Link inside quote
                                new_message_body.append($("<span>").text(message.substring(0, quoteStart)));
                                new_message_body.append(quoteSpan);
                                if (linkEnd > quoteEnd) {
                                    new_message_body.append($("<span>").text(message.substring(quoteEnd, linkStart)));

                                    for (let r = 0; r < linkNum; r++) {
                                        oldLinkEnd = linkStart + (linkMatch[r].length);
                                        linkStart = message.search(linkMatch[r]);
                                        linkEnd = linkStart + (linkMatch[r].length);
                                        nextLinkStart = message.search(linkMatch[r + 1]);

                                        let linkSpan = $('<a>').attr('target', '_blank').attr('href', linkMatch[r]).text(linkMatch[r]);
                                        new_message_body.append(linkSpan);

                                        if (r + 1 == linkNum) {
                                            new_message_body.append($("<span>").text(message.substring(linkEnd)));
                                        } else {
                                            new_message_body.append($("<span>").text(message.substring(linkEnd, nextLinkStart)));
                                        }
                                    }

                                    new_message_body.append($("<span>").text(message.substring(linkEnd)));
                                }
                            } else if (quoteEnd < linkStart) { // Link after quote
                                new_message_body.append($("<span>").text(message.substring(0, quoteStart)));
                                new_message_body.append(quoteSpan);
                                if (linkEnd > quoteEnd) {
                                    new_message_body.append($("<span>").text(message.substring(quoteEnd, linkStart)));

                                    for (let r = 0; r < linkNum; r++) {
                                        oldLinkEnd = linkStart + (linkMatch[r].length);
                                        linkStart = message.search(linkMatch[r]);
                                        linkEnd = linkStart + (linkMatch[r].length);
                                        nextLinkStart = message.search(linkMatch[r + 1]);

                                        let linkSpan = $('<a>').attr('target', '_blank').attr('href', linkMatch[r]).text(linkMatch[r]);
                                        new_message_body.append(linkSpan);

                                        if (r + 1 == linkNum) {
                                            new_message_body.append($("<span>").text(message.substring(linkEnd)));
                                        } else {
                                            new_message_body.append($("<span>").text(message.substring(linkEnd, nextLinkStart)));
                                        }
                                    }

                                    new_message_body.append($("<span>").text(message.substring(linkEnd)));
                                }
                            } else if (linkStart < quoteStart) { // Link before quote
                                new_message_body.append($("<span>").text(message.substring(0, linkStart)));
                                for (let r = 0; r < linkNum; r++) {
                                    oldLinkEnd = linkStart + (linkMatch[r].length);
                                    linkStart = message.search(linkMatch[r]);
                                    linkEnd = linkStart + (linkMatch[r].length);
                                    nextLinkStart = message.search(linkMatch[r + 1]);

                                    let linkSpan = $('<a>').attr('target', '_blank').attr('href', linkMatch[r]).text(linkMatch[r]);
                                    new_message_body.append(linkSpan);

                                    if (r + 1 == linkNum) new_message_body.append($("<span>").text(message.substring(linkEnd, quoteStart)));

                                    else new_message_body.append($("<span>").text(message.substring(linkEnd, nextLinkStart)));
                                }

                                new_message_body.append($("<span>").text(message.substring(linkEnd, quoteStart)));
                                new_message_body.append(quoteSpan);
                                new_message_body.append($("<span>").text(message.substring(quoteEnd)));
                            }

                        } else if (linkMatch) { // Only link in message
                            linkNum = linkMatch.length;
                            new_message_body.append($("<span>").text(message.substring(0, message.search(linkMatch[0]))));

                            for (let r = 0; r < linkNum; r++) {
                                linkStart = message.search(linkMatch[r]);
                                linkEnd = linkStart + (linkMatch[r].length);
                                nextLinkStart = message.search(linkMatch[r + 1]);

                                let linkSpan = $('<a>').attr('target', '_blank').attr('href', linkMatch[r]).text(linkMatch[r]);
                                new_message_body.append(linkSpan);
                                if (r + 1 == linkNum) {
                                    new_message_body.append($("<span>").text(message.substring(linkEnd)));
                                } else {
                                    new_message_body.append($("<span>").text(message.substring(linkEnd, nextLinkStart)));
                                }
                            }

                        } else if (quoteMatch) { // Only quote in message
                            let quoteSpan = $("<span>").text(quoteMatch[0].substring(1, quoteMatch[0].length - 1)).attr("class", "quote user-" + quoteuser);
                            let cssRuleExists = false;
                            for (let r = 0; r < document.styleSheets[document.styleSheets.length - 1].rules; r++) {
                                if (document.styleSheets[document.styleSheets.length - 1].rules[r].selectorText.includes('user-' + quoteuser)) {
                                    cssRuleExists = true;
                                    break
                                }
                            }
                            if (!cssRuleExists) {
                                document.styleSheets[document.styleSheets.length - 1].addRule(".quote.user-" + quoteuser, quotecss);
                            }

                            quoteStart = message.search(escapeRegExp(quoteMatch[0]));
                            quoteEnd = quoteStart + (quoteMatch[0].length);
                            new_message_body.append($("<span>").text(message.substring(0, quoteStart)));
                            new_message_body.append(quoteSpan);
                            new_message_body.append($("<span>").text(message.substring(quoteEnd)));
                        } else { // No links or quotes in message
                            new_message_body.append($("<span>").text(message)); // Span is there to get the text for the quoting system
                        };

                        if (username != getCookie('hermes_username') && !first_load && last_message_timestamp_notified < last_message_timestamp) {
                            sendNotifiaction("New message from " + username, username + ": " + message, 'data:image/png;base64,' + users[username].image);
                            last_message_timestamp_notified = last_message_timestamp;
                        }
                        let time_el = $("<span class='time'>").text(hour);

                        if (username == name) {
                            time_el.attr('class', 'myTime')
                        } else {
                            time_el.attr('class', 'theirTime')
                        }

                        new_message_body.attr('class', 'message_body');

                        new_message.append(new_message_body);
                        new_message.append(time_el);

                        if (message_json.edited) { // It's an edited message
                            $('li#message-' + message_json.uuid).replaceWith(new_message);
                            message_with_body = $('li#message-' + message_json.uuid);
                            last_message_uuid = message_json.time_uuid;
                        } else {
                            $('#messages').append(new_message);
                        }

                        new_message.height(new_message_body.height());

                        if(first_load) $(document).scrollTop($("#separator").offset().top)
                        else if (!message_json.edited) {
                            var scroll = $(document).height() - $(window).height() - $(window).scrollTop() - new_message.outerHeight();
                            console.log(scroll)
                            if (scroll <= 35) $(document).scrollTop($("#separator").offset().top)
                        }

                        prev_json = message_json;
                    }

                    first_load = false;
                }

            });
        }, 500);

        window.setInterval(function () {
            $("#messages").find("li:not(.date)").each(function () {
                $(this).unbind("contextmenu"); // Unbind to prevent multiple callbacks
                $(this).bind("contextmenu", function (event) { // Capture Right Click Event
                    $("#rightclick").hide();
                    event.preventDefault();
                    $("#rightclick").show(100).css({ // Show #rightclick at cursor position
                        top: event.pageY + "px",
                        left: event.pageX + "px"
                    })
                });
            })

            editing_message_val = $('#editing').val();
            $('#editing').keypress(function (e) {
                if (e.keyCode == 13 && is_editing) {
                    edit_header['newmessage'] = $(this).val();
                    httpPostAsync('/api/editmessage/', edit_header);
                    editing_message_timestamp = 0;
                    editing_message_val = '';
                    is_editing = false;
                }
            });
        }, 100)
    });


    $(window).resize(() => {
        $("#messages").find("li").each(function () {
            $(this).height($(this).find(".message_body").height());
        });

        $("#m").width($(window).width() - 175 - $("#user").width())
    });

});
