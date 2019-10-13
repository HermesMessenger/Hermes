import { Commands } from './Commands'

export interface Command<K extends keyof Commands> {
  header: K;
  data: Commands[K];
}

export function Command<K extends keyof Commands> (header: K, data: Commands[K]): Command<K> {
  return { header, data }
}

export type UnknownCommand = { [K in keyof Commands]: Command<K> }[keyof Commands];

export function Response<K extends keyof Commands> (command: K, err: string): Command<'RESPONSE'> {
  return Command('RESPONSE', { originalCommand: command, error: err || null })
}

export { Commands }
