// No themes for login
$(document).ready(() => {

    $('.message a').click(() => {
        $('form').animate({
            height: "toggle",
            opacity: "toggle"
        }, "fast");
    });

    let cookie_notice = $("#cn");
    cookie_notice.click(() => {
        cookie_notice.fadeOut("fast");
    });
})