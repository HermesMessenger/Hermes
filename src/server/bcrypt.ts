import bcrypt from 'bcrypt'

const SaltRounds = 9 // TODO: Increase this further whenever we get a more powerful server

export function compare (password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function hash (password: string): Promise<string> {
  const hash = await bcrypt.hash(password, SaltRounds)

  return hash
}
