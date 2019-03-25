const fs = require('fs');
const { spawn, spawnSync, execSync, exec } = require('child_process');
const sass = require('sass');

Reset = "\x1b[0m"
Bright = "\x1b[1m"
Dim = "\x1b[2m"
Underscore = "\x1b[4m"
Blink = "\x1b[5m"
Reverse = "\x1b[7m"
Hidden = "\x1b[8m"

FgBlack = "\x1b[30m"
FgRed = "\x1b[31m"
FgGreen = "\x1b[32m"
FgYellow = "\x1b[33m"
FgBlue = "\x1b[34m"
FgMagenta = "\x1b[35m"
FgCyan = "\x1b[36m"
FgWhite = "\x1b[37m"

BgBlack = "\x1b[40m"
BgRed = "\x1b[41m"
BgGreen = "\x1b[42m"
BgYellow = "\x1b[43m"
BgBlue = "\x1b[44m"
BgMagenta = "\x1b[45m"
BgCyan = "\x1b[46m"
BgWhite = "\x1b[47m"

function startNode(){
    return exec('npm run start-no-css', {windowsHide: true, encoding: 'utf8'});
}

function killNode(){
    if(node_process){
        if(!node_process.killed){
            node_process.kill('SIGINT');
            console.log('>> Killed node process');
        }
    }
}

var node_process;
var last_p = '';
var jsTimeout = {t: null,f:undefined}
function jsChange(e, f){
    if (!jsTimeout.t && f != jsTimeout.f) {
        jsTimeout.t = setTimeout(function() { jsTimeout.t=null }, 2000) // give 2 seconds for multiple events
        jsTimeout.f = f;
        killNode();
        console.log('>> Started new node process');
        node_process = startNode();
        node_process.stdout.on('data', (data) => {
            if(last_p != 'NO')
                console.log('\x1b[36m[NODE OUT]')
            console.log((last_p == 'NO'?'\x1b[36m':'')+data.trim()+'\x1b[0m');
            last_p = 'NO';
        });
        node_process.stderr.on('data', (data) => {
            if(last_p != 'NE')
                console.log('\x1b[31m[NODE ERR]')
            console.log((last_p == 'NE'?'\x1b[31m':'')+data.trim()+'\x1b[0m');
            last_p = 'NE';
        });
    }
}
var scssTimeout = {t: null,f:undefined}
function scssChange(e, f){
    if (!scssTimeout.t && f != scssTimeout.f) {
        scssTimeout.t = setTimeout(function() { scssTimeout.t=null }, 2000) // give 2 seconds for multiple events
        scssTimeout.f = f;
        console.log('>> Running SASS compiler');
        let sass = execSync('npm run build-css-source-map', {encoding: 'utf8'});
        if(last_p != 'SO')
            console.log('\x1b[32m[SASS OUT]')
        console.log((last_p == 'SO'?'\x1b[32m':'')+sass.trim()+'\x1b[0m');
        last_p = 'SO';
    }
}

scssChange('start', '*');
jsChange('start', '*');


fs.watch('server.js', jsChange);
fs.watch('server/', {recursive: true}, jsChange);

fs.watch('web_client/scss/', {recursive: true}, scssChange);

function close(){
    killNode();
    if(node_process){
        node_process.on('close',()=>{
            console.log('>> Exited succesfully')
            process.exit();
        });
    }else{
        console.log('>> Exited succesfully')
        process.exit();
    }
}

// catches ctrl+c event
process.on('SIGINT', close);

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', close);
process.on('SIGUSR2', close);