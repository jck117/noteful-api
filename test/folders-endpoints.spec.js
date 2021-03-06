//for testing the folders endpoints
const knex = require('knex')
const app = require('../src/app')
const { makeFolders, makeMaliciousFolder } = require('./folders.fixtures')
const { maliciousFolder, expectedFolder } = makeMaliciousFolder()

describe('Folders Endpoints', function() {

    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    afterEach('cleanup', () => db.raw('TRUNCATE noteful_folders, noteful_notes RESTART IDENTITY CASCADE'))

    //describe 'GET /noteful-api/folders'
    describe('GET /noteful-api/folders', () => {
        context('Given no folders', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    //GET
                    .get('/noteful-api/folders')
                    .expect(200, [])
            })
        })//End context 'Given no folders'

        context('Given there are folders in the database', () => {
            const testFolders = makeFolders()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it('responds with 200 and all of the folders', () => {
                return supertest(app)
                    //GET
                    .get('/noteful-api/folders')
                    .expect(200, testFolders)
            })
        })//End context 'Given there are folders in the database'

        context('Given it includes an XSS attack folder', () => {
            const testFolders = makeFolders()

            beforeEach('insert malicious folder', () => {
                return db
                    .into('noteful_folders')
                    .insert([maliciousFolder])
            })

            it('removes XSS attack content', () => {
                return supertest(app)
                    .get('/noteful-api/folders')
                    .expect(200)
                    .expect(res => {
                        expect(res.body[0].name).to.eql(expectedFolder.name)
                    })
            })
        })//End context context 'Given it includes an XSS attack folder'
    
    })//end describe 'GET /noteful-api/folders'

    //describe 'POST /noteful-api/folders'
    describe('POST /noteful-api/folders', () => {
        
        it('creates a folder, responding with 201 and the new folder', function() {
            const newFolder = {
                name: "New Folder"
            }
            console.log(newFolder)
            return supertest(app)
                .post('/noteful-api/folders')
                .send(newFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property('id')
                    expect(res.body.name).to.eql(newFolder.name)
                })
                .then(postRes => 
                    supertest(app)
                        .get(`/noteful-api/folders/${postRes.body.id}`)
                        .expect(postRes.body)
                )
        })


        const requiredFields = ['name']

        requiredFields.forEach(field => {
            const newFolder = {
                name: "Test new folder"
            }

            it(`responds with 400 and an error message when the ${field} is missing`, () => {
               delete newFolder[field]

               return supertest(app)
                    .post('/noteful-api/folders')
                    .send(newFolder)
                    .expect(400, {
                        error: {message: `Missing '${field}' in request body`}
                    })
            })
        })

        it('removes XSS attack content from response', () => {
            return supertest(app)
                .post('/noteful-api/folders')
                .send(maliciousFolder)
                .expect(201)
                .expect(res => {
                    expect(res.body.name).to.eql(expectedFolder.name)
                })
        })
    })//end describe 'POST /noteful-api/folders'   


    //describe 'GET /noteful-api/folders/:folder_id'
    describe('GET /noteful-api/folders/:folder_id', () => {
        context('Given no folders', () => {
            it('responds with 404', () => {
                const folderId = 123456
                return supertest(app)
                    .get(`/noteful-api/folders/${folderId}`)
                    .expect(404, {error: {message: `Folder doesn't exist.`}})
            })
        })//end context 'Given no folders'
        
        context('Given there are folders in the database', () => {
            const testFolders = makeFolders()

            beforeEach('insert folders', () => {
                return db
                    .into('noteful_folders')
                    .insert(testFolders)
            })

            it('responds with 200 and the specified folder', () => {
                const folderId = 2
                const expectedFolder = testFolders[folderId - 1]
                return supertest(app)
                    .get(`/noteful-api/folders/${folderId}`)
                    .expect(200, expectedFolder)
            })
        })//end context 'Given there are folders in the database'
    })//end describe 'GET /noteful-api/folders/:folder_id'



})//end describe 'Folders Endpoints'



