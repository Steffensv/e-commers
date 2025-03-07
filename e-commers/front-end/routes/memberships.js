const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAdmin = require('../../back-end/middleware/auth').isAdmin;


// Get all memberships
router.get('/', isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/memberships');
    res.render('memberships', { memberships: response.data.data.memberships });
  } catch (error) {
    res.render('memberships', { error: 'Error fetching memberships' });
  }
});

// Add a new membership
router.post('/add', isAdmin, async (req, res) => {
  try {
    const { name, price } = req.body;
    await axios.post('http://localhost:3001/memberships', { name, price });
    res.redirect('/memberships');
  } catch (error) {
    res.render('memberships', { error: 'Error adding membership' });
  }
});

// Edit an existing membership
router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;
    await axios.put(`http://localhost:3001/memberships/${id}`, { name, price });
    res.redirect('/memberships');
  } catch (error) {
    res.render('memberships', { error: 'Error editing membership' });
  }
});

// Delete a membership
router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await axios.delete(`http://localhost:3001/memberships/${id}`);
    res.redirect('/memberships');
  } catch (error) {
    res.render('memberships', { error: 'Error deleting membership' });
  }
});

module.exports = router;