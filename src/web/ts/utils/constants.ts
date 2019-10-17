import { $, getCookie } from 'utils/dom'

export const uuid = getCookie('UUID')
export const username = ($('#user') as HTMLParagraphElement).innerText
export const activeChannel = '13814000-1dd2-11b2-8080-808080808080' // Global channel UUID
