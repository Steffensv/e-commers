const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAuthenticated = require('../../back-end/middleware/auth').isAuthenticated;


// GET checkout page
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const accessToken = req.session.accessToken;
    
    // Get cart contents
    const cartResponse = await axios.get('http://localhost:3001/cart', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const cart = cartResponse.data.data.cart;
    
    // If cart is empty render back to.. views/user/dashboard
    if (!cart.items || cart.items.length === 0) {
      return res.render('../views/user/dashboard');
    }
    
    // Render checkout page with cart data - updated path
    res.render('user/checkout', { cart });
  } catch (error) {
    console.error('Error fetching cart for checkout:', error);
    res.render('../views/user/dashboard');
  }
});

// POST to process payment and create order
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const accessToken = req.session.accessToken;
    const { cardNumber, cardName, expiry, cvv } = req.body;
    
    // Submit payment to backend
    const response = await axios.post('http://localhost:3001/orders', 
      { 
        paymentDetails: {
          cardNumber,
          name: cardName,
          expiry,
          cvv
        }
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    // If payment successful, render to order confirmation
    if (response.data && response.data.status === 'success') {
      const orderId = response.data.data.order.id;
      res.render(`/orders/${orderId}/confirmation`);
    } else {
      throw new Error('Payment processing failed');
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    
    // Get detailed error message if available
    let errorMessage = 'Payment processing failed';
    if (error.response && error.response.data && error.response.data.data) {
      errorMessage = error.response.data.data.Result || error.response.data.data.details || errorMessage;
    }
    
    // Re-fetch cart to redisplay checkout page with error
    try {
      const accessToken = req.session.accessToken;
      const cartResponse = await axios.get('http://localhost:3001/cart', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const cart = cartResponse.data.data.cart;
      res.render('user/checkout', { cart, error: errorMessage });
    } catch (cartError) {
      res.render('../views/user/dashboard');
    }
  }
});

// GET order confirmation page - updated route path
router.get('/:orderId/confirmation', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;
    const accessToken = req.session.accessToken;
    
    // Get order details
    const response = await axios.get(`http://localhost:3001/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const order = response.data.data.order;
    
    // Updated to use the correct template path
    res.render('user/orderConf', { order });
  } catch (error) {
    console.error('Error fetching order confirmation:', error);
    res.render('../views/user/dashboard');
  }
});

module.exports = router;