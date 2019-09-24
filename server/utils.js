module.exports.getNowStr = function () {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return day + "/" + month + "/" + year + "$" + hour + ":" + min + ":" + sec;
}

module.exports.getCurrentTimeStamp = function () {
    return parseInt(new Date()); // Gets the UNIX timestamp in milliseconds
}

module.exports.getThemes = function () {
    const fs = require('fs');
    let themes = [];
    let base_path = 'web_client/scss/themes';
    let files = fs.readdirSync(base_path);
    for (let file of files) {
        if (file.endsWith('.scss')) {
            let first_line = fs.readFileSync(`${base_path}/${file}`, { encoding: 'utf8' }).split('\n')[0].trim();
            let n_theme = {
                theme_name: file.replace(/\.scss$/, ''),
                display_name: file.replace(/\.scss$/, '')
            }
            if (/^\/\/.+/.test(first_line)) {
                n_theme.display_name = first_line.substring(2).trim();
            }
            themes.push(n_theme);
        }
    }
    return themes;
}
