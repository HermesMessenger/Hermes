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
let animate_out = function () { };
let theme_map = {}
let r_theme_map = {}

function loadSettingsJS(res) {
    var acc = document.getElementsByClassName("accordion");
    var i;
    var modal = document.getElementById('myModal');
    var modalContent = document.getElementById('modal-content');
    var btn = document.getElementById("settings");
    var span = document.getElementsByClassName("close")[0];
    var notselect = document.getElementById("notselect");
    httpGetAsync('/api/getThemes', (data) => {
        let themes = JSON.parse(data);
        for (let theme of themes) {
            $('#theme').prepend($(`<option data="${theme.theme_name}">`).text(theme.display_name))
            theme_map[theme.theme_name] = theme.display_name;
            r_theme_map[theme.display_name] = theme.theme_name;
        }

        function startColor() {
            if (notselect.value == "always") {
                notselect.style.background = "#88ff88";
            } else if (notselect.value == "tagged") {
                notselect.style.background = "#edff88";
            } else if (notselect.value == "never") {
                notselect.style.background = "#ff8888";
            }
        }

        function loadElectronSettings() {
            let res = window.getSettings()

            document.getElementById("id_launch_at_boot").checked = res.launch_at_boot;
            document.getElementById("id_stay_logged_in").checked = res.stay_logged_in;
            document.getElementById("id_use_testing").checked = res.testing;
            document.getElementById("id_minimize").checked = res.minimize;
            document.getElementById("id_check_updates").checked = res.check_updates;
        }

        if (isElectron()) loadElectronSettings()

        function loadSettingsFromDB() {
            image_used = res.image;
            document.getElementById("image").src = IMG_URL_HEADER + res.image;
            $("input#color")[0].jscolor.fromString(res.color)
            lastColor = res.color;
            switch (res.notifications) {
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
            $("#theme").val(theme_map[res.theme]);
        }

        function loadThemeFromSettings() {
            let theme = res.theme;
            if (getCookie('hermes_theme') != theme) {
                setTheme(theme);
            }
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
            $("#darkoverlay").click()
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
                let newTheme = r_theme_map[$("#theme").val()];
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


        document.querySelector('input[type=file]').onchange = function () {
            loadPictureAsURL();
        }

        loadThemeFromSettings();
    })

}

function loadPictureAsURL(callback) {
    var file = document.querySelector('input[type=file]').files[0];
    var reader = new FileReader();

    reader.onloadend = function () {
        let picURL = reader.result;
        resizeImage(picURL, IMG_WIDTH, IMG_HEIGHT, function (picURL) {
            document.getElementById("image").src = picURL;
            if (callback) callback(picURL);
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
    httpPostStatusAsync('/api/updatePassword', {
        uuid: uuid_header.uuid,
        old_password: $('#old').val(),
        new_password: $('#new').val(),
        new_password_repeat: $('#repeat').val()
    }, function (text, status) {
        console.log('PASSWORD STATUS:', status);
    });
}

function saveRegularSettings() {

    loadPictureAsURL(function (PicURL) {
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
        let color = $("#color").val();
        if (color != lastColor) changed = true;
        let clean_color = color.substring(1);
        let theme = r_theme_map[$("#theme").val()];
        httpPostAsync("/api/saveSettings", {
            uuid: uuid_header.uuid,
            color: clean_color,
            notifications: notifications,
            theme: theme,
            image_b64: picture_b64
        });
        if ($("#old").val() != '') updatePassword();
    });
}

function saveElectronSettings() {
    let settings = {
        launch_at_boot: $("#id_launch_at_boot").is(':checked'),
        stay_logged_in: $("#id_stay_logged_in").is(':checked'),
        use_testing: $("#id_use_testing").is(':checked'),
        minimize: $("#id_minimize").is(':checked'),
        check_updates: $("#id_check_updates").is(':checked'),
    }

    window.sendSettings(settings)
}

function saveSettings() {
    saveRegularSettings();
    if (isElectron()) saveElectronSettings();

    animate_out();
}