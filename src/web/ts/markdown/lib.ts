/*
 * ################### src/web/ts/markdown/lib.ts ###################
 *
 * This file contains all the functions to parse markdown and convert it to a tree,
 * as well as for parsing JSON as a tree
 *
 * ##################################################################
 * File created by ThePerkinrex on 18/06/2019 for Hermes Messenger
 * Last edited on 12/09/2019
 * ##################################################################
 */

// ! Still W.I.P !

import * as MDTypes from './interfaces'
import { last } from '../utils'

/*
DA RULES:
**: italics
*: bold
`: code
![url]: image
*/

enum STATES {
	BOLD_OR_NOT,
	IMG_OR_NOT,
	READING,
	ENDING_NO_MD
}

interface StackItem {
	end: string,
	start: string,
	pos: number,
	creatorFn: Function,
	children: Array<MDTypes.MDNode>
}

function stackItem (pos: number, creatorFn: Function, end: string, start: string | undefined = undefined): StackItem {
	return { end, start: start || end, pos, creatorFn, children: [] }
}

export function parseMD (md: string): MDTypes.MDElement {
	let state = STATES.READING // Current state of tokenizer
	let stack: Array<StackItem> = [stackItem(0, () => {}, '\0')] // Stack of open things

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

				stack.push(stackItem(idx, MDTypes.createMDCode, '`'))
				currentToken = ''
			} else if (chr == '!') {
				last(stack).children.push(MDTypes.createMDText(currentToken)) // Finish the current token run and push it as text
				currentToken = ''

				state = STATES.IMG_OR_NOT
			} else {
				currentToken += chr
			}
		} else if (state == STATES.BOLD_OR_NOT) {
			state = STATES.READING
			if (chr == '*') {
				if (last(stack).end == '**') {
					let item = stack.pop()!
					last(stack).children.push(item.creatorFn(item.children))
				} else {
					stack.push(stackItem(idx, MDTypes.createMDItalics, '**'))
				}
			} else {
				if (last(stack).end == '*') {
					let item = stack.pop()!
					last(stack).children.push(item.creatorFn(item.children))
				} else {
					stack.push(stackItem(idx - 1, MDTypes.createMDBold, '*'))
				}
				currentToken += chr
			}
		} else if (state == STATES.IMG_OR_NOT) {
			state = STATES.ENDING_NO_MD
			if (chr == '[') {
				stack.push(stackItem(idx, MDTypes.createMDImage, ']', '!['))
			} else {
				currentToken += '!' + chr
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
	if (state == STATES.BOLD_OR_NOT) {
		if (last(stack).end == '*') {
			let item = stack.pop()!
			last(stack).children.push(item.creatorFn(item.children))
		} else {
			stack.push(stackItem(idx - 1, MDTypes.createMDBold, '*'))
		}
	}
	for (let i = stack.length - 1; i > 0; i--) { // Push everything that isn't completed down the stack with its children and a text of it's start
		let item = stack.pop()!
		console.log('current',i, item, [ MDTypes.createMDText(item.start), ...item.children ])
		// last(stack).children.concat([ MDTypes.createMDText(item.start), ...item.children ])
		last(stack).children.push(MDTypes.createMDText(item.start), ...item.children)
		console.log('next children',last(stack).children)
	}
	console.log('stack',stack)
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
