import { addMessage } from 'utils/message'
import { $, fadeIn, fadeOut } from 'utils/dom'
import { scrollToBottom } from 'utils/ui'
import { activeChannel, uuid } from 'utils/constants'

import { postData } from 'utils/request'

import './ws'
import { ws } from './ws/ws'
import { Message } from 'types/Message'

const $m = $('#m') as HTMLTextAreaElement

// Update height on input
$m.oninput = () => {
  $m.style.height = 'inherit'

  // Firefox hack to calculate scrollHeight correctly
  $m.style.overflow = 'scroll'
  const scrollHeight = $m.scrollHeight
  $m.style.overflow = 'auto'

  $m.style.height = scrollHeight + 'px'
}

// Send message on Ctrl + Enter
$m.onkeydown = e => {
  if ((e.ctrlKey || e.metaKey) && (e.keyCode === 13 || e.keyCode === 10)) {
    const message = $m.value

    if (!message.match(/^\s*$/)) {
      ws.send('SEND_MESSAGE', { message, channel: activeChannel })

      $m.value = ''

      $m.dispatchEvent(new Event('input')) // Emit input event to reset input height
    }
  }
}

const $sidebar = $('#sidebar') as HTMLDivElement
const $sidebarbtn = $('#sidebarbtn') as HTMLDivElement
const $darkoverlay = $('#darkoverlay') as HTMLDivElement

$sidebarbtn.onclick = () => {
  fadeIn($darkoverlay)
  $sidebar.style.left = '0px'
}

$darkoverlay.onclick = () => {
  fadeOut($darkoverlay)
  $sidebar.style.left = '-400px'
}

(window as any).addMessage = addMessage

postData('/api/loadmessages', { uuid, channel: activeChannel }).then(res => {
  const messages = res as Message[]
  for (const message of messages) {
    addMessage(message)
  }

  fadeOut($('#loading') as HTMLDivElement)
  scrollToBottom()
})
