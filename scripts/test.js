const app = require('../server')
const supertest = require('supertest')
const test = supertest(app)

describe('Loading files', () => {
    describe('JS files', () => {
        it('should return 200 when it exists', done => {
            test.get('/js/chat.js')
                .expect(200)
                .end(done)
        })

        it('should return 404 when it does not', done => {
            test.get('/js/dsnanjkdnjnadjrkhjekwrh3wurhw3erwerwe.js')
                .expect(404)
                .end(done)
        })
    })

    describe('JS lib files', () => {
        it('should return 200 when it exists', done => {
            test.get('/js/lib/jquery.js')
                .expect(200)
                .end(done)
        })

        it('should return 404 when it does not', done => {
            test.get('/js/lib/dsnanjkdnjnadjrkhjekwrh3wurhw3erwerwe.js')
                .expect(404)
                .end(done)
        })
    })

    describe('CSS files', () => {
        it('should return 200 when it exists', done => {
            test.get('/css/login.css')
                .expect(200)
                .end(done)
        })

        it('should return 404 when it does not', done => {
            test.get('/css/dsnanjkdnjnadjrkhjekwrh3wurhw3erwerwe.css')
                .expect(404)
                .end(done)
        })
    })

    describe('Theme files', () => {
        it('should return 200 when it exists', done => {
            test.get('/css/themes/hermes.css')
                .expect(200)
                .end(done)
        })

        it('should return 404 when it does not', done => {
            test.get('/css/themes/dsnanjkdnjnadjrkhjekwrh3wurhw3erwerwe.css')
                .expect(404)
                .end(done)
        })
    })

    describe('Image files', () => {
        it('should return 200 when it exists', done => {
            test.get('/images/HermesMessengerLogo.png')
                .expect(200)
                .end(done)
        })

        it('should return 404 when it does not', done => {
            test.get('/images/dsnanjkdnjnadjrkhjekwrh3wurhw3erwerwe.png')
                .expect(404)
                .end(done)
        })
    })
})

// TODO Finish writing tests