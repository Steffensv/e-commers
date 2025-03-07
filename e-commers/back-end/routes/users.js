const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { 
  getUserById, 
  updateUser, 
  updatePassword, 
  updateMembership 
} = require('../controller/userController');

// Get user profile
router.get('/profile', authenticate, getUserById);

// Update user profile
router.put('/profile', authenticate, updateUser);

// Change password
router.put('/change-password', authenticate, updatePassword);

// Upgrade membership
router.put('/upgrade-membership', authenticate, updateMembership);

module.exports = router;