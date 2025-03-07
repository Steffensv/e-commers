const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAdmin = require('../../back-end/middleware/auth').isAdmin;

// Get all categories
router.get('/', isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/api/categories');
    res.render('categories', { categories: response.data.data.categories });
  } catch (error) {
    res.render('categories', { error: 'Error fetching categories' });
  }
});

// Add a new category
router.post('/add', isAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    await axios.post('http://localhost:3001/api/categories', { name });
    res.redirect('/categories');
  } catch (error) {
    res.render('categories', { error: 'Error adding category' });
  }
});

// Edit an existing category
router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await axios.put(`http://localhost:3001/api/categories/${id}`, { name });
    res.redirect('/categories');
  } catch (error) {
    res.render('categories', { error: 'Error editing category' });
  }
});

// Delete a category
router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await axios.delete(`http://localhost:3001/api/categories${id}`);
    res.redirect('/categories');
  } catch (error) {
    res.render('categories', { error: 'Error deleting category' });
  }
});

module.exports = router;