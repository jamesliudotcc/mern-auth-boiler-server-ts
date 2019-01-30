const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();
const db = require('./models');

// POST /auth/login route - returns a JWT
router.post('/login', async (req, res) => {
  console.log('In the POST /auth/login route');
  console.log(req.body);

  // Find out if user is in DB
  try {
    const user = await db.User.findOne({ email: req.body.email });
    if (!user || !user.password) {
      return res.status(400).send('Fill in user and password');
    }

    // User exists, check the password:
    if (!user.isAuthenticated(req.body.password)) {
      return res.status(401).send('Invalid credentials');
    }

    // Valid user, passed authentication. Need to make them a token
    const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
      expiresIn: 60 * 60 * 24, //24 hours in seconds
    });

    res.send({ token: token });
  } catch (err) {
    console.log('Error in POST /auth/login', err);
    res.status(503).send('Database Error');
  }
});

// POST /auth/signup route - create a user in the DB and then log them in
router.post('/signup', (req, res) => {
  //TODO debug statements; remove when no longer needed
  console.log('In the POST /auth/signup route');
  console.log(req.body);

  db.User.findOne({ email: req.body.email })
    .then(user => {
      if (user) {
        // If user exists, don't let them create a duplicate
        return res.status(409).send('User already exists');
      }

      db.User.create(req.body)
        .then(createdUser => {
          //create and send a token.
          const token = jwt.sign(createdUser.toJSON(), process.env.JWT_SECRET, {
            expiresIn: 60 * 60 * 24, //24 hours in seconds
          });

          res.send({ token: token });
        })
        .catch(err => {
          console.log('Error in Post /auth/signup when creating new user', err);
          res.status(503).send('Database Error');
        });
    })
    .catch(err => {
      console.log('Error in POST /auth/signup', err);
      res.status(503).send('Database Error');
    });
});

// This is what is returned when client queries for new user data
router.get('/current/user', async (req, res) => {
  console.log('GET /auth/current/user STUB');

  if (!req.user || !req.user.id) {
    return res.status(401).send({ user: null });
  }

  try {
    const user = await db.User.findById(req.user.id);
    res.send({ user: user });
  } catch (err) {
    console.log('Error with /auth/current GET route:', error);
    res.status(503).send({ user: null });
  }
});

module.exports = router;
