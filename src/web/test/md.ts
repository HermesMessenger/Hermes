import { parseMD } from '../ts/markdown/lib'

$('#md-in').on('input', () => {
	let tree = parseMD($('#md-in').val() as string)
	$('#md-code').text(tree.toMD())
	$('#html-code').text(tree.toHTML())
	$('#html-out').html(tree.toHTML())
})
