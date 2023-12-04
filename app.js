// dependencies
let express = require('express');
let knexInit = require('knex');
let path = require('path');
require('dotenv').config();
const { body, validationResult } = require('express-validator');


// declare app
let app = express();

// 'set' and 'use' here
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(express.urlencoded({ extended: true}));

// set env variables
let PORT = process.env.PORT || 3000;
let DB_PORT = process.env.RDS_PORT || process.env.DB_PORT || 5432;

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
    console.log('Connection successful: ' + result.rows[0].now);
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
});

// app.post('/login', (req,res) => {

// });


app.post('/create', 
  [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 5 }),
    body('firstname').trim().isAlpha().escape(),
    body('lastname').trim().isAlpha().escape(),
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  try {
    const foundUsers = await knex('users').where({ username: username });
    if (foundUsers.length > 0) {
      return res.redirect(`/admin?status=username`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await knex('users').insert({
      username,
      passwordHash: hashedPassword,
      firstname,
      lastname
    });

    // Redirect or send a success response
    return res.redirect(`/admin?status=created`);
  } catch (error) {
    // Log the error and send an error response
    console.error(error);
    return res.status(500).send('An error occurred');
  }
});


// app.get('/deleteuser', (req,res) => {

// });

// app.get('edituser', (req,res) => {

// });

app.listen(PORT)

