import { promises as fs, PathLike } from 'fs' // require('fs').promises

export default async function fileExists (file: PathLike): Promise<boolean> {
  return fs.access(file)
    .then(() => true)
    .catch(() => false)
}
