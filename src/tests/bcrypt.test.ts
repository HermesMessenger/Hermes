import * as bcrypt from '../server/bcrypt'
import chai from 'chai'
import promised from 'chai-as-promised'

chai.use(promised)
chai.should()

const hashRegex = /^\$2[ayb]\$.{56}$/
const string = 'UnitTests123'
let hash: string

describe('Bcrypt tests', () => {
  describe('Hashing', () => {
    it('should hash a password', async () => {
      hash = await bcrypt.hash(string)
      return hash.should.match(hashRegex)
    })
  })

  describe('Verifying', () => {
    it('should return true if the password matches the hash', async () => {
      return bcrypt.compare(string, hash).should.be.fulfilled.and.eventually.equal(true)
    })

    it('should return false if it does not match', async () => {
      return bcrypt.compare('IncorrectPassword', hash).should.be.fulfilled.and.eventually.equal(false)
    })
  })
})
