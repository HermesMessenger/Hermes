import bcrypt from 'bcrypt'
import * as db from './db'

const SaltRounds = 3

export function compare (password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function save (username: string, password: string, bot = false): Promise<string> {
  const hash = await bcrypt.hash(password, SaltRounds)
  const uuid = await db.register(username, hash, bot)

  return uuid
}

export async function update (username: string, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, SaltRounds)

  await db.updatePasswordHash(username, hash)
}
