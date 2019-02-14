const IMG_URL_HEADER = "data:image/png;base64,";
const uuid_header = {
    uuid: getCookie('hermes_uuid')
};
const IMG_WIDTH = 128;
const IMG_HEIGHT = 128;
let image_used = undefined;
let lastTheme = 'light';
let lastColor = '';
var changed = false;
let animate_out = () => {};

function loadSettingsJS() {

    var acc = document.getElementsByClassName("accordion");
    var i;
    var modal = document.getElementById('myModal');
    var modalContent = document.getElementById('modal-content-id');
    var btn = document.getElementById("settings");
    var span = document.getElementsByClassName("close")[0];
    var notselect = document.getElementById("notselect");
    var oldpwdbox = document.getElementById("old_pwd_box");
    var newpwdbox = document.getElementById("new_pwd_box");
    var oldpwd = document.getElementById("old");
    var newpwd = document.getElementById("new");
    var newpwdrep = document.getElementById("repeat");

    function startColor() {
        if (notselect.value == "always") {
            notselect.style.background = "#88ff88";
        } else if (notselect.value == "tagged") {
            notselect.style.background = "#edff88";
        } else if (notselect.value == "never") {
            notselect.style.background = "#ff8888";
        }
    }

    function loadSettingsFromDB() {
        httpPostAsync("/api/getSettings", uuid_header, (response) => {
            let json_reponse = JSON.parse(response);
            image_used = json_reponse.image;
            document.getElementById("img_element").src = IMG_URL_HEADER + json_reponse.image;
            $("input[type=color]").val(json_reponse.color);
            lastColor = json_reponse.color;
            switch (json_reponse.notifications) {
                case 0:
                    $("#notselect").val('always');
                    break;
                case 1:
                    $("#notselect").val('tagged');
                    break;
                case 2:
                    $("#notselect").val('never');
                    break;
            }
            startColor();
            lastTheme = json_reponse.dark ? 'dark' : 'light';
            document.getElementById("dark_theme_box").checked = json_reponse.dark;
        });
    }

    function loadThemeFromSettings() {
        httpPostAsync("/api/getSettings", uuid_header, (response) => {
            let json_reponse = JSON.parse(response);
            let db_theme = json_reponse.dark ? 'dark' : 'light';
            if (getCookie('hermes_style') == "") {
                setTheme(db_theme);
            } else if (getCookie('hermes_style') != db_theme) {
                setTheme(db_theme);
            }
        });
    }

    startColor();

    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    }

    btn.onclick = function () {
        loadSettingsFromDB();
        modal.style.display = "block";
        modal.style.animationName = "fadeIn";
        modalContent.style.animationName = "slideIn";

    }

    function slideSettingsOut() {
        modal.style.animationName = "fadeOut";
        modalContent.style.animationName = "slideOut";
        setTimeout(function () {
            modal.style.display = "None";
        }, 400);
    }

    function slideSettingsOutReloading() {
        modal.style.animationName = "fadeOut";
        modalContent.style.animationName = "slideOut";
        setTimeout(function () {
            modal.style.display = "None";
            let newTheme = $("#dark_theme_box").is(":checked") ? 'dark' : 'light';
            if (lastTheme != newTheme) {
                lastTheme = newTheme;
                setTheme(newTheme);
            } else {
                if (changed) location.reload();
            }
        }, 400);
    }
    animate_out = slideSettingsOutReloading;

    span.onclick = slideSettingsOut;

    window.onclick = function (event) {
        if (event.target == modal) {
            slideSettingsOut();
        }
    }

    notselect.onchange = startColor;

    oldpwdbox.onchange = () => {
        if (oldpwdbox.checked) {
            oldpwd.type = 'text';
        } else {
            oldpwd.type = 'password';
        }
    }

    newpwdbox.onchange = () => {
        if (newpwdbox.checked) {
            newpwd.type = 'text';
            newpwdrep.type = 'text';
        } else {
            newpwd.type = 'password';
            newpwdrep.type = 'password';
        }
    }

    document.querySelector('input[type=file]').onchange = function () {
        loadPictureAsURL(() => {});
    }

    loadThemeFromSettings();

}

function loadPictureAsURL(callback) {
    var file = document.querySelector('input[type=file]').files[0];
    var reader = new FileReader();

    reader.onloadend = function () {
        let picURL = reader.result;
        resizeImage(picURL, IMG_WIDTH, IMG_HEIGHT, (picURL) => {
            document.getElementById("img_element").src = picURL;
            callback(picURL);
        });
    }
    if (file) {
        reader.readAsDataURL(file); //reads the data as a URL
    } else {
        callback(undefined);
    }
}

function resizeImage(URL, width, height, callback) {
    var img = new Image();
    img.src = URL;
    img.onload = function () {
        console.log(img.width, img.height);
        var canvas = document.createElement("canvas", {
            id: "resize_canvas"
        });
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        ctx.save();
        let new_url = canvas.toDataURL("image/png");
        callback(new_url);
    }
}

function updatePassword() {
    httpPostStatusAsync('/api/updatePassword',{
        uuid: uuid_header.uuid,
        old_password: $('#old').val(),
        new_password: $('#new').val(),
        new_password_repeat: $('#repeat').val()
    }, (text, status)=>{
        console.log('PASSWORD STATUS:', status);
    });
    console.log("Password updating is not implemented");
}

function saveRegularSettings() {
    loadPictureAsURL((PicURL) => {
        let pic_regex = /data:image\/\w+;base64,(.+)/;
        let picture_b64 = encodeURIComponent(PicURL ? pic_regex.exec(PicURL)[1] : image_used);
        if (PicURL) changed = true;
        let notifications = 0;
        switch ($("#notselect").val()) {
            case 'always':
                notifications = 0;
                break;
            case 'tagged':
                notifications = 1;
                break;
            case 'never':
                notifications = 2;
                break;
        }
        let color = $("input[type=color]").val();
        if (color != lastColor) changed = true;
        let clean_color = color.substring(1);
        let dark_theme = $("#dark_theme_box").is(":checked");
        httpPostAsync("/api/saveSettings", {
            uuid: uuid_header.uuid, 
            color: clean_color, 
            notifications: notifications,
            dark: dark_theme, 
            image_b64: picture_b64
        }, ()=>{});
        if ($("#old").val() != '') updatePassword();
    });
}

function saveElectronSettings() {
    console.log('Saving electron settings');
    console.log("Electron settings are not implemented");
}

function saveSettings(type) {
    switch (type) {
        case 'regular':
            saveRegularSettings();
            break;
        case 'electron':
            saveRegularSettings();
            saveElectronSettings();
            break;
    }
    animate_out();
}