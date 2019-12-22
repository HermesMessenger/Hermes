import { $, fadeIn, fadeOut } from 'utils/dom'
import { uuid } from 'utils/constants'
import { postData } from 'utils/request'

const $settingsbutton = $('#settings') as HTMLButtonElement
const $closesettings = $('#closeSettings') as HTMLButtonElement
const $settings = $('#settings_modal') as HTMLDivElement

async function loadSettings (): Promise<void> {
  const data = await postData('/api/getSettings', { uuid }) as any
  const $img = $('#profilePicture') as HTMLImageElement
  $img.src = `data:image/png;base64,${data.image}`
  console.log(data)
}

$settingsbutton.onclick = () => {
  loadSettings().then(() => fadeIn($settings))
}

$closesettings.onclick = () => {
  fadeOut($settings)
}
