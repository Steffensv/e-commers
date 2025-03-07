const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAdmin = require('../../back-end/middleware/auth').isAdmin;


// Get all users
router.get('/', isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/api/users');
    res.render('users', { users: response.data.data.users });
  } catch (error) {
    res.render('users', { error: 'Error fetching users' });
  }
});

// Add a new user
router.post('/add', isAdmin, async (req, res) => {
  try {
    const { username, password, roleId } = req.body;
    await axios.post('http://localhost:3001/api/users', { username, password, roleId });
    res.redirect('/users');
  } catch (error) {
    res.render('users', { error: 'Error adding user' });
  }
});

// Edit an existing user
router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, roleId } = req.body;
    await axios.put(`http://localhost:3001/api/users/${id}`, { username, password, roleId });
    res.redirect('/users');
  } catch (error) {
    res.render('users', { error: 'Error editing user' });
  }
});

// Edit own credentials
router.post('/edit-profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    const { username, password } = req.body;
    const { id } = req.session.user;
    await axios.put(`http://localhost:3001/api/users/${id}`, { username, password });
    res.redirect('/users');
  } catch (error) {
    res.render('users', { error: 'Error editing profile' });
  }
});

// Delete a user
router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await axios.delete(`http://localhost:3001/api/users/${id}`);
    res.redirect('/users');
  } catch (error) {
    res.render('users', { error: 'Error deleting user' });
  }
});


// GET route for registration page
router.get('/register', (req, res) => {
  res.render('register');  // This will load register.ejs
});

// POST route to handle registration form submission
router.post('/register', async (req, res) => {
  const { username, password, roleId } = req.body;
  try {
    await axios.post('http://localhost:3001/api/auth/register', { username, password, roleId });
    res.redirect('/login');
  } catch (error) {
    res.render('register', { error: 'Error registering user' });
  }
});

module.exports = router;