var notifications_supported = true;
var notifications_allowed = false;

function httpGetAsync(theUrl, callback){
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function sendNotifiaction(user, message){
    if(notifications_allowed && notifications_supported){
        new Notification(user, {body: message, icon: '/favicon.png' /* TODO: be the user's profile image */});
    }
}

function getRandomRGBPart(){
    return Math.floor(Math.random() * 201);
}


function getCookie(cname) { // From W3Schools
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
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


$(function () {
    $("#rightclick").hide();
    $(document).click(function (){
      $("#rightclick").hide(100); //Hide on click outside
    })
    $('#user').append($('<b>').text(getCookie('hermes_username')+':'));
    const NULLCHAR = String.fromCharCode(0x0);
    const SEPCHAR = String.fromCharCode(0x1);
    let line_length=150;
    $('form').submit(function(){
      msg=encodeURIComponent($('#m').val()).split("");
      for(var c=line_length;c<msg.length;c+=line_length){
        msg.splice(c,0,"<br>");
      }
      msg=msg.join("");
        // httpGetAsync('/sendmessage/'+encodeURIComponent(getCookie('hermes_username'))+'/'+encodeURIComponent($('#m').val()), function(res){});
        httpGetAsync('/sendmessage/'+encodeURIComponent(getCookie('hermes_username'))+'/'+msg, function(res){});
        $('#m').val('');
        return false;
    });
    $('#send').click(function(event) {
      msg=encodeURIComponent($('#m').val()).split("");
      for(var c=line_length;c<msg.length;c+=line_length){
        msg.splice(c,0,"<br>");
      }
      msg=msg.join("");
        // httpGetAsync('/sendmessage/'+encodeURIComponent(getCookie('hermes_username'))+'/'+encodeURIComponent($('#m').val()), function(res){});
        httpGetAsync('/sendmessage/'+encodeURIComponent(getCookie('hermes_username'))+'/'+msg, function(res){});
        $('#m').val('');
        return false;
    });

    $("#quote").click(function () {
      $("li").each(function () {
        if(($("#rightclick").position().top>$(this).position().top && $("#rightclick").position().top<$(this).position().top+$(this).height()) && ($("#rightclick").position().left>$(this).position().left && $("#rightclick").position().left<$(this).position().left+$(this).width())){
          if($(this).find("b").next().hasClass("quote")){
            $("#m").val("\""+
              $(this).find("b").text()+
              $(this).find("b").next().next().text()+" "+
              $(this).find("b").next().next().next().text()+"\""+" "+
              $("#m").val()
            );
          }else{
            $("#m").val("\""+
              $(this).find("b").text()+
              $(this).find("b").next().text()+" "+
              $(this).find("b").next().next().text()+"\""+" "+
              $("#m").val()
            );
          }
        }
      })
    });

    var loaded_messages = 0;
    var user_colors = {};

    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        notifications_supported = false;
    }
     if(notifications_supported){
        Notification.requestPermission(function(){
            notifications_allowed = (Notification.permission == 'granted');
            console.log('Notifications_Allowed:', notifications_allowed);
        });
    }

    window.sessionStorage.clear();
    window.setInterval(function(){
      $("#messages").find("li:not(.date)").each(function(){
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
        httpGetAsync('/loadmessages',function(res){
            if(res !== ''){
                let messages = res.split(NULLCHAR);
                let first_load = (loaded_messages == 0);
                let prev_pair=[];
                for (let i=0;i<messages.length;i++){
                  let message_pair = messages[i].split(SEPCHAR);
                    if(loaded_messages<=i){
                        let username = decodeURIComponent(message_pair[0]);
                        let message = decodeURIComponent(message_pair[1]);
                        let time = message_pair[2];

                        if(decodeURIComponent(prev_pair[2]).split("$")[0]!=decodeURIComponent(time).split("$")[0]){
                          let date_message=$('<li>');
                          date_message.attr("class","date");
                          date_message.append(decodeURIComponent(time).split("$")[0]);
                          $("#messages").append(date_message);
                        }
                        if(!Object.keys(user_colors).includes(username)){
                          user_colors[username] = 'rgb('+getRandomRGBPart()+','+getRandomRGBPart()+','+getRandomRGBPart()+')';
                        }
                        let color = user_colors[username];
                        let new_message = $('<li>');
                        new_message.append($('<b>').text(username+': ').css("color", color));
                        let match=message.match(/\"(\w+:) ((\w|[ ])+) (\d{2}:\d{2})\"/g);
                        if(message.match(/\"(\w+:) ((\w|[ ])+) (\d{2}:\d{2})\"/g)){
                          let quote_span = $("<span>").text(match[0]).attr("class","quote "+username.toLowerCase());
                          let cssRuleExists=false;
                          for(var r=0;r<document.styleSheets[2].rules;r++){
                            if(document.styleSheets[2].rules[r].selectorText.includes(username)){
                              cssRuleExists=true;
                              break
                            }
                          }
                          if(!cssRuleExists){
                            document.styleSheets[2].addRule(".quote."+username.toLowerCase()+":before","border: 2px  "+user_colors[username]+" solid;");
                          }
                          new_message.append(quote_span);
                          new_message.append($("<span>").html("<br>"+message.substr(match[0].length))); //Span is there to get the text for the quoting system
                        }else{
                          new_message.append($("<span>").text(message)); // Span is there to get the text for the quoting system
                        }

                        if (username != getCookie('hermes_username') && !first_load){
                            sendNotifiaction("New message from"+username,username+": "+message);
                        }

                        new_message.append("<span class='time'>"+decodeURIComponent(time.split("$")[1])+"</span>");

                        $('#messages').append(new_message);
                        $('html, body').animate({ scrollTop: $("#space").offset().top },0)
                        loaded_messages++;
                    }
                    prev_pair=message_pair;
                }
            }

        });
    }, 500);

});
