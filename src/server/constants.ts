import path from 'path'

const webClientPath = path.join(__dirname, '/web_client/')
const htmlPath = path.join(webClientPath, 'html/')
const loginPagesPath = path.join(htmlPath, 'LoginPages/')
const botPagesPath = path.join(htmlPath, 'BotPages/')
const jsPath = path.join(webClientPath, 'js/')
const jsLibPath = path.join(jsPath, 'lib/')
const cssPath = path.join(webClientPath, 'css/')
const themePath = path.join(cssPath, 'themes/')
const imgPath = path.join(webClientPath, 'images/')
const pwaPath = path.join(webClientPath, 'PWA/')

const paths = { webClientPath, htmlPath, loginPagesPath, botPagesPath, jsPath, jsLibPath, cssPath, themePath, imgPath, pwaPath }

export { paths }
