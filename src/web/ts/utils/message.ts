import { $, createElement } from './dom'
import { parseMD } from './markdown'
import { NewMessage } from 'types/Commands/NewMessage'

const messages = $('#messages') as HTMLUListElement

function pad (number: number): string {
  if (number < 10) {
    return '0' + number
  }

  return number.toString()
}

function parseDate (timeUUID: string): { date: string, time: string } {
  const date = new Date(timeUUID)

  return {
    date: [date.getDate(), date.getMonth() + 1, date.getFullYear()].join('/'), // 10/06/2019
    time: [pad(date.getHours()), pad(date.getMinutes())].join(':') // 12:34
  }
}

export function createMessage (msg: NewMessage): HTMLLIElement {
  const { uuid, user, message } = msg
  const { time } = parseDate(msg.uuid)

  const wrapper = createElement('li', { class: 'message', id: 'message-' + uuid })

  wrapper.classList.add(msg.user === ''/* TODO: Make username constant */ ? 'myMessage' : 'theirMessage')

  const profileImageElement = createElement('img', { class: 'profileImage', src: 'https://lh3.googleusercontent.com/-HJiG0fMZgSU/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rdSYJuSI-dtLIAOvv4riiYmpnRxKQ/photo.jpg?sz=46' })
  const usernameElement = createElement('b', { class: 'username', style: 'color: #a00' }, user)
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

// export function addMessage (message: string, username: string, mine = false) {
export function addMessage (message: NewMessage) {
  const a = createMessage(message)

  messages.appendChild(a) 
}
