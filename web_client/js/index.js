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

function sendNotifiaction(user, message){
    if(notifications_allowed && notifications_supported){
        new Notification(user, {body: message, icon: '/favicon.png' /* TODO: be the user's profile image */});
    }
}


$(function () {
    $('#user').append($('<b>').text(getCookie('hermes_username')+':'));
    const NULLCHAR = String.fromCharCode(0x0);
    const NAMESEPCHAR = String.fromCharCode(0x1);
    $('form').submit(function(){        
        httpGetAsync('/sendmessage/'+encodeURIComponent(getCookie('hermes_username'))+'/'+encodeURIComponent($('#m').val()), function(res){});
        $('#m').val('');
        return false;
    });
    $('#send').click(function(event) {
        httpGetAsync('/sendmessage/'+encodeURIComponent(getCookie('hermes_username'))+'/'+encodeURIComponent($('#m').val()), function(res){});
        $('#m').val('');
        return false;
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
        httpGetAsync('/loadmessages',function(res){
            if(res !== ''){
                let messages = res.split(NULLCHAR);
                let first_load = (loaded_messages == 0);
                for (let i=0;i<messages.length;i++){
                    if(loaded_messages<=i){
                        let message_pair = messages[i].split(NAMESEPCHAR);
                        let username = decodeURIComponent(message_pair[0]);
                        let message = decodeURIComponent(message_pair[1]);
                        if(!Object.keys(user_colors).includes(username)){
                            user_colors[username] = 'rgb('+getRandomRGBPart()+','+getRandomRGBPart()+','+getRandomRGBPart()+')';
                        }
                        let color = user_colors[username];
                        let new_message = $('<li>');
                        new_message.append($('<b>').text(username+': ').css("color", color));
                        new_message.append(message);
                        if (username != getCookie('hermes_username') && !first_load){
                            sendNotifiaction("New message from"+username,username+": "+message);
                        }
                        
                        $('#messages').append(new_message);
                        $('html, body').animate({ scrollTop: $("#space").offset().top }, 0);
                        loaded_messages++;
                    }
                    
                }
            }
            
        });
    }, 500);

});
