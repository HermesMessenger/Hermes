/*
 * ################### src/web/ts/markdown/lib.ts ###################
 *
 * This file contains all the functions to parse markdown and convert it to a tree,
 * as well as for parsing JSON as a tree
 *
 * ##################################################################
 * File created by ThePerkinrex on 18/06/2019 for Hermes Messenger
 * Last edited on 18/06/2019
 * ##################################################################
 */

import * as MDTypes from './interfaces'

let hello = MDTypes.createMDText('Hello')
let notbold = MDTypes.createMDText(' not bold')
let bold = MDTypes.createMDBold([hello])
let body = MDTypes.createMDBody([bold, notbold])

console.log(body.toHTML())
console.log(body.toMD())
console.log(JSON.stringify(body))
