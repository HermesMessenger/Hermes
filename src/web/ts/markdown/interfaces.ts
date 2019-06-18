/*
 * ################ src/web/ts/markdown/interfaces.ts ################
 *
 * This file contains all the interfaces & methods necesaries to create a tree defining a Markdown-ish text
 * It also has methods to create a MD or HTML text from that tree
 *
 * ###################################################################
 * File created by ThePerkinrex on 18/06/2019 for Hermes Messenger
 * Last edited on 18/06/2019
 * ###################################################################
 */

enum MDKind {
	TEXT,
	CODE,
	BOLD,
	ITALICS,
	STRIKE,
	BODY
}

interface MDNode {
	kind: MDKind,
	text?: string
	toMD: () => string,
	toHTML: () => string
}

interface MDElement extends MDNode {
	children: MDNode[]
}

export function createMDText (contents: string): MDNode {
	contents = contents.replace('<', '&lt;').replace('>', '&gt;')
	return {
		kind: MDKind.TEXT,
		text: contents,
		toMD: () => {
			return contents
		},
		toHTML: () => {
			return contents
		}
	}
}

export function createMDCode (contents: string): MDNode {
	contents = contents.replace('<', '&lt;').replace('>', '&gt;')
	return {
		kind: MDKind.CODE,
		text: contents,
		toMD: () => {
			return '`' + contents + '`'
		},
		toHTML: () => {
			return '<a class="MDCode">' + contents + '</a>'
		}
	}
}

export function createMDBold (children: MDNode[]): MDElement {
	return {
		kind: MDKind.BOLD,
		toMD: () => {
			let r = ''
			for (let child of children) {
				r += child.toMD()
			}
			return '~' + r + '~'
		},
		toHTML: () => {
			let r = ''
			for (let child of children) {
				r += child.toHTML()
			}
			return '<b class="MDBold">' + r + '</b>'
		},
		children
	}
}

export function createMDItalics (children: MDNode[]): MDElement {
	return {
		kind: MDKind.ITALICS,
		toMD: () => {
			let r = ''
			for (let child of children) {
				r += child.toMD()
			}
			return '*' + r + '*'
		},
		toHTML: () => {
			let r = ''
			for (let child of children) {
				r += child.toHTML()
			}
			return '<i class="MDItalics">' + r + '</i>'
		},
		children
	}
}

export function createMDStrike (children: MDNode[]): MDElement {
	return {
		kind: MDKind.STRIKE,
		toMD: () => {
			let r = ''
			for (let child of children) {
				r += child.toMD()
			}
			return '-' + r + '-'
		},
		toHTML: () => {
			let r = ''
			for (let child of children) {
				r += child.toHTML()
			}
			return '<strike class="MDStrike">' + r + '</strike>'
		},
		children
	}
}

export function createMDBody (children: MDNode[]): MDElement {
	return {
		kind: MDKind.BODY,
		toMD: () => {
			let r = ''
			for (let child of children) {
				r += child.toMD()
			}
			return r
		},
		toHTML: () => {
			let r = ''
			for (let child of children) {
				r += child.toHTML()
			}
			return '<div class="MDBody">' + r + '</div>'
		},
		children
	}
}
