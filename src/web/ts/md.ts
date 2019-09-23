import { parseMD } from './utils/markdown'
import { $ } from './utils/dom'

const input = $('#md-in') as HTMLTextAreaElement
const output = $('#html-code') as HTMLDivElement
const html = $('#html-out') as HTMLDivElement

input.oninput = () => {
  const parsed = parseMD(input.value)

  output.innerText = parsed
  html.innerHTML = parsed
}
