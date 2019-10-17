import { Message } from './Message'

export interface NewMessage extends Message {
  username: string;
  uuid: string;
}
