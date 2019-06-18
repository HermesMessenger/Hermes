import path from 'path'

const webPath = path.join(__dirname, '../web/')

const paths = {
	webPath: webPath,
	chatPath: path.join(webPath, 'chat/'),
	loginPath: path.join(webPath, 'login/'),
	themePath: path.join(webPath, 'themes/'),
	settingPath: path.join(webPath, 'settings/'),
	imgPath: path.join(webPath, 'images/'),
	PWAPath: path.join(webPath, 'PWA/')
}

export { paths }
