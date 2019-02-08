var notifications_supported = true;
var notifications_allowed = false;

function sendNotifiaction(user, message, image) {
    if (notifications_allowed && notifications_supported) {
        if (!(ifvisible.now())) {
            new Notification(user, {
                body: message,
                icon: image
            });
        };
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

if (isElectron())  window.sendUUID(getCookie('hermes_uuid'));

if (getCookie('hermes_style') == 'dark') {
    $('#hermes_style').attr('href', 'css/dark/chat.css');
}

$(window).on('load', function () {
    const uuid_header = { uuid: getCookie('hermes_uuid') };

    $("#rightclick").hide();
    $(document).click(function () {
        $("#rightclick").hide(100); //Hide on click outside
    });
    $("#myModal").load("settings", function () {
        $('#logout_uuid').val(getCookie('hermes_uuid'));
        loadSettingsJS();
    });

    var username;
    httpPostAsync('/api/getusername', uuid_header, function (res) {
        username = res;
        $('#user').append($('<b>').text(username + ':'));
        let line_length = 150;
        $('#message_send_form').submit(function () {
            msg = $('#m').val();
            if (msg != '') {
                var header = uuid_header;
                header['message'] = msg;
                httpPostAsync('/api/sendmessage/', header, function (res) { });
                $('#m').val('');
            }
            return false;
        });

        $("#quote").click(function () {
            $("li").each(function () {
                let paddings = $(this).css('padding').split('px ');
                if (($("#rightclick").position().top > $(this).position().top - parseInt(paddings[0]) && $("#rightclick").position().top < $(this).position().top + $(this).height() + parseInt(paddings[2])) && ($("#rightclick").position().left > $(this).position().left - parseInt(paddings[1]) && $("#rightclick").position().left < $(this).position().left + $(this).width() + parseInt(paddings[3]))) {
                    if ($(this).find(".quote").length >= 1) { //Testeo si hay quote en el mensaje
                        $("#m").val("\"" +
                            $(this).find("b").text() +
                            $(this).find("b").next().text() +
                            // No ponemos el quote
                            $(this).find("b").next().next().next().text() + "\" " +
                            $("#m").val()
                        );
                    } else {
                        $("#m").val("\"" +
                            $(this).find("b").text() +
                            $(this).find("b").next().text() +
                            $(this).find("b").next().next().text() +
                            $(this).find("b").next().next().next().text() + "\" " +
                            $("#m").val()
                        );
                    }
                    return;
                }
            })
        });

        $("#delete").click(function () {
            $("li").each(function () {
                let paddings = $(this).css('padding').split('px ');
                if (($("#rightclick").position().top > $(this).position().top - parseInt(paddings[0]) && $("#rightclick").position().top < $(this).position().top + $(this).height() + parseInt(paddings[2])) && ($("#rightclick").position().left > $(this).position().left - parseInt(paddings[1]) && $("#rightclick").position().left < $(this).position().left + $(this).width() + parseInt(paddings[3]))) {
                    var header = uuid_header;
                    header.message_uuid = $(this).attr('id').substr(8);
                    httpPostAsync('/api/deletemessage/', header, function (res) { });
                    return;
                }
            })
        });
        var edit_header = uuid_header;
        edit_header.message = $(this).find('b').next().text();
        var is_editing = false;
        $("#edit").click(function () {
            $("li").each(function () {
                let paddings = $(this).css('padding').split('px ');
                if (($("#rightclick").position().top > $(this).position().top - parseInt(paddings[0]) && $("#rightclick").position().top < $(this).position().top + $(this).height() + parseInt(paddings[2])) && ($("#rightclick").position().left > $(this).position().left - parseInt(paddings[1]) && $("#rightclick").position().left < $(this).position().left + $(this).width() + parseInt(paddings[3]))) {
                    let sender = $(this).find('b').text();
                    sender = sender.substr(0, sender.length - 2);
                    if (!is_editing && username == sender) {
                        edit_header.message = $(this).find('b').next().text();
                        edit_header.timestamp = parseInt(toTimestamp($(this).attr('id')));
                        console.log(edit_header.timestamp)
                        edit_header.message_uuid = $(this).attr('id').substr(8);

                        is_editing = true;

                        prev_html = $('#messages').html();
                        let input = $('<textarea>').val(edit_header['message']);
                        input.attr('id', 'editing');
                        
                        $(this).find('b').next().remove();
                        $(this).find('b').parent().append(input);
                        
                        let space_left = $(window).width() - input.offset().left - input.parent().next().width() - parseFloat(input.parent().next().css('right'));
                        input.width(space_left);
                        input.attr('rows', countTextareaLines(input[0])+'');
                        input.parent().parent().height(input.height());
                        input.bind('input propertychange', function(){
                            input.attr('rows', countTextareaLines(input[0])+'');
                            //console.log(input.parent().height(), input[0].scrollHeight);
                            input.parent().parent().height(input.height());
                        });
                        $(this).find('b').next().focus();
                        editing_message_val = $(this).find('b').next().val();
                    }
                }
            })
        });

        var user_colors = {};

        if (!("Notification" in window)) {
            alert("This browser does not support desktop notifications");
            notifications_supported = false;
        }
        if (notifications_supported) {
            Notification.requestPermission(function () {
                notifications_allowed = (Notification.permission == 'granted');
                console.log('Notifications_Allowed:', notifications_allowed);
            });
        }

        $("#space").height($("#footer").height() + 10);
        window.sessionStorage.clear();

        var last_message_timestamp = 0;
        var last_message_uuid = '13814000-1dd2-11b2-8080-808080808080'; // Smallest posible UUID for timestamp 0 (1/1/1970 00:00:00)
        var last_message_timestamp_notified = 0;
        let prev_json = {};
        let first_load = true;

        let interval = window.setInterval(function () {
            prev_html = $('#messages').html();
            httpPostAsync('/api/loadmessages/' + last_message_uuid, uuid_header, function (res) {
                if (res !== '' || res !== '[]') {
                    //$('#messages').html('');
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
                            let date_message = $('<li>');
                            date_message.attr("class", "date");
                            date_message.append(day);
                            $("#messages").append(date_message);
                        }

                        if (!Object.keys(user_colors).includes(username)) {
                            let response = httpGetSync("/api/getSettings/" + encodeURIComponent(username));
                            user_colors[username] = JSON.parse(response);
                        }
                        let color = user_colors[username].color;
                        let new_message = $('<li id=message-' + last_message_uuid + '>');
                        new_message.append($('<img>').attr('src', IMG_URL_HEADER + user_colors[username].image).attr("id", "chat_prof_pic"));//.css("display", 'inline_block').css("width", '2%').css("height", '2%'));
                        let new_message_body = $('<span style="position: absolute">');
                        new_message_body.append($('<b>').text(username + ': ').css("color", color));

                        let linkMatch = message.match(/([\w\d]+):\/\/([\w\d\.-]+)\.([\w\d]+)\/?([\w\d-@:%_\+.~#?&/=]*)/g);
                        let quoteMatch = message.match(/\"(.+): ((.)+)\"/);
                        let quotecss = "";
                        let quoteuser = "";
                        if (quoteMatch) {
                            quotecss = "border-left: 3px  " + user_colors[quoteMatch[1]].color + " solid; background-color: " + user_colors[quoteMatch[1]].color + "50;";
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

                        }

                        else if (linkMatch) { // Only link in message
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

                        }

                        else if (quoteMatch) { // Only quote in message
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
                        }

                        else { // No links or quotes in message
                            new_message_body.append($("<span>").text(message)); // Span is there to get the text for the quoting system
                        };

                        if (username != getCookie('hermes_username') && !first_load && last_message_timestamp_notified < last_message_timestamp) {
                            sendNotifiaction("New message from " + username, username + ": " + message, 'data:image/png;base64,' + user_colors[username].image);
                            last_message_timestamp_notified = last_message_timestamp;
                        }
                        let time_el = $("<span class='time'>").text(hour);
                        new_message_body.attr('class', 'message_body');

                        new_message.append(new_message_body);
                        new_message.append(time_el);

                        let message_with_body = new_message;

                        const MESSAGE_HEIGHT = 16;
                        if (message_json.edited) { // It's an edited message
                            $('li#message-' + message_json.uuid).replaceWith(new_message);
                            message_with_body = $('li#message-' + message_json.uuid);
                            last_message_uuid = message_json.time_uuid;
                        } else { // It isn't
                            $('#messages').append(new_message);
                            
                        }

                        new_message_body.width($(window).width() - new_message_body.offset().left - time_el.width() - parseFloat(time_el.css('right')));
                        
                        if (new_message_body.height() > MESSAGE_HEIGHT) {
                            message_with_body.height(new_message_body.height());
                        }
                        
                        $('html, body').animate({
                            scrollTop: $("#space").offset().top
                        }, 0);
                        first_load = false;
                        prev_json = message_json;
                    }
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
                    httpPostAsync('/api/editmessage/', edit_header, function (res) { });
                    editing_message_timestamp = 0;
                    editing_message_val = '';
                    is_editing = false;
                }
            });
        }, 100)
    });
});

//JS para el boton que te baja al final del chat 29-12-2018
var y, alturaElementos = 0;
window.onload = function () {
    for (var i = 0; i < document.getElementById('messages').childElementCount; i++) {
        alturaElementos += document.getElementById('messages').children[i].offsetHeight;
    }
    window.onscroll = scrollFunction();
    function scrollFunction() {
        y = document.getElementById('space').offsetTop;
        if (window.scrollY < y - alturaElementos - window.innerHeight + $("#space").height()) {
            document.getElementById("myBtn").style.display = "block";
        } else {
            document.getElementById("myBtn").style.display = "none";
        }
    }
}
function topFunction() {
    document.body.scrollTop = y;
    document.documentElement.scrollTop = y;
}

