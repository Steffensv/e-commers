const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAdmin = require('../../back-end/middleware/auth').isAdmin;

// Get all brands
router.get('/', isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/api/brands');
    res.render('brands', { brands: response.data.data.brands });
  } catch (error) {
    res.render('brands', { error: 'Error fetching brands' });
  }
});

// Add a new brand
router.post('/add', isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    await axios.post('http://localhost:3001/api/brands', { name });
    res.redirect('/brands');
  } catch (error) {
    res.render('brands', { error: 'Error adding brand' });
  }
});

// Edit an existing brand
router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await axios.put(`http://localhost:3001/api/brands/${id}`, { name });
    res.redirect('/brands');
  } catch (error) {
    res.render('brands', { error: 'Error editing brand' });
  }
});

// Delete a brand
router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await axios.delete(`http://localhost:3001/api/brands/${id}`);
    res.redirect('/brands');
  } catch (error) {
    res.render('brands', { error: 'Error deleting brand' });
  }
});

module.exports = router;