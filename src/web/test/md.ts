import { parseMD } from '../ts/markdown/lib'

$('#md-in').on('input', () => {
	let res = parseMD($('#md-in').val() as string)
	$('#html-code').text(res)
	$('#html-out').html(res)
})
