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
// Serve static files from node_modules
app.use('/node_modules', express.static('node_modules'));

// ... rest of your server setup


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

//make session user var available to all views
app.use((req, res, next) => {
  if (req.session.user_id) {
    res.locals.user_id = req.session.user_id;
  } else {
    res.locals.user_id = null;
  }
  next();
});


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
  if (req.session.user_id == 'admin') {
    return res.redirect('/account');
  }

  let statusMessage = '';
  if (req.query.status === 'fail') {
    statusMessage = 'Login failed. Please try again.';
  }

  res.render('login', { statusMessage: statusMessage });
});

// edit user from admin page
app.get('/edituser/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await knex('users').where('id', userId).first();
    if (user) {
      res.render('edituser', { user }); // render edit user page with user data
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// actually post the changed data from the user id
app.post('/edituser/:id', async (req, res) => {
  const userId = req.params.id;
  const updatedData = req.body; // Assuming the body contains the updated user data
  try {
    await knex('users').where('id', userId).update(updatedData);
    res.redirect('/admin'); // Redirect to a confirmation page or user list
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// admin ability to delete user
app.get('/deleteuser/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    await knex('users').where('id', userId).del();
    res.redirect('/admin'); // Redirect to the list of users, or another appropriate page
  } catch (error) {
    res.status(500).send('Server error');
  }
});




//admin route for seeing all the data
app.get('/data', async (req, res) => {

  let respondents = await knex('respondent');
  
  res.render('data', {data:respondents})
} 
)

//a view to see one of the user's data while an admin
app.get('/data/:userid', async (req, res) => {
  // if (req.session.user_id == 'admin') {
  try {
    let individual = await knex('respondent').where('user_id', '=', req.params.userid);
    res.render('data', {data:individual})
  }

  catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
  // } else {
  //   res.redirect('access')
  // }
});
// admin route for creating users
app.get('/admin', async (req, res) => {
  const users = await knex('users')
  res.render('admin', { 
                        query: req.query,
                        data: users       
                      })
});

// this route will redirect to the resources view
app.get('/resources', (req, res) => {
  res.render('resources')
});

//this route will redirect to the about view
app.get('/about', (req, res) => {
  res.render('about')
});

//this route will redirect to the learn view with the dashboard
app.get('/learn', (req, res) => {
  res.render('learn')
});

app.get('/survey', (req, res) => {
  // Check if the 'submitted' query parameter exists
  const submitted = req.query.submitted === 'true';

  // Render the 'survey' view and pass the 'submitted' flag
  res.render('survey', { submitted: submitted });
});


app.get('/access', (req, res) => {
  res.status(403).render('access')
})

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
    body('email').trim().isEmail().normalizeEmail()
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
  const { email, firstname, lastname, password } = req.body;
  const userId = req.session.user_id; // Assuming you store user id in session after login

  if (!userId) {
    return res.redirect('/login'); // Redirect to login if not authenticated
  }

  try {

    const updateFields = {
      email: email,
      firstname: firstname,
      lastname: lastname, // Save the hashed password
    }
    // Hash the password before saving it to the database
    if (password) {
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      // Update the password field
      updateFields.passwordhash = hashedPassword;
    }

    // Update the user in the database
    await knex('users')
      .where({ id: userId })
      .update(updateFields);

    // Redirect or send a success response
    res.redirect('/account');
  } catch (error) {
    // Handle errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Unable to update account information');
  }
});





// app.get('/deleteuser', (req,res) => {

// });

// app.get('edituser', (req,res) => {

// });
app.post('/submitsurvey', async (req, res) => {
  try {
    const {
      age,
      gender,
      relationship_status,
      occupation_status,
      organization_affiliation, // This will be an array
      social_media_user,
      social_media_platforms, // This will also be an array
      daily_social_media_time,
      use_without_purpose,
      use_while_busy,
      restlessness_from_withdrawal,
      easily_distracted,
      bothered_by_worries,
      difficult_to_concentrate,
      compare_with_successful_people,
      feelings_toward_comparisons,
      seek_validation,
      feelings_of_depression,
      fluctuation_of_interest_in_activities,
      sleep_issue_frequency,
    } = req.body;

    // get a timestamp to insert the data. 
    let time = formatCurrentDateTime()
    // Insert data into the "respondents" table and get the inserted User_ID
    const insertedIds = await knex('respondent').insert({
    age: age,
    gender: gender,
    timestamp: time,
    relationship_status: relationship_status,
    occupation_status: occupation_status,
    social_media_user: social_media_user,
    region: 'Provo',
    daily_social_media_time: daily_social_media_time,
    use_without_purpose: use_without_purpose,
    use_while_busy: use_while_busy,
    restlessness_from_withdrawal: restlessness_from_withdrawal,
    easily_distracted: easily_distracted,
    bothered_by_worries: bothered_by_worries,
    difficult_to_concentrate: difficult_to_concentrate,
    compare_with_successful_people: compare_with_successful_people,
    feelings_toward_comparisons: feelings_toward_comparisons,
    seek_validation: seek_validation,
    feelings_of_depression: feelings_of_depression,
    fluctuation_of_interest_in_activities: fluctuation_of_interest_in_activities,
    sleep_issue_frequency: sleep_issue_frequency

    }).returning('user_id');


    //! SET THIS TO DO THE ROLLBACK JOSH MENTIONED. 
    const userId = insertedIds[0].user_id;



    // Assuming organization_affiliation and social_media_platforms are arrays
    for (const orgId of organization_affiliation) {
      for (const socialMediaId of social_media_platforms) {
        await knex('linking').insert({
          user_id: userId,
          organization_id: orgId,
          social_platform_id: socialMediaId
        });
      }
    }

    console.log('Data inserted successfully');
    res.redirect('/survey?submitted=true');
  } catch (error) {
    console.error('Error inserting data: ' + error.message);
    res.status(500).send('Error submitting the form');
  }
});

function formatCurrentDateTime() {
  var now = new Date();

  var year = now.getFullYear();
  var month = ('0' + (now.getMonth() + 1)).slice(-2); // months are zero-indexed
  var day = ('0' + now.getDate()).slice(-2);

  var hours = ('0' + now.getHours()).slice(-2);
  var minutes = ('0' + now.getMinutes()).slice(-2);
  var seconds = ('0' + now.getSeconds()).slice(-2);

  return month + '/' + day + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
}

// end
app.listen(PORT, (req, res) => {
  console.log('Successfully connected to port ' + PORT)
})

