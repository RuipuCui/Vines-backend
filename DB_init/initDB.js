const {Client} = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config()
const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, 
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql')).toString();

client.connect()
    .then(() => client.query(schema))
    .then(() => console.log("Tables Created"))
    .catch(err => console.error("Error", err))
    .finally(() => client.end());

