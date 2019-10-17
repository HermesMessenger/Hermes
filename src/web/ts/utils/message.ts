import { $, createElement } from './dom'
import { parseMD } from './markdown'
import { Message } from 'types/Message'
import { username as myUsername } from './constants'

const messages = $('#messages') as HTMLUListElement

function pad (number: number): string {
  return (number < 10 ? '0' : '') + number
}

function UuidToTimestamp (uuid: string): Date {
  const split = uuid.split('-')
  const time = [
    split[2].substring(1),
    split[1],
    split[0]
  ].join('')

  const date = Math.floor((parseInt(time, 16) - 122192928000000000) / 10000)
  return new Date(date)
}

interface ParsedDate {
  date: string;
  time: string;
}

function parseDate (timeUUID: string): ParsedDate {
  const date = UuidToTimestamp(timeUUID)

  return {
    date: [date.getDate(), date.getMonth() + 1, date.getFullYear()].join('/'), // 10/06/2019
    time: [pad(date.getHours()), pad(date.getMinutes())].join(':') // 12:34
  }
}

export function createMessage (msg: Message): HTMLLIElement {
  const { uuid, username, message } = msg
  const { time } = parseDate(msg.uuid)

  const wrapper = createElement('li', { class: 'message', id: 'message-' + uuid })

  wrapper.classList.add(username === myUsername ? 'myMessage' : 'theirMessage')

  const profileImageElement = createElement('img', { class: 'profileImage', src: 'https://lh3.googleusercontent.com/-HJiG0fMZgSU/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rdSYJuSI-dtLIAOvv4riiYmpnRxKQ/photo.jpg?sz=46' })
  const usernameElement = createElement('b', { class: 'username', style: 'color: #a00' }, username)
  const timeElement = createElement('span', { class: 'time' }, time)
  const messageElement = createElement('span', { class: 'message_body' })
  messageElement.innerHTML = parseMD(message)

  messageElement.prepend(usernameElement)
  wrapper.appendChild(profileImageElement)
  wrapper.appendChild(messageElement)
  wrapper.appendChild(timeElement)

  return wrapper
}

export function addMessage (message: Message): void {
  const a = createMessage(message)

  messages.appendChild(a)
}
