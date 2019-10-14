import { Message } from './Message'

export interface NewMessage extends Message {
  user: string;
  uuid: string;
}
