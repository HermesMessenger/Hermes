import fs from 'fs'
import path from 'path'

const DIR = process.env.dirname || __dirname

const webPath = path.join(DIR, '../web/')
const htmlPath = path.join(webPath, 'html/')

export const paths = {
  webPath,
  htmlPath,
  cssPath: path.join(webPath, 'css/'),
  jsPath: path.join(webPath, 'js/'),
  templatePath: path.join(webPath, 'templates/'),
  themePath: path.join(webPath, 'themes/'),
  imgPath: path.join(webPath, 'images/'),
  PWAPath: path.join(webPath, 'PWA/')
}

export const themes = fs.readdirSync(paths.themePath)
