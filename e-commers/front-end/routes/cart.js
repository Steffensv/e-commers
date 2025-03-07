const express = require('express');
const axios = require('axios');
const router = express.Router();

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.accessToken) {
    next();
  } else {
    res.redirect('/login');
  }
};

// GET route to display cart page
router.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log('Cart route - User:', req.session.user?.username);
    console.log('Cart route - Token exists:', !!req.session.accessToken);
    
    // Make API request with token
    const response = await axios.get('http://localhost:3001/api/cart', {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`
      }
    });
    
    console.log('Cart API response:', response.status);
    
    // Render the cart view with the cart data
    res.render('user/cart', {
      user: req.session.user,
      cart: response.data.data.cart || { items: [] }
    });
  } catch (error) {
    console.error('Error fetching cart:', error.message);
    
    // If unauthorized, redirect to login
    if (error.response && error.response.status === 401) {
      return res.redirect('/login?message=Your session has expired. Please log in again.');
    }
    
    // Otherwise render cart with error
    res.render('user/cart', {
      user: req.session.user,
      cart: { items: [] },
      error: 'Failed to load cart'
    });
  }
});

// Add item to cart
router.post('/add', isAuthenticated, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    const response = await axios.post('http://localhost:3001/api/cart/add', 
      { productId, quantity },
      { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
    );
    
    res.json({
      success: true,
      message: 'Product added to cart',
      data: response.data.data
    });
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.data?.Result || 'Failed to add product to cart'
    });
  }
});

// Update cart item
router.post('/update', isAuthenticated, async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;
    
    const response = await axios.put('http://localhost:3001/api/cart/update',
      { cartItemId, quantity },
      { headers: { Authorization: `Bearer ${req.session.accessToken}` } }
    );
    
    res.redirect('/cart');
  } catch (error) {
    console.error('Error updating cart item:', error.message);
    res.redirect('/cart');
  }
});

// Remove item from cart
router.post('/remove', isAuthenticated, async (req, res) => {
  try {
    const { cartItemId } = req.body;
    
    await axios.delete(`'http://localhost:3001/api/cart/remove/${cartItemId}`, {
      headers: { Authorization: `Bearer ${req.session.accessToken}` }
    });
    
    res.redirect('/cart');
  } catch (error) {
    console.error('Error removing from cart:', error.message);
    res.redirect('/cart');
  }
});

module.exports = router;