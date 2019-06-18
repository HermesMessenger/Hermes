import { greet } from '../ts/utils'
import * as mdlib from '../ts/markdown'

require('../ts/lib/jscolor.js')

let ws = new WebSocket('ws://' + window.location.host)
ws.onmessage = data => {
	console.log(data)
	ws.send('HELLO')
}

console.log('HOLA JQUERY')
$('b').text('JQUERY')
console.log('ewhbuydjfgsidfyukstrg3ileazt9pabfs')
greet('Webpack + TS')

$('#mdToHTML').on('input', () => {
	$('#mdToHTML_out').html(mdlib.mdToHTML($('#mdToHTML').val() as string))
})
