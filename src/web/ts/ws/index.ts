import { ws } from './ws'
import { addMessage } from 'utils/message'
import { isAtBottom, scrollToBottom } from 'utils/ui'

(window as any).ws = ws // TODO!: REMOVE

ws.onMessage(message => {
  console.log(message)

  switch (message.header) {
    case 'RESPONSE': {
      break
    } case 'NEW_MESSAGE': {
      const scroll = isAtBottom()

      addMessage(message.data)

      if (scroll) {
        scrollToBottom()
      }
      break
    } default: {
      ws.send('RESPONSE', { originalCommand: message.header, error: 'Not implemented.' })
    }
  }
})
