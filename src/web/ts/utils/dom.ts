export function $ (selector: string): HTMLElement | null {
  return document.querySelector(selector)
}

export function createElement<K extends keyof HTMLElementTagNameMap> (name: K, attrs: { [attr: string]: string } = {}, innerText = ''): HTMLElementTagNameMap[K] {
  const element = document.createElement(name)

  element.innerText = innerText

  for (const [attr, value] of Object.entries(attrs)) {
    element.setAttribute(attr, value)
  }

  return element
}

export function fadeOut (element: HTMLElement, callback?: () => void): void {
  const duration = parseFloat(getComputedStyle(element).transitionDuration) * 1000

  element.style.opacity = '0'
  setTimeout(() => {
    element.style.display = 'none'
    callback && callback()
  }, duration)
}

export function fadeIn (element: HTMLElement, callback?: () => void): void {
  const duration = parseFloat(getComputedStyle(element).transitionDuration) * 1000

  element.style.display = 'block'

  setTimeout(() => (element.style.opacity = '1'), 25)

  setTimeout(() => {
    callback && callback()
  }, duration)
}

export function isEmpty (str: string): boolean {
  return /^\s*$/.test(str)
}

export function getAllCookies (): { [name: string]: string } {
  const res: { [name: string]: string } = {}

  const cookies = decodeURIComponent(document.cookie).split(';')

  for (const cookie of cookies) {
    const [name, value] = cookie.split('=')

    res[name] = value
  }

  return res
}

export function getCookie (name: string): string {
  return getAllCookies()[name]
}

export async function request (method: string, url: string, config?: RequestInit): Promise<unknown> {
  const res = await fetch(url, { ...config, method, credentials: 'same-origin' })

  if (res.ok) {
    const body = await res.text()
    let json

    try {
      json = JSON.parse(body)
    } catch (err) {
      json = body
    }

    return json
  }

  throw res
}

export function postData (url: string, data: any, config?: RequestInit): Promise<unknown> {
  return request('POST', url, {
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
    ...config
  })
}

export function reverseStr (str: string): string {
  return str.split('').reverse().join('')
}

export function last<T> (a: Array<T>): T {
  return a[a.length - 1]
}
