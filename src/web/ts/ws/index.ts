import { ws } from "./ws"

(window as any).ws = ws

ws.onMessage(message => {
  console.log(message)

  switch (message.header) {
    case 'RESPONSE': {
      break
    } default: {
      ws.send('RESPONSE', { originalCommand: message.header, error: 'Not implemented.' })
    }
  }
})
