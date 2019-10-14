import WebSocket from 'ws'

interface Channel {
  [uuid: string]: WebSocket
}

export interface Connections {
    [channel: string]: Channel
}
