import Commands from './Commands'

interface Command<K extends keyof Commands> {
  header: K;
  data: Commands[K];
}

export function Command<K extends keyof Commands> (header: K, data: Commands[K]): Command<K> {
  return { header, data }
}
