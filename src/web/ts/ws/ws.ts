import { getCookie } from '../utils/dom'
import { Command, Commands, UnknownCommand } from 'types/Command'

class WS {
  ws: WebSocket

  constructor (url?: string) {
    url = url || 'ws://' + document.location.host
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      const cmd = Command('HANDSHAKE', { uuid: getCookie('UUID') })

      this.ws.send(JSON.stringify(cmd))
    }
  }

  send<K extends keyof Commands> (header: K, data: Commands[K]): void {
    const cmd = Command(header, data)

    this.ws.send(JSON.stringify(cmd))
  }

  onMessage (callback: (message: UnknownCommand) => void): void {
    this.ws.onmessage = msg => {
      const message = JSON.parse(msg.data)

      if ('header' in message) {
        callback(message)
      } else {
        this.send('RESPONSE', { originalCommand: null, error: 'Bad request' })
      }
    }
  }
}

const ws = new WS()

export { ws }
