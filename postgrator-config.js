require('dotenv').config();

module.exports = {
    "migrationsDirectory": "migrations",
    "driver": "pg",
    "connectionString": (process.env.NODE_ENV === 'test') ?
        //if true
        process.env.TEST_DB_URL
         :
        //if false
        process.env.DB_URL 
}



/* Notes
migrationsDirectory - refers to the folder in our app that contains our migration steps

driver - refers to the same driver setting used to create a knex instance

*/