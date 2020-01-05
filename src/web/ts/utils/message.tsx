import JSX from 'jsxlite'
import { $ } from 'ts/utils/dom'
import { parseMD } from 'ts/utils/markdown'
import { Message } from 'types/Message'
import { username as myUsername } from 'ts/utils/constants'
import { getSettings, loadSettings } from 'ts/utils/userSettings'

const $messages = $('#messages') as HTMLUListElement
let lastDate = ''

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

const DEFAULT_SETTINGS = {
  color: '#a00',
  image: 'https://lh3.googleusercontent.com/-HJiG0fMZgSU/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rdSYJuSI-dtLIAOvv4riiYmpnRxKQ/photo.jpg?sz=46'
}

export function createMessage (msg: Message): HTMLElement {
  const { uuid, username, message } = msg
  const { time } = parseDate(msg.uuid)

  let { color, image } = DEFAULT_SETTINGS
  const userSettings = getSettings(username)
  let settingsPending = false

  if (userSettings) {
    color = userSettings.color
    image = userSettings.image
  } else {
    loadSettings(username)
    settingsPending = true
  }

  return (
    <li id={`message-${uuid}`} class={username === myUsername ? 'message myMessage' : 'message theirMessage'} data-settings-pending={settingsPending ? username : null}>
      <img class="profileImage" src={image} />
      <b class="username" style={`color: ${color}`}>{username}</b>
      <span class="message_body" innerHTML={parseMD(message)}></span>
      <span class="time">{time}</span>
    </li>
  )
}

function createDateMessage (date: string): HTMLElement {
  return (
    <li id={`date-${date}`} class="date">
      {date}
    </li>
  )
}

export function addMessage (message: Message): void {
  const { date } = parseDate(message.uuid)

  if (lastDate !== date) {
    $messages.appendChild(createDateMessage(date))
  }

  $messages.appendChild(createMessage(message))

  lastDate = date
}

// Delete loaded messages so they don't get duplicated
export function clearMessages (): void {
  while ($messages.firstChild) $messages.firstChild.remove()
  lastDate = ''
}
