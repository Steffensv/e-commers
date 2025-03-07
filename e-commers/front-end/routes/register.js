const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET route to display registration form
router.get('/', (req, res) => {
  res.render('user/register');
});

// POST route to handle registration form submission
router.post('/', async (req, res) => {
  const { firstname, lastname, username, email, password, address, phone } = req.body;
  try {
    const response = await axios.post('http://localhost:3001/api/auth/register', {
      firstname, 
      lastname, 
      username, 
      email, 
      password, 
      address, 
      phone
    });
    
    if (response.status === 201) {
      // Registration successful, redirect to login page
      res.redirect('/login');
    } else {
      throw new Error('Registration failed');
    }
  } catch (error) {
    console.error('Error registering user:', error);
    // Extract error message if available
    const errorMessage = error.response?.data?.data?.Result || 'Error registering user';
    res.render('register', { error: errorMessage });
  }
});

module.exports = router;