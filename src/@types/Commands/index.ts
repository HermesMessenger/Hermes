import { NewMessage } from './NewMessage'
import { Response } from './Response'
import { SendMessage } from './SendMessage'
import { Handshake } from './Handshake'

export default interface Commands {
  'HANDSHAKE': Handshake;
  'NEW_MESSAGE': NewMessage;
  'SEND_MESSAGE': SendMessage;
  'RESPONSE': Response;
}
