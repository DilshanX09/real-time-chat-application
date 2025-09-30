const mysql = require('mysql2');
require('dotenv').config();

const database = mysql.createConnection({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     charset: 'utf8mb4'
})

module.exports = database;