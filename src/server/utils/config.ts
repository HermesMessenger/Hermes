import fs from 'fs'
import path from 'path'
import { VapidKeys, generateVAPIDKeys } from 'web-push'

interface Config {
  mainIP: string;
  port: number;
  webPush: VapidKeys;
  db: DB;
}

interface DB {
  hosts: string[];
  keyspace: string;
  username: string;
  password: string;
  datacenter: string;
}

export const template: Config = {
  mainIP: 'localhost',
  port: 8080,
  webPush: generateVAPIDKeys(),
  db: {
    hosts: ['127.0.0.1'],
    keyspace: 'hermes',
    username: 'cassandra',
    password: 'cassandra',
    datacenter: 'datacenter1'
  }
}

const file = path.resolve(__dirname, '../../../config.json')
const contents = fs.readFileSync(file, 'utf8')

export const config = JSON.parse(contents) as Config
