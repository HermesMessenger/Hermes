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


$(function () {
    $('#user').append($('<b>').text(getCookie('hermes_username')+':'));
    const NULLCHAR = String.fromCharCode(0x0);
    const SEPCHAR = String.fromCharCode(0x1);
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
    
    window.sessionStorage.clear();
    window.setInterval(function(){
        httpGetAsync('/loadmessages',function(res){
            if(res !== ''){
                let messages = res.split(NULLCHAR);
                for (let i=0;i<messages.length;i++){
                    if(loaded_messages<=i){
                        let message_pair = messages[i].split(SEPCHAR);
                        if(!Object.keys(user_colors).includes(message_pair[0])){
                            user_colors[message_pair[0]] = 'rgb('+getRandomRGBPart()+','+getRandomRGBPart()+','+getRandomRGBPart()+')';
                        }
                        let color = user_colors[message_pair[0]];
                        let new_message = $('<li>');
                        new_message.append($('<b>').text(decodeURIComponent(message_pair[0])+': ').css("color", color));
                        new_message.append(decodeURIComponent(message_pair[1]));
                        
                        $('#messages').append(new_message);
                        $('html, body').animate({ scrollTop: $("form").offset().top }, 1);
                        loaded_messages++;
                    }
                    
                }
            }
            
        });
    }, 500);

});