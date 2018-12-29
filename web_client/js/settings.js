function loadSettingsJS(){

    var acc = document.getElementsByClassName("accordion");
    var i;
    var modal = document.getElementById('myModal');
    var btn = document.getElementById("settings");
    var span = document.getElementsByClassName("close")[0];
    var notselect = document.getElementById("notselect");

    function startColor(){
    if(notselect.value == "always"){
        notselect.style.background="#88ff88";
    }else if(notselect.value == "tagged"){
        notselect.style.background="#edff88";
    }else if(notselect.value == "never"){
        notselect.style.background="#ff8888";
    }
    }

    startColor();

    for (i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight){
        panel.style.maxHeight = null;
        } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
        }
    });
    }

    btn.onclick = function() {
    modal.style.display = "block";
    }

    span.onclick = function() {
    modal.style.display = "none";
    }

    window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
    }

    notselect.onchange = startColor;
}

function loadPicture(){
    var file    = document.querySelector('input[type=file]').files[0]; //sames as here
    var reader  = new FileReader();

    reader.onloadend = function () {
        console.log(reader.result);
    }

    if (file) {
        reader.readAsDataURL(file); //reads the data as a URL
    }
}
