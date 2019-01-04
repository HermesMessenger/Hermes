var notifications_supported = true;
var notifications_allowed = false;

function sendNotifiaction(user, message, image) {
    if (notifications_allowed && notifications_supported) {
        if (!!(ifvisible.now())) {
            console.log(image);
            new Notification(user, {
                body: message,
                icon: image
            });
        };
    }
}

if (navigator.userAgent.indexOf('Electron') !== -1) { // App is running through Electron
    window.sendUUID(getCookie('hermes_uuid'));
}

if (getCookie('hermes_style') == 'dark') {
    $('#hermes_style').attr('href', 'css/dark/chat.css');
    $('#settings_style').attr('href', 'css/dark/settings.css');
}

$(function () {
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
        const NULLCHAR = String.fromCharCode(0x0);
        const SEPCHAR = String.fromCharCode(0x1);
        let line_length = 150;
        $('#message_send_form').submit(function () {
            msg = $('#m').val();
            var header = uuid_header;
            header['message'] = msg;
            httpPostAsync('/api/sendmessage/', header, function (res) { });
            $('#m').val('');
            return false;
        });

        $("#quote").click(function () {
            $("li").each(function () {
                if (($("#rightclick").position().top > $(this).position().top && $("#rightclick").position().top < $(this).position().top + $(this).height()) && ($("#rightclick").position().left > $(this).position().left && $("#rightclick").position().left < $(this).position().left + $(this).width())) {
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
                }
            })
        });

        var loaded_messages = 0;
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
            httpPostAsync('/api/loadmessages', uuid_header, function (res) {
                if (res !== '') {
                    let messages = res.split(NULLCHAR);
                    let first_load = (loaded_messages == 0);
                    let prev_pair = [];
                    for (let i = 0; i < messages.length; i++) {
                        let message_pair = messages[i].split(SEPCHAR);
                        if (loaded_messages <= i) {
                            let username = message_pair[0];
                            let message = message_pair[1];
                            //console.log(message);
                            let time = new Date(parseInt(message_pair[2]));
                            let prev_time = new Date(parseInt(prev_pair[2]));
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
                            let new_message = $('<li id=message' + i + '>');
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
                                    .replace(/[[]]/g, "openbracket")
                                    .replace(/[\]]/g, "closebracket");
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
                                } else if (quoteEnd < linkStart){ // Link after quote
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

                                        if (r + 1 == linkNum) {
                                            new_message_body.append($("<span>").text(message.substring(linkEnd, quoteStart)));
                                        } else {
                                            new_message_body.append($("<span>").text(message.substring(linkEnd, nextLinkStart)));
                                        }
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
                                //console.log(quoteSpan)
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
                                quoteStart = message.search(quoteMatch[0]);
                                quoteEnd = quoteStart + (quoteMatch[0].length);
                                new_message_body.append($("<span>").text(message.substring(0, quoteStart)));
                                new_message_body.append(quoteSpan);
                                new_message_body.append($("<span>").text(message.substring(quoteEnd)));
                            }

                            else { // No links or quotes in message
                                new_message_body.append($("<span>").text(message)); // Span is there to get the text for the quoting system
                            };

                            if (username != getCookie('hermes_username') && !first_load) {
                                sendNotifiaction("New message from " + username, username + ": " + message, 'data:image/png;base64,'+user_colors[username].image);
                            }

                            new_message.append(new_message_body);
                            let time_el = $("<span class='time'>").text(hour);
                            new_message.append(time_el);

                            $('#messages').append(new_message);
                            new_message_body.width(window.innerWidth - 45 - time_el.width());
                            if (new_message_body.height() > 16) {
                                new_message.height(new_message_body.height());
                            }
                            $('html, body').animate({
                                scrollTop: $("#space").offset().top
                            }, 0)
                            loaded_messages++;
                        }
                        prev_pair = message_pair;
                    }
                }

            });
        }, 500);
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

