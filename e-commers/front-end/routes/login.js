const express = require('express');
const axios = require('axios');
const router = express.Router();

// GET route to show login form
router.get('/', (req, res) => {
  // Render the index page with any error messages, since that's where your login form is
  res.render('index', { error: req.query.message || null });
});

// POST route for login form submission
router.post('/', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    
    console.log('Login attempt with:', { 
      usernameOrEmail, 
      password: '****' 
    });
    
    // Make API request to backend
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      usernameOrEmail,
      password
    });
    
    console.log('Login API response:', {
      status: response.status,
      hasData: !!response.data,
      hasUser: !!response.data?.data?.user,
      hasToken: !!response.data?.data?.accessToken

    });
    
    // Check if login was successful
    if (response.data?.data?.accessToken && response.data?.data?.user) {
      // Store data in session
      req.session.accessToken = response.data.data.accessToken;
      req.session.user = response.data.data.user;
      req.session.isLoggedIn = true;
      
      // Set admin flag if applicable
      if (response.data.data.user.role === 'admin' || response.data.data.user.isAdmin) {
        req.session.isAdmin = true;
      }
      
      // Save session explicitly before redirecting
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.render('index', { error: 'Session error. Please try again.' });
        }
        
        console.log('Session saved with token and user data');
        
        // Redirect based on role
        if (req.session.isAdmin) {
          return res.redirect('admin/dashboard');
        } else {
          return res.redirect('/');
        }
      });
    } else {
      console.error('Login response missing expected data:', response.data);
      return res.render('index', { error: 'Invalid login response' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    
    let errorMessage = 'Invalid username or password';
    
    if (error.response) {
      console.error('Error response:', error.response.data);
      errorMessage = error.response.data.message || errorMessage;
    }
    return res.render('index', { error: errorMessage });
  }
});

module.exports = router;