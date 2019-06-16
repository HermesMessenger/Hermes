import { greet } from './utils'
require('./jscolor.js')

let ws = new WebSocket('ws://' + window.location.host)
ws.onmessage = data => {
  console.log(data)
  ws.send('HELLO')
}

console.log('HOLA JQUERY')
$('b').text('JQUERY')
console.log('ewhbuydjfgsidfyukstrg3ileazt9pabfs')
greet('Webpack + TS')
