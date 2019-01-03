const IMG_URL_HEADER = "data:image/png;base64,";
const uuid_header = {uuid: getCookie('hermes_uuid')};
let image_used = undefined;
let animate_out = ()=>{};

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

    function loadSettingsFromDB(){
        httpPostAsync("/api/getSettings", uuid_header, (response) => {
            let json_reponse = JSON.parse(response);
            image_used = json_reponse.image;
            document.getElementById("img_element").src = IMG_URL_HEADER+json_reponse.image;
            $("input[type=color]").val(json_reponse.color);
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
            document.getElementById("dark_theme_box").checked = json_reponse.dark;
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
        setTimeout(function(){
            modal.style.display = "None";
            location.reload();
        },400);
    }
    animate_out = slideSettingsOut;

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

    document.querySelector('input[type=file]').onchange = function(){
        loadPictureAsURL(()=>{});
    }


}

function loadPictureAsURL(callback) {
    var file = document.querySelector('input[type=file]').files[0];
    var reader = new FileReader();

    reader.onloadend = function () {
        let picURL = reader.result;
        // TODO: Resize image instead of checking if it's correct
        let img = new Image();
        img.onload = function () {
            if (img.width <= 128 && img.height <= 128) {
                document.getElementById("img_element").src = picURL;
                callback(picURL);
            } else {
                console.log('Image is too big');
                callback(undefined); // Calling the callback as if there wasn't an image
            }
        };
        img.src = picURL;

    }
    if (file) {
        reader.readAsDataURL(file); //reads the data as a URL
    } else {
        callback(undefined);
    }
}

function updatePassword() { // TODO
    console.log("Password updating is not implemented");
}

function saveRegularSettings() {
    loadPictureAsURL((PicURL) => {
        let pic_regex = /data:image\/\w+;base64,(.+)/;
        let picture_b64 = encodeURIComponent(PicURL ? pic_regex.exec(PicURL)[1] : image_used);
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
        let clean_color = color.substring(1,color.length);
        let dark_theme = $("#dark_theme_box").is(":checked");
        httpPostAsync("/api/saveSettings/"+clean_color+"/"+notifications+"/"+dark_theme+"/"+picture_b64, uuid_header, ()=>{});
        if ($("#old").val() != '') {
            updatePassword();
        }
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
