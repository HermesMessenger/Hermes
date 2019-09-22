import { Renderer, Slugger } from 'marked'

const ALLOWED_SCHEMES_FWDSLASH = ['http', 'https'] // schemes with :// (http://google.com)

const SCHEME_REGEX = `(?:${ALLOWED_SCHEMES_FWDSLASH.join('|')}):\\/\\/`
const URL_REGEX = new RegExp(`^(?:${SCHEME_REGEX})?[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&'\\(\\)\\*\\+,;=.]+$`)

function validUrl (url: string): boolean {
	return URL_REGEX.test(url)
}

export default class HermesRenderer extends Renderer {
	image (href: string, title: string, text: string): string {
		// ? sanitize image urls
		return super.image(href, title, text)
	}

	link (href: string, title: string, text: string): string {
		if (validUrl(href)) {
			// if its valid return the html
			let link = super.link(href, title, text)
			return link
		} else {
			// if it isnt, return what was entered
			if (href == text) {
				return href
			} else {
				return `[${text}](${href})`
			}
		}
	}

	heading (text: string, level: number, raw: string, slugger: Slugger): string {
		let hashes = ''
		for (let i = 0; i < level; i++) {
			hashes += '#'
		}
		return this.text(`${hashes} ${text}`) // leave it as it is (markdown)
	}

	text (text: string): string {
		return text
	}
}
