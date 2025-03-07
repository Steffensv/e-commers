const express = require('express');
const router = express.Router();
const orderController = require('../controller/orderController');
const { authenticateToken } = require('../middleware/auth');

// Debug endpoint for token verification
router.get('/verify-token', authenticateToken, (req, res) => {
  try {
    res.json({
      status: 'success', 
      message: 'Token is valid', 
      user: {
        id: req.user.id,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Token verification failed',
      details: error.message
    });
  }
});

// Apply authentication middleware to cart routes
router.use(authenticateToken);

// Get cart
router.get('/', orderController.getCart);

// Add item to cart
router.post('/add', orderController.addToCart);

// Update cart item
router.put('/update', orderController.updateCartItem);

// Remove item from cart
router.delete('/remove/:cartItemId', orderController.removeFromCart);

module.exports = router;