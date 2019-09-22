import * as Marked from 'marked'
import HermesRenderer from './renderer'
import { highlight } from 'highlightjs'

Marked.setOptions({
	renderer: new HermesRenderer(),
	sanitize: false, // deprecated, using custom
	breaks: true,
	highlight: (code, lang) => highlight(lang, code).value
	// sanitizer: DOMPurify.sanitize // this sanitizer
})
/* DOMPurify.setConfig({
	SAFE_FOR_JQUERY: true,
	ADD_TAGS: ['img']
}) */

function sanitize (s: string): string {
	return s.replace(/>/g, '&gt;')
			.replace(/</g, '&lt;')
}

export function parseMD (md: string): string {
	let res = md
	try {
		// res = Marked.parse(sanitize(md))
		res = Marked.parse(sanitize(md))
	} catch (e) {
		console.log(e)
	}
	return res
}
