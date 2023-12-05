// dependencies
let express = require('express');
let knexInit = require('knex');
let path = require('path');
require('dotenv').config();
const favicon = require('serve-favicon');
const { body, validationResult } = require('express-validator');
let session = require('express-session');
let bcrypt = require('bcrypt');
// initialize app
let app = express();
app.use(favicon(path.join(__dirname, '/static/images/favicon.png')));


// 'set' and 'use' here
app.set('view engine', 'ejs');
app.use(express.static('static'));
app.use(express.urlencoded({ extended: true}));

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET, // Replace with your secret key
  resave: false,
  saveUninitialized: true,
}));

// set env variables
let PORT = process.env.PORT || 3000;
let DB_PORT = process.env.DB_PORT || 5432;

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
knex.raw('SELECT * FROM users')
  .then(result => {
    console.log('Database connection successful: ' + result.rows[0].username);
  })
  .catch(error => {
    console.error('Connection failed:', error);
  });

app.get('/', (req,res) => {
  res.render("landing")
});

app.get('/login', (req, res) => {
  // If user is already logged in, redirect to account page
  if (req.session.user_id) {
    return res.redirect('/account');
  }

  let statusMessage = '';
  if (req.query.status === 'fail') {
    statusMessage = 'Login failed. Please try again.';
  }

  res.render('login', { statusMessage: statusMessage });
});

//admin route for seeing all the data
app.get('/admin/data', async (req, res) => {
  let respondents = await knex('respondent');
  
  res.render('data', {data:respondents})}
)

//a view to see one of the user's data while an admin
app.get('/admin/data/:userid', async (req, res) => {
  try {
    let individual = await knex('respondent').where('user_id', '=', req.params.userid);
    res.render('individuals', {data:individual})
  }

  catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
}
)
// admin route for creating users
app.get('/admin', (req, res) => {
  // const data = await knex('all data') ...  make async 
  res.render('admin', { query: req.query })
});

app.get('/survey', (req, res) => {
  res.render('survey')
});

app.get('/account', async (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login'); // Redirect to login if not authenticated
  }

  try {
    const user = await knex('users').where({ id: req.session.user_id }).first();

    if (user) {
      res.render('account', { data: user });
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});


// Route to handle the login form submission (POST request)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await knex('users').where({ username: username }).first();

    if (!user) {
      return res.redirect('/login?status=fail');
    }

    if (await bcrypt.compare(password, user.passwordhash)) {
      req.session.user_id = user.id; // Store user_id in session
      return res.redirect('/account'); // Redirect to account page
    } else {
      return res.redirect('/login?status=fail');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

app.get('/logout', (req, res) => {
  // Clear the session data
  req.session.destroy(err => {
      if (err) {
          // Handle the error case
          console.log(err);
          res.status(500).send("Could not log out, please try again");
      } else {
          // Redirect to the home page or login page
          res.redirect('/');
      }
  });
});



app.post('/create', 
  [
    body('username').trim().isLength({ min: 3 }).escape(),
    body('password').isLength({ min: 5 }),
    body('firstname').trim().isAlpha().escape(),
    body('lastname').trim().isAlpha().escape(),
    //! insert email here 
  ], 
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  try {
    const { username, password, firstname, lastname  } = req.body;
    const foundUsers = await knex('users').where({ username: username });
    if (foundUsers.length > 0) {
      return res.redirect(`/admin?status=username`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await knex('users').insert({
      username,
      passwordhash: hashedPassword,
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

app.post('/update-account', async (req, res) => {
  // Extract data from the request body
  const { email, firstname, lastname } = req.body;
  const userId = req.session.user_id; // Assuming you store user id in session after login

  if (!userId) {
    return res.redirect('/login'); // Redirect to login if not authenticated
  }

  try {
    // Update the user in the database
    await knex('users')
      .where({ id: userId })
      .update({
        email: email,
        firstname: firstname,
        lastname: lastname
      });

    res.redirect('/account'); // Redirect back to account page after update
  } catch (error) {
    console.error(error);
    res.status(500).send('Unable to update account information');
  }
});



// app.get('/deleteuser', (req,res) => {

// });

// app.get('edituser', (req,res) => {

// });

app.listen(PORT, (req, res) => {
  console.log('Successfully connected to port ' + PORT)
})

