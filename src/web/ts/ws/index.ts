import { ws } from "./ws"
import { addMessage } from "utils/message"

(window as any).ws = ws //TODO!: REMOVE

ws.onMessage(message => {
  console.log(message)

  switch (message.header) {
    case 'RESPONSE': {
      break
    } case 'NEW_MESSAGE': {
      const mine = message.data.user === ''

      addMessage(message.data)
      break
    } default: {
      ws.send('RESPONSE', { originalCommand: message.header, error: 'Not implemented.' })
    }
  }
})
