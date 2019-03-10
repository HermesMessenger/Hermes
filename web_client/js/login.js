if (getCookie('hermes_style') == 'dark'){
    $('#hermes_style').attr('href', 'css/dark/login.css');
}

$('.message a').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "fast");
});

let cookie_notice = $("#cn");
cookie_notice.click(()=>{
    cookie_notice.fadeOut("fast");
});
