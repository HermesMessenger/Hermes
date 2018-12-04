if(getCookie('hermes_style')=='dark'){
    $('#hermes_style').attr('href', 'css/dark/style.css');
}

$('.message a').click(function(){
   $('form').animate({height: "toggle", opacity: "toggle"}, "fast");
});
