import { $, fadeIn, fadeOut } from 'ts/utils/dom'

const loginForm = $('#login-form') as HTMLFormElement
const registerForm = $('#register-form') as HTMLFormElement
const loginFormSubmit = $('#login-form a') as HTMLLinkElement
const registerFormSubmit = $('#register-form a') as HTMLLinkElement
const cookieNotice = $('#cookie-notice') as HTMLDivElement

loginFormSubmit.onclick = () => {
  fadeOut(loginForm, () => {
    fadeIn(registerForm)
  })
}

registerFormSubmit.onclick = () => {
  fadeOut(registerForm, () => {
    fadeIn(loginForm)
  })
}

cookieNotice.onclick = () => {
  fadeOut(cookieNotice)
}

const hmr = (module as any).hot
if (hmr) {
  hmr.accept()
  hmr.dispose(() => {
    console.log('[HMR] Updated')
  })
}
