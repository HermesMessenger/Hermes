import path from 'path'

const webPath = path.join(__dirname, '../web/')
const htmlPath = path.join(webPath, 'html/')
const loginPagesPath = path.join(htmlPath, 'LoginPages/')
const botPagesPath = path.join(htmlPath, 'BotPages/')
const jsPath = path.join(webPath, 'js/')
const jsLibPath = path.join(jsPath, 'lib/')
const cssPath = path.join(webPath, 'css/')
const themePath = path.join(cssPath, 'themes/')
const imgPath = path.join(webPath, 'images/')
const pwaPath = path.join(webPath, 'PWA/')

const paths = { webPath, htmlPath, loginPagesPath, botPagesPath, jsPath, jsLibPath, cssPath, themePath, imgPath, pwaPath }

export { paths }
