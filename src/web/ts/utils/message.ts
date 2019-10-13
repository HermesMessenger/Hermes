import { $, createElement } from './dom'
import { parseMD } from './markdown'

const messages = $('#messages') as HTMLUListElement

interface Message {
  uuid: string;
  username: string;
  message: string;
  time: number;
}

function pad (number: number): string {
  if (number < 10) {
    return '0' + number
  }

  return number.toString()
}

function formatDate (time: number): { date: string, time: string } {
  const date = new Date(time)

  return {
    date: [date.getDate(), date.getMonth() + 1, date.getFullYear()].join('/'), // 10/06/2019
    time: [pad(date.getHours()), pad(date.getMinutes())].join(':') // 12:34
  }
}

export function createMessage (msg: Message, myMessage = false): HTMLLIElement {
  const { uuid, username, message } = msg
  const { time } = formatDate(msg.time)

  const wrapper = createElement('li', { class: 'message', id: 'message-' + uuid })

  wrapper.classList.add(myMessage ? 'myMessage' : 'theirMessage')

  const profileImageElement = createElement('img', { class: 'profileImage', src: 'https://lh3.googleusercontent.com/-HJiG0fMZgSU/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rdSYJuSI-dtLIAOvv4riiYmpnRxKQ/photo.jpg?sz=46' })
  const usernameElement = createElement('b', { class: 'username', style: 'color: #a00' }, username)
  const timeElement = createElement('span', { class: 'time' }, time)
  const messageElement = createElement('span', { class: 'message_body' })
  messageElement.innerHTML = parseMD(message)

  messageElement.attributes

  messageElement.prepend(usernameElement)

  wrapper.appendChild(profileImageElement)
  //wrapper.appendChild(usernameElement)
  wrapper.appendChild(messageElement)
  wrapper.appendChild(timeElement)

  return wrapper
}

export function addMessage (message: string, username: string, mine = false) {
  const a = createMessage({ message, username, uuid: 'qweqewqeq', time: new Date().getTime() }, mine)

  messages.appendChild(a)
}
