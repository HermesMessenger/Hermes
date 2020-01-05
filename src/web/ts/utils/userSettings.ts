import { getData } from './request'

export function b64Image (img: string): string {
  return `data:image/png;base64,${img}`
}

interface Settings {
  color: string;
  image: string;
}

const users: {
  [user: string]: Settings;
} = {}

const pendingRequests: string[] = []

export function getSettings (user: string): Settings | undefined {
  return users[user]
}

export async function loadSettings (user: string): Promise<void> {
  if (!pendingRequests.includes(user)) {
    pendingRequests.push(user)
    const settings = await getData(`/api/getSettings/${user}`) as Settings

    document.querySelectorAll(`[data-settings-pending="${user}"]`).forEach(elem => {
      elem.removeAttribute('data-settings-pending')

      const $image = elem.getElementsByClassName('profileImage')[0] as HTMLImageElement
      const $name = elem.getElementsByClassName('username')[0] as HTMLParagraphElement

      $image.src = b64Image(settings.image)
      $name.style.color = settings.color
    })

    users[user] = {
      color: settings.color,
      image: b64Image(settings.image)
    }
  }
}
