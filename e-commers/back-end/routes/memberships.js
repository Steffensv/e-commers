const express = require('express');
const { Membership } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all memberships
router.get('/', authenticate, async (req, res) => {
  try {
    const memberships = await Membership.findAll();
    res.json({ status: 'success', statuscode: 200, data: { Result: 'Memberships found', memberships } });
  } catch (error) {
    res.status(500).json({ status: 'error', statuscode: 500, data: { Result: error.message } });
  }
});

module.exports = router;