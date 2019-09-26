import { last } from './utils/dom'
import Command from 'types/Command'

console.log(last(['dsadsa', 'dasdasdasda']))

console.log(last([Command('AUTH', 124), Command('NEW_MESSAGE', { a: 1 })]))