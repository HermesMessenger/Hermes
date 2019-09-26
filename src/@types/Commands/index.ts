import { NewMessage } from './NewMessage'
import { Response } from './Response'
import { SendMessage } from './SendMessage'
import { Auth } from './Auth'

export default interface Commands {
  'AUTH': Auth;
  'NEW_MESSAGE': NewMessage;
  'SEND_MESSAGE': SendMessage;
  'RESPONSE': Response;
}
