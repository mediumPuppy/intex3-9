// dependencies
let express = require('express');
let knexInit = require('knex');
let path = require('path');

// declare app
let app = express();

// 'set' and 'use' here
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true}));

// set env variables
let PORT = process.env.PORT || 3000
let DB_PORT = process.env.RDS_PORT || process.env.DB_PORT || 5432

// set up db connection
// let knex = knexInit({
//   client: 'pg',
//   connection: {
//     host: 'testhost',
//     user: 'testuser'r,
//     password: 'testpass',
//     database: 'testdb',
//     port: DB_PORT
//   }
// });

// test db connection with generic query
// knex.raw('SELECT NOW()')
//   .then(result => {
//     console.log('Connection successful, current time is:', result.rows[0].now);
//   })
//   .catch(error => {
//     console.error('Connection failed:', error);
//   });

app.get('/', (req,res) => {
  res.render("landing")
});

app.get('/login', (req,res) => {
  res.render('login')
})

app.listen(PORT)

