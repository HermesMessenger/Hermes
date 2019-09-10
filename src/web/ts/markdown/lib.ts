/*
 * ################### src/web/ts/markdown/lib.ts ###################
 *
 * This file contains all the functions to parse markdown and convert it to a tree,
 * as well as for parsing JSON as a tree
 *
 * ##################################################################
 * File created by ThePerkinrex on 18/06/2019 for Hermes Messenger
 * Last edited on 09/09/2019
 * ##################################################################
 */

import * as MDTypes from './interfaces'
import { last } from '../utils'

/*
DA RULES:
**: italics
*: bold
`: code

*/

enum STATES {
	BOLD_OR_NOT,
	READING,
	ENDING_NO_MD
}

interface StackItem {
	end: string,
	start: number,
	creatorFn: Function,
	children: Array<MDTypes.MDNode>
}

export function parseMD (md: string): MDTypes.MDElement {
	let state = STATES.READING // Current state of tokenizer
	let stack: Array<StackItem> = [{ end: '\0', start: 0, creatorFn: () => {}, children: [] }] // Stack of open things

	let idx = 0
	let currentToken = ''
	for (let chr of md) {
		if (state == STATES.READING) {
			if (chr == '*') {
				last(stack).children.push(MDTypes.createMDText(currentToken)) // Finish the current token run and push it as text
				currentToken = ''

				state = STATES.BOLD_OR_NOT
			} else if (chr == '`') {
				state = STATES.ENDING_NO_MD

				last(stack).children.push(MDTypes.createMDText(currentToken)) // Finish the current token run and push it as text

				stack.push({ end: '`', start: idx, creatorFn: MDTypes.createMDCode, children: [] })
				currentToken = ''

			} else {
				currentToken += chr
			}
		} else if (state == STATES.BOLD_OR_NOT) {
			if (chr == '*') {
				state = STATES.READING

				stack.push({ end: '**', start: idx, creatorFn: MDTypes.createMDItalics, children: [] })
			} else {
				stack.push({ end: '*', start: idx - 1, creatorFn: MDTypes.createMDBold, children: [] })
				currentToken += chr
			}
		} else if (state == STATES.ENDING_NO_MD) {
			if (chr == last(stack).end) {
				let node = (stack.pop()!/* error if its undefined */).creatorFn(currentToken)
				last(stack).children.push(node)
				currentToken = ''
				state = STATES.READING
			} else {
				currentToken += chr
			}
		}
		idx++
	}
	stack[0].children.push(MDTypes.createMDText(currentToken))
	return MDTypes.createMDBody(stack[0].children)
}

/*let hello = MDTypes.createMDText('Hello')
let notbold = MDTypes.createMDText(' not bold')
let bold = MDTypes.createMDBold([hello])
let body = MDTypes.createMDBody([bold, notbold])

console.log(body.toHTML())
console.log(body.toMD())
console.log(JSON.stringify(body))*/
