export function isAtBottom(): boolean {
  return (document.body.offsetHeight - window.innerHeight - window.scrollY) < 50
}

export function scrollToBottom(): void {
  window.scrollTo({
    behavior: 'smooth',
    top: document.body.offsetHeight
  })
}
