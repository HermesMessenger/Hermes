import { last } from './utils/dom'
import { Command } from './utils/Command'

console.log(last(['dsadsa', 'dasdasdasda']))

const cmd1 = Command('AUTH', { uuid: '1234' })
const cmd2 = Command('NEW_MESSAGE', { message: 'Hello there' })

console.log(last([cmd1, cmd2]))
