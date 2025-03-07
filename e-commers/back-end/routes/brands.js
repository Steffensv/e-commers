const express = require('express');
const { Brand } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all brands
router.get('/', authenticate, async (req, res) => {
  try {
    const brands = await Brand.findAll();
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Brands found', brands } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

module.exports = router;