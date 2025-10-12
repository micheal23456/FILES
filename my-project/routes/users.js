var express = require('express');
var router = express.Router();
const User = require('../models/userModel');

/* GET users listing. */

router.get('/createUser', (req, res) => {
  const newUser = new User({
    email: 'ahmaddd@gmail.com',
    password: '11223344',
  });

  newUser.save()
    .then(() => {
      res.send('User created');
    })
    .catch((error) => {
      console.error(error);
      
    });
});

module.exports = router;