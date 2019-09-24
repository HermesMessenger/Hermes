import Supertest from 'supertest'
import path from 'path'

// set as we were running from $BASE/dist instead of $BASE/src/tests/
process.env.dirname = path.join(__dirname, '../../dist/')

import app from '../server' // eslint-disable-line import/first

const supertest = Supertest(app)

describe('HTTP tests', () => {
  describe('Loading files', () => {
    describe('JS files', () => {
      it('should return 200 when the file exists', (done) => {
        supertest.get('/js/chat-bundle.js').expect(200).end(done)
      })

      it('should return 404 when the file doesn\'t exist', (done) => {
        supertest.get('/js/fjiosjfile').expect(404).end(done)
      })
    })
  })
})
