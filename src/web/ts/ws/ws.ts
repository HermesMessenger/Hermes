import RWebSocket from 'reconnecting-websocket'
import { getCookie } from '../utils/dom'
import { Command, Commands, AnyCommand } from 'types/Command'

class WS {
  ws: RWebSocket

  constructor (url?: string) {
    url = url || 'ws://' + document.location.host
    this.ws = new RWebSocket(url)

    this.ws.onopen = () => {
      const cmd = Command('HANDSHAKE', { uuid: getCookie('UUID') })

      this.ws.send(JSON.stringify(cmd))
    }
  }

  send<K extends keyof Commands> (header: K, data: Commands[K]): void {
    const cmd = Command(header, data)

    this.ws.send(JSON.stringify(cmd))
  }

  onMessage (callback: (message: AnyCommand) => void): void {
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
