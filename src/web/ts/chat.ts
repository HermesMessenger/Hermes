import { addMessage } from './utils/message'
import { $, fadeIn, fadeOut } from './utils/dom'
import { isAtBottom, scrollToBottom } from './utils/ui'

import './ws'

const username = ($('#user') as HTMLParagraphElement).innerText
const $m = $('#m') as HTMLTextAreaElement

// Update height on input
$m.oninput = e => {
	$m.style.height = 'inherit'
  $m.style.height = $m.scrollHeight + 1 + 'px'
}

// Send message on Ctrl + Enter
$m.onkeydown = e => {
  if ((e.ctrlKey || e.metaKey) && (e.keyCode == 13 || e.keyCode == 10)) {
    const message = $m.value
    const scroll = isAtBottom()

    addMessage(message, username, true)
    $m.value = ''
    
    $m.dispatchEvent(new Event('input')) // Emit input event to reset input height

    if (scroll) {
      scrollToBottom()
    }
  }
}


const $sidebar = $('#sidebar') as HTMLDivElement
const $sidebarbtn = $('#sidebarbtn') as HTMLDivElement
const $darkoverlay = $('#darkoverlay') as HTMLDivElement

$sidebarbtn.onclick = e => {
  fadeIn($darkoverlay)
  $sidebar.style.left = '0px'
}

$darkoverlay.onclick = e => {
  fadeOut($darkoverlay)
  $sidebar.style.left = '-400px'
}

(window as any).addMessage = addMessage

addMessage('hi there 1', 'spaceface777')
addMessage('hi there 2', 'spaceface777')
addMessage('hi there 3', username, true)
addMessage('hi there 4', username, true)
addMessage('hi there 5', 'spaceface777')
addMessage('hi there 5', 'SomeOtherUser')
addMessage('THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE THIS IS A VERY LONG MESSAGE ', 'SomeOtherUser')
addMessage('*this* is a **great** website ![StackOverflow](https://upload.wikimedia.org/wikipedia/commons/f/f7/Stack_Overflow_logo.png)', username, true)


scrollToBottom()
