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
  BODY,
  IMAGE
}

export interface MDNode {
  kind: MDKind;
  text?: string;
  toMD: () => string;
  toHTML: () => string;
}

export interface MDElement extends MDNode {
  children: MDNode[];
}

export interface MDImage extends MDNode {
  url: string;
}

export function sanitize (str: string): string {
  return str
    .replace('<', '&lt;')
    .replace('>', '&gt;')
    .replace('&', '&amp;')
    .replace('"', '&quot;')
}

export function createMDImage (url: string): MDImage {
  url = sanitize(url)
  return {
    kind: MDKind.IMAGE,
    url,
    toMD: () => `![${url}]`,
    toHTML: () => `<img class="MDImage" src="${url}">`
  }
}

export function createMDText (contents: string): MDNode {
  contents = sanitize(contents)
  return {
    kind: MDKind.TEXT,
    text: contents,
    toMD: () => contents,
    toHTML: () => contents
  }
}

export function createMDCode (contents: string): MDNode {
  contents = sanitize(contents)
  return {
    kind: MDKind.CODE,
    text: contents,
    toMD: () => `\`${contents}\``,
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
      for (const child of children) {
        r += child.toMD()
      }
      return '**' + r + '**'
    },
    toHTML: () => {
      let r = ''
      for (const child of children) {
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
      for (const child of children) {
        r += child.toMD()
      }
      return '*' + r + '*'
    },
    toHTML: () => {
      let r = ''
      for (const child of children) {
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
      for (const child of children) {
        r += child.toMD()
      }
      return '-' + r + '-'
    },
    toHTML: () => {
      let r = ''
      for (const child of children) {
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
      for (const child of children) {
        r += child.toMD()
      }
      return r
    },
    toHTML: () => {
      let r = ''
      for (const child of children) {
        r += child.toHTML()
      }
      return '<div class="MDBody">' + r + '</div>'
    },
    children
  }
}
