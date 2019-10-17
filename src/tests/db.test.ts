import * as db from '../server/db'
import chai from 'chai'
import promised from 'chai-as-promised'

chai.use(promised)
chai.should()

const uuidRegex = /^[0-9A-F]{8}-(?:[0-9A-F]{4}-){3}[0-9A-F]{12}$/i
const username = 'UnitTests123'
let channelUUID: string

describe('DB tests', () => {
  describe('createChannel', () => {
    it('should create a channel', async () => {
      channelUUID = await db.createChannel(username, username)

      return channelUUID.should.match(uuidRegex)
    })
  })

  describe('get100Messages', () => {
    it('should throw an error when channel UUID is invalid', () => {
      return db.get100Messages('ads13814000-1dd2-11b2-8080-808080808080').should.be.rejected
    })

    it('should return an empty array when channel does not exist', () => {
      return db.get100Messages('aaaaaaaa-1dd2-11b2-aaaa-aaaaaaaaaaaa').should.eventually.have.length(0)
    })

    it('should return an empty array when a channel has no messages', () => {
      return db.get100Messages(channelUUID).should.eventually.have.length(0)
    })
  })
})
