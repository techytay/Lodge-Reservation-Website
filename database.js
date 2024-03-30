// importing the required mysql packages 
const mysql = require('mysql2');

const dotenv = require('dotenv');
dotenv.config();

// creating the connect to the mysql database
const db = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
});

module.exports = db;
