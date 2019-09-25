interface newMessage {

}

export interface CommandTypes {
  'AUTH': number,
  'NEW_MESSAGE': newMessage
}

interface Command<K extends keyof CommandTypes> {
  header: K,
  data: CommandTypes[K]
}

export default function createCommand<K extends keyof CommandTypes>(header: K, data: CommandTypes[K]): Command<K> {
  return { header, data }
}

const a = createCommand('AUTH', 1234)


