import { getCookie } from './utils/dom'
import { Command } from './utils/Command'

const cmd1 = Command('HANDSHAKE', { uuid: getCookie('UUID') })
const cmd2 = Command('NEW_MESSAGE', { message: 'Hello there' })

console.log(cmd1, cmd2)
