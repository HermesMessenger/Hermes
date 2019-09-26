import Supertest from 'supertest'
import path from 'path'

// set as we were running from $BASE/dist/server instead of $BASE/src/tests/
process.env.dirname = path.join(__dirname, '../../dist/server')

import app from '../server' // eslint-disable-line import/first

const server = Supertest(app)

describe('HTTP tests', () => {
  describe('Loading files', () => {
    describe('JS files', () => {
      it('should return 200 when the file exists', done => {
        server.get('/js/chat-bundle.js')
          .expect(200)
          .end(done)
      })

      it('should return 404 when the file doesn\'t exist', done => {
        server.get('/js/fjiosjfile')
          .expect(404)
          .end(done)
      })
    })

    describe('Images', () => {
      it('should return 200 when the file exists', done => {
        server.get('/images/logo.png')
          .expect(200)
          .end(done)
      })

      it('should return 404 when the file doesn\'t exist', done => {
        server.get('/images/jdodsbhkdhipiow')
          .expect(404)
          .end(done)
      })

      it('favicon should exist', done => {
        server.get('/favicon.png')
          .expect(200)
          .end(done)
      })
    })

    describe('CSS files', () => {
      it('should return 200 when the file exists', done => {
        server.get('/css/login.css')
          .expect(200)
          .end(done)
      })

      it('should return 404 when the file doesn\'t exist', done => {
        server.get('/css/jdodsbhkdhipiow')
          .expect(404)
          .end(done)
      })
    })

    describe('Themes', () => {
      it('should return 200 when the file exists', done => {
        server.get('/themes/Hermes.css')
          .expect(200)
          .end(done)
      })

      it('should return 404 when the file doesn\'t exist', done => {
        server.get('/themes/jdodsbhkdhipiow')
          .expect(404)
          .end(done)
      })
    })
  })

  describe('Redirects & main paths', () => {
    describe('/ redirects', () => {
      it('should redirect to login if no hermes_uuid cookie', done => {
        server.get('/')
          .expect('location', '/login')
          .end(done)
      })

      it('should redirect to chat if hermes_uuid cookie', done => {
        server.get('/')
          .set('Cookie', ['hermes_uuid=59e7ea45-5f42-42e6-b4e0-fae20396f1ae'])
          .expect('Location', '/chat')
          .end(done)
      })
    })

    it('should return a 404 page when the path does not exist', done => {
      server.get('/dbhasbdhjabdhjagehjwg3qiw')
        .expect(404)
        .end(done)
    })
  })
})

app.close()
