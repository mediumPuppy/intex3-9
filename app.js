// dependencies
let express = require('express');
let knexInit = require('knex');
let path = require('path');
require('dotenv').config();

// declare app
let app = express();

// 'set' and 'use' here
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true}));

// set env variables
let PORT = process.env.PORT || 3000
let DB_PORT = process.env.RDS_PORT || process.env.DB_PORT || 5432

// set up db connection
let knex = knexInit({
  client: 'pg',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
  }
});

// test db connection with generic query
knex.raw('SELECT NOW()')
  .then(result => {
    console.log('Connection successful.' + result.rows[0].now);
  })
  .catch(error => {
    console.error('Connection failed:', error);
  })  .finally(() => {
    knex.destroy();
    // Close the connection
  });

app.get('/', (req,res) => {
  res.render("landing")
});

app.get('/login', (req,res) => {
  res.render('login')
})

app.listen(PORT)

