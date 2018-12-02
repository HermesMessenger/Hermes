var notifications_supported = true;
var notifications_allowed = false;

function sendNotifiaction(user, message) {
    if (notifications_allowed && notifications_supported) {
        if (!(ifvisible.now())){
            new Notification(user, {
                body: message,
                icon: '/favicon.png' /* TODO: be the user's profile image */
            });
        };
    }
}


$(function () {
    const uuid_header = {uuid: getCookie('hermes_uuid')};
    $('#logout_uuid').val(getCookie('hermes_uuid'));
    $("#rightclick").hide();
    $(document).click(function () {
        $("#rightclick").hide(100); //Hide on click outside
    })
    var username;
    httpPostAsync('/api/getusername', uuid_header, function(res){
        username = res;
        $('#user').append($('<b>').text(username + ':'));
        const NULLCHAR = String.fromCharCode(0x0);
        const SEPCHAR = String.fromCharCode(0x1);
        let line_length = 150;
        $('#message_send_form').submit(function () {
            msg = encodeURIComponent($('#m').val()).split("");
            msg = msg.join("");	
            httpPostAsync('/api/sendmessage/' + msg, uuid_header, function (res) {});
            $('#m').val('');
            return false;
        });

        $("#quote").click(function () {
            $("li").each(function () {
                if (($("#rightclick").position().top > $(this).position().top && $("#rightclick").position().top < $(this).position().top + $(this).height()) && ($("#rightclick").position().left > $(this).position().left && $("#rightclick").position().left < $(this).position().left + $(this).width())) {
                  if($(this).find(".quote").length>=1){ //Testeo si hay quote en el mensaje
                    $("#m").val("\""+
                    $(this).find("b").text()+
                    $(this).find("b").next().text()+
                    // No ponemos el quote
                    $(this).find("b").next().next().next().text()+"\" "+
                    $("#m").val()
                    );
                  }else{
                    $("#m").val("\""+
                    $(this).find("b").text()+
                    $(this).find("b").next().text()+"\" "+
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
                            let username = decodeURIComponent(message_pair[0]);
                            let message = decodeURIComponent(message_pair[1]);
                            let time = new Date(parseInt(decodeURIComponent(message_pair[2])));
                            let prev_time = new Date(parseInt(decodeURIComponent(prev_pair[2])));
                            let day = time.getDate() + '/' + (time.getMonth()+1) + '/' + time.getFullYear();
                            let hour = padNumber(time.getHours()) + ':' + padNumber(time.getMinutes()) + ':' + padNumber(time.getSeconds());
                            let prev_day = prev_time.getDate() + '/' + (prev_time.getMonth()+1) + '/' + prev_time.getFullYear();
                            if (day != prev_day) {
                                let date_message = $('<li>');
                                date_message.attr("class", "date");
                                date_message.append(day);
                                $("#messages").append(date_message);
                            }
                            if (!Object.keys(user_colors).includes(username)) {
                                user_colors[username] = 'rgb(' + getRandomRGBPart() + ',' + getRandomRGBPart() + ',' + getRandomRGBPart() + ')';
                            }
                            let color = user_colors[username];
                            let new_message = $('<li>');
                            new_message.append($('<b>').text(username + ': ').css("color", color));

                            let linkMatch = message.match(/([\w\d]+):\/\/([\w\d\.-]+)\.([\w\d]+)\/?([\w\d-@:%_\+.~#?&/=]*)/g);
                            let quoteMatch = message.match(/\"(.+): ((.)+)\"/);

                            if (linkMatch && quoteMatch) { // Both links and quotes in message

                                linkStart = message.search(linkMatch[0]);
                                linkEnd = linkStart + (linkMatch[0].length);
                                linkNum = linkMatch.length;
                                let linkSpan = $('<a>').attr('target','_blank').attr('href', linkMatch[0]).text(linkMatch[0]);

                                quoteStart = message.search(quoteMatch[0]);
                                quoteEnd = quoteStart + (quoteMatch[0].length);
                                let quoteSpan = $("<span>").text(quoteMatch[0].substring(1, quoteMatch[0].length - 1)).attr("class", "quote " + quoteMatch[1].replace(/[ ]/g,"space"));

                                let cssRuleExists = false;
                                for (var r = 0; r < document.styleSheets[document.styleSheets.length - 1].rules; r++) {
                                    if (document.styleSheets[document.styleSheets.length - 1].rules[r].selectorText.includes(quoteMatch[1].replace(/[ ]/g,"space"))) {
                                        cssRuleExists = true;
                                        break
                                    }
                                }
                                if (!cssRuleExists) {
                                    document.styleSheets[document.styleSheets.length - 1].addRule(".quote." + quoteMatch[1].replace(/[ ]/g,"space") + ":before", "border: 2px  " + user_colors[quoteMatch[1]] + " solid;");
                                }

                                if (quoteStart < linkStart) {
                                    new_message.append($("<span>").text(message.substring(0,quoteStart)));
                                    new_message.append(quoteSpan);
                                    new_message.append($("<span>").text(message.substring(quoteEnd, linkStart)));

                                    for (let r = 0; r < linkNum; r++) {
                                        oldLinkEnd = linkStart + (linkMatch[r].length);
                                        linkStart = message.search(linkMatch[r]);
                                        linkEnd = linkStart + (linkMatch[r].length);
                                        nextLinkStart = message.search(linkMatch[r + 1]);
    
                                        let linkSpan = $('<a>').attr('target','_blank').attr('href', linkMatch[r]).text(linkMatch[r]);
                                        new_message.append(linkSpan);

                                        if (r + 1 == linkNum) {
                                            new_message.append($("<span>").text(message.substring(linkEnd)));
                                        } else {
                                            new_message.append($("<span>").text(message.substring(linkEnd, nextLinkStart)));
                                        }
                                    }

                                    new_message.append($("<span>").text(message.substring(linkEnd)));

                                } else {
                                    new_message.append($("<span>").text(message.substring(0,linkStart)));
                                    for (let r = 0; r < linkNum; r++) {
                                        oldLinkEnd = linkStart + (linkMatch[r].length);
                                        linkStart = message.search(linkMatch[r]);
                                        linkEnd = linkStart + (linkMatch[r].length);
                                        nextLinkStart = message.search(linkMatch[r + 1]);
    
                                        let linkSpan = $('<a>').attr('target','_blank').attr('href', linkMatch[r]).text(linkMatch[r]);
                                        new_message.append(linkSpan);

                                        if (r + 1 == linkNum) {
                                            new_message.append($("<span>").text(message.substring(linkEnd)));
                                        } else {
                                            new_message.append($("<span>").text(message.substring(linkEnd, nextLinkStart)));
                                        }
                                    }

                                    new_message.append($("<span>").text(message.substring(linkEnd, quoteStart)));
                                    new_message.append(quoteSpan);
                                    new_message.append($("<span>").text(message.substring(quoteEnd)));
                                }

                            }

                            else if (linkMatch) { // Only link in message
                                linkNum = linkMatch.length;
                                new_message.append($("<span>").text(message.substring(0, message.search(linkMatch[0]))));

                                for (let r = 0; r < linkNum; r++) {
                                    linkStart = message.search(linkMatch[r]);
                                    linkEnd = linkStart + (linkMatch[r].length);
                                    nextLinkStart = message.search(linkMatch[r + 1]);

                                    let linkSpan = $('<a>').attr('target','_blank').attr('href', linkMatch[r]).text(linkMatch[r]);
                                    new_message.append(linkSpan);
                                    if (r + 1 == linkNum) {
                                        new_message.append($("<span>").text(message.substring(linkEnd)));
                                    } else {
                                        new_message.append($("<span>").text(message.substring(linkEnd, nextLinkStart)));
                                    }
                                }

                            }

                            else if (quoteMatch) { // Only quote in message
                                let quoteSpan = $("<span>").text(quoteMatch[0].substring(1, quoteMatch[0].length - 1)).attr("class", "quote " + quoteMatch[1].replace(/[ ]/g,"space"));
                                //console.log(quoteSpan)
                                let cssRuleExists = false;
                                for (let r = 0; r < document.styleSheets[document.styleSheets.length - 1].rules; r++) {
                                    if (document.styleSheets[document.styleSheets.length - 1].rules[r].selectorText.includes(quoteMatch[1].replace(/[ ]/g,"space"))) {
                                        cssRuleExists = true;
                                        break
                                    }
                                }
                                if (!cssRuleExists) {
                                    document.styleSheets[document.styleSheets.length - 1].addRule(".quote." + quoteMatch[1].replace(/[ ]/g,"space") + ":before", "border: 2px  " + user_colors[quoteMatch[1]] + " solid;");
                                }
                                quoteStart = message.search(quoteMatch[0]);
                                quoteEnd = quoteStart + (quoteMatch[0].length);
                                new_message.append($("<span>").text(message.substring(0,quoteStart)));
                                new_message.append(quoteSpan);
                                new_message.append($("<span>").text(message.substring(quoteEnd)));
                            }
                            
                            else { // No links or quotes in message
                                new_message.append($("<span>").text(message)); // Span is there to get the text for the quoting system
                            };

                            if (username != getCookie('hermes_username') && !first_load) {
                                sendNotifiaction("New message from " + username, username + ": " + message);
                            }

                            new_message.append("<span class='time'>" + hour + "</span>");

                            $('#messages').append(new_message);
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
