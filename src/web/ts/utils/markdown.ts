import marked, { Renderer } from 'marked'

const ALLOWED_SCHEMES = ['http', 'https'] // URL scheme whitelist

const SCHEME_REGEX = `(?:${ALLOWED_SCHEMES.join('|')}):\\/\\/`
const URL_REGEX = new RegExp(`^(?:${SCHEME_REGEX})?[\\w.-]+(?:\\.[\\w\\.-]+)+[\\w\\-\\._~:/?#[\\]@!\\$&'\\(\\)\\*\\+,;=.]+$`)

function isValidUrl (url: string): boolean {
  return URL_REGEX.test(url)
}

function sanitize (s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

class HermesRenderer extends Renderer {
  image (href: string, title: string, text: string): string {
    if (isValidUrl(href)) {
      return super.image(href, title, text)
    }

    return `![${text}](${href})`
  }

  link (href: string, title: string, text: string): string {
    if (isValidUrl(href)) {
      return super.link(href, title, text)
    }

    return `[${text}](${href})`
  }

  heading (text: string, level: number): string {
    const hashes = '#'.repeat(level)

    return this.text(`${hashes} ${text}`)
  }

  text (text: string): string {
    return text
  }
}

marked.setOptions({ renderer: new HermesRenderer() })

export function parseMD (md: string): string {
  return marked.inlineLexer(sanitize(md), [])
}
