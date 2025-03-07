const express = require('express');
const { Category } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all categories
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Categories found', categories } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

module.exports = router;