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

export function getData (url: string, config?: RequestInit): Promise<unknown> {
  return request('GET', url, config)
}
