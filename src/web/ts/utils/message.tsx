import JSX from 'jsxlite'
import { $ } from 'ts/utils/dom'
import { parseMD } from 'ts/utils/markdown'
import { Message } from 'types/Message'
import { username as myUsername } from 'ts/utils/constants'
import { getData } from './request'

const messages = $('#messages') as HTMLUListElement
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

const DEFAULT_IMAGE = 'https://lh3.googleusercontent.com/-HJiG0fMZgSU/AAAAAAAAAAI/AAAAAAAAAAA/ACHi3rdSYJuSI-dtLIAOvv4riiYmpnRxKQ/photo.jpg?sz=46'
const users: {
  [username: string]: {
    color: string,
    image: string
  }
} = {}

export async function createMessage (msg: Message): Promise<HTMLElement> {
  const { uuid, username, message } = msg
  const { time } = parseDate(msg.uuid)

  let color = '#a00'
  let image = DEFAULT_IMAGE
  if(username in users) {
    color = users[username].color
    image = users[username].image
    console.log('exists')
  }else{
    // TODO: this executes all the time on first load because we dont wait to load the next message after this one has loaded
    // TODO: That might have adverse effects on message order
    let data = await getData(`/api/getSettings/${username}`) as {color: string, image: string}
    color = data.color
    image = `data:image/png;base64,${data.image}`
    users[username] = {color, image}
    console.log('!exists')
  }

  return (
    <li id={`message-${uuid}`} class={username === myUsername ? 'message myMessage' : 'message theirMessage'}>
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
    messages.appendChild(createDateMessage(date))
  }
  

  createMessage(message).then(element => {
    messages.appendChild(element)
  })

  lastDate = date
}

// Delete loaded messages so they don't get duplicated
export function clearMessages (): void {
  const $messages = $('#messages') as HTMLUListElement
  while ($messages.firstChild) $messages.firstChild.remove()
  lastDate = ''
}
