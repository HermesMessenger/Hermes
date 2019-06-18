// This is an old file and should be deleted soon (18/06/2019)

import { reverseStr } from './utils'
require('./markdown/lib')

interface StartEndRegexp {
	r: RegExp,
	textGroup: number,
	startDelimiter: string,
	endDelimiter: string
}

interface MdHtmlRule {
	name: string,
	regexp: StartEndRegexp,
	replacement: string
}

interface HtmlMdRule {

}

interface RuleBook {
	mdHtml: MdHtmlRule[],
	htmlMd: HtmlMdRule[]
}

interface OpenMdHtmlRule {
	start: number,
	rule: MdHtmlRule
}

const RULES: RuleBook = {
	mdHtml: [
		{
			name: 'Bold',
			regexp: { r: /~(.*)~/, textGroup: 1, startDelimiter: '~', endDelimiter: '~' },
			replacement: '<b class="MD-b">$TEXT</b>'
		},
		{
			name: 'Italics',
			regexp: { r: /\*(.*)\*/, textGroup: 1, startDelimiter: '*', endDelimiter: '*' },
			replacement: '<i class="MD-i">$TEXT</i>'
		}
	],
	htmlMd: []
}

function replaceMdWithHTML (md: string, rule: MdHtmlRule): string {
	// Get text group from the string
	let res = md.match(rule.regexp.r)
	if (res) {
		let s = res[rule.regexp.textGroup]
		if (s != null) {
			return rule.replacement.replace('$TEXT', s)
		} else {
			throw new Error('Replace Md with HTML RegEx failed, group not found')
		}
	} else {
		throw new Error('Replace Md with HTML RegEx failed, regex didnt match anything')
	}
}

export function mdToHTML (md: string): string {
	let openRules: OpenMdHtmlRule[] = []
	let lastIdx = 0
	let strToMatch = md
	while (true) {
		let closestMatch: { matchIdx: number, length: number, kind: 'open' | 'close', rule: MdHtmlRule} | null = null
		for (let rule of RULES.mdHtml) {
			if (openRules.length > 0 && rule == openRules[openRules.length - 1].rule) {
				console.log(rule, openRules)
				// Test for end of rule
				let res = strToMatch.indexOf(rule.regexp.endDelimiter)
				// If it finds an end
				if (res > -1) {
					// If there's a closest match and your index is smaller, you're the closest match
					if (closestMatch != null) {
						if (closestMatch.matchIdx > res) {
							closestMatch = { matchIdx: res, length: rule.regexp.endDelimiter.length, kind: 'close', rule }
						}
					} else { // If closestMatch hasn't been set, you're the closest match
						closestMatch = { matchIdx: res, length: rule.regexp.endDelimiter.length, kind: 'close', rule }
					}
				}
			} else {
				// Test for start of rule
				let res = strToMatch.indexOf(rule.regexp.startDelimiter)
				// console.log('Checking for', rule.regexp.startDelimiter, '; result:', res)
				// If it finds a start
				if (res > -1) {
					// console.log(res)
					// If there's a closest match and your index is smaller, you're the closest match
					if (closestMatch != null) {
						// console.log(closestMatch, rule)
						if (closestMatch.matchIdx > res) {
							// console.log('matched')
							closestMatch = { matchIdx: res, length: rule.regexp.startDelimiter.length, kind: 'open', rule }
						}
					} else { // If closestMatch hasn't been set, you're the closest match
						closestMatch = { matchIdx: res, length: rule.regexp.startDelimiter.length, kind: 'open', rule }
					}
				}
			}
		}
		// If there's a closest match
		if (closestMatch !== null) {
			// Set the last index, to keep track of the absolute index on the string
			lastIdx += closestMatch.matchIdx + closestMatch.length
			// Remove the part already parsed
			strToMatch = strToMatch.substring(closestMatch.matchIdx + closestMatch.length)
			// If it's an open match
			if (closestMatch.kind == 'open') {
				// Add an open rule
				openRules.push({ start: lastIdx - closestMatch.length, rule: closestMatch.rule })
				console.log(closestMatch.rule.name, 'opened')
			} else {
				// Remove the last open rule (the one we're closing)
				let r = openRules.pop()
				if (r) {
					console.log(r.rule.name, 'closed')
					// Get the string of the match
					let foundStr = md.substring(r.start, lastIdx)
					let replacedStr = replaceMdWithHTML(foundStr, closestMatch.rule)
					let fPart = md.substring(0, lastIdx - foundStr.length)
					let sPart = md.substring(lastIdx)
					console.log(fPart + foundStr + sPart)
					console.log(fPart + replacedStr + sPart)
					lastIdx += replacedStr.length - foundStr.length
					md = fPart + replacedStr + sPart
					// console.log(foundStr)
					// console.log(replacedStr)
				}
			}
			console.log(openRules)
		} else {
			break
		}
		// break
	}
	return md
}
