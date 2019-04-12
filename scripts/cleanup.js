const fs = require('fs');
const {execSync} = require('child_process');
const HELP_TEXT = `
 Usage:
 <program command> [options]
 Where:
    [options]: any of these, or multiple:
        --npm-p | --npm | -n : same as npm prune (Removes unnecessary dependecies)
        --npm-rm | -N : remove node_modules directory
        --css | -c : removes built css
        --help | -h : show this prompt
    Note that when using npm run cleanup, to add options use
    npm run cleanup -- [options]
 If no options are given it defaults to --help
`
const CSS_FLAG = 0b0001
const NPM_PRUNE_FLAG = 0b0010
const NPM_RM_FLAG = 0b0100
const HELP_FLAG = 0b1000
let flags = 0
process.argv.forEach((arg, idx, argv) => {
    if (arg.startsWith('--')) {
        if (arg == '--npm') {
            flags |= NPM_PRUNE_FLAG;
        } else if (arg == '--npm-p') {
            flags |= NPM_PRUNE_FLAG;
        } else if (arg == '--npm-rm') {
            flags |= NPM_RM_FLAG;
        } else if (arg == '--css') {
            flags |= CSS_FLAG;
        } else if (arg == '--help') {
            flags = HELP_FLAG;
        }
    } else if (arg.startsWith('-')) {
        for (let char of arg.substr(1)) {
            if (char == 'n') {
                flags |= NPM_PRUNE_FLAG;
            } else if (char == 'N') {
                flags |= NPM_RM_FLAG;
            } else if (char == 'c') {
                flags |= CSS_FLAG;
            } else if (char == 'h') {
                flags = HELP_FLAG;
            }else{
                console.log(`'${char}' flag ignored`)
            }
        }
    }
});

flags = flags == 0 ? HELP_FLAG : flags;

if ((flags & HELP_FLAG) != 0) {
    console.log(HELP_TEXT.replace('<program command>', `node cleanup.js`));
    process.exit()
}
moveToProjectBase();
if ((flags & CSS_FLAG) != 0) {
    console.log('>> Cleaning up CSS');
    if (fs.existsSync('web_client/css')) {
        deleteFolderRecursive('web_client/css');
        fs.mkdirSync('web_client/css');
        console.log('>> CSS cleanup done!')
    } else {
        console.log('>> No CSS directory found in web_client/css')
    }
}

if ((flags & NPM_PRUNE_FLAG) != 0) {
    console.log('>> Running npm prune');
    let o = execSync('npm prune',{encoding: 'utf8'});
    process.stdout.write(o)
    console.log('>> Done running npm prune!');
}

if ((flags & NPM_RM_FLAG) != 0) {
    console.log('>> Removing node_modules')
    deleteFolderRecursive('node_modules')
    console.log('>> Done removing node_modules!')
}

function moveToProjectBase() {
    if (process.cwd() == '/') {
        console.log('>> No base npm project found!');
        process.exit(1);
    }
    if (!fs.readdirSync(process.cwd()).includes('package.json')) {
        process.chdir('..');
        moveToProjectBase()
    }
}

function deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            var curPath = path + "/" + file;
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};