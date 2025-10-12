const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { validationResult } = require('express-validator');
const { validateEmail, validatePassword } = require('./customValidators');
const bcrypt = require('bcrypt');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {  // use userId for stronger auth
    return next();
  }
  res.redirect('/login');
};

// Home route, require auth
router.get('/', isAuthenticated, (req, res) => {
  const email = req.session.userEmail || null;
  res.render('hello-world', { email, title: 'Home' }); // add title for layout
});

// Render login page
router.get('/login', (req, res) => {
  res.render('login', { errors: [], message: null, title: 'Login' });
});

// Process login
router.post('/login', [validateEmail, validatePassword], (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.render('login', { errors: validationErrors.array(), message: null, title: 'Login' });
  }

  const { email, password } = req.body;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        return res.render('login', { errors: [], message: 'Incorrect Email Address.', title: 'Login' });
      }
      return bcrypt.compare(password, user.password).then(isMatch => ({ user, isMatch }));
    })
    .then(({ user, isMatch }) => {
      if (!isMatch) {
        return res.render('login', { errors: [], message: 'Incorrect password.', title: 'Login' });
      }
      // Set user session
      req.session.userId = user._id;
      req.session.userEmail = user.email;
      res.render('hello-world', { email: user.email, title: 'Home' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

// Get all users (example route)
router.get('/getUser', isAuthenticated, (req, res) => {
  User.find()
    .then(data => res.render('index', { data, title: 'User List' }))
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

// Render signup page
router.get('/signup', (req, res) => {
  res.render('signup', { message: null, error: null, title: 'Sign Up' });
});

// Process signup
router.post('/signup', (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render('signup', { message: 'Password and Confirm Password do not match', error: null, title: 'Sign Up' });
  }

  const user = new User({ email, password });
  const validationError = user.validateSync();

  if (validationError) {
    return res.render('signup', { message: null, error: validationError.errors, title: 'Sign Up' });
  }

  User.findOne({ email })
    .then(existingUser => {
      if (existingUser) {
        return res.render('signup', { message: 'Email already taken', error: null, title: 'Sign Up' });
      }
      return bcrypt.hash(password, 10);
    })
    .then(hashedPassword => {
      const newUser = new User({ email, password: hashedPassword });
      return newUser.save();
    })
    .then(() => {
      res.redirect('/login');
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Internal Server Error');
    });
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.send('Error logging out');
    }
    res.redirect('/login');
  });
});

module.exports = router;
