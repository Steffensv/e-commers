const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAdmin = require('../../back-end/middleware/auth').isAdmin;
const isAuthenticated = require('../../back-end/middleware/auth').isAuthenticated;

router.get('/:orderId/confirmation', isAuthenticated, async (req, res) => {
  try {
    const { orderId } = req.params;
    const accessToken = req.session.accessToken;
    
    // Get order details
    const response = await axios.get(`http://localhost:3001/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const order = response.data.data.order;
    
    // Render confirmation page
    res.render('user/orderConf', { order });
  } catch (error) {
    console.error('Error fetching order confirmation:', error);
    res.redirect('/products');
  }
});

// Get all orders
router.get('/', isAdmin, async (req, res) => {
  try {
    const response = await axios.get('http://localhost:3001/orders');
    res.render('orders', { orders: response.data.data.orders });
  } catch (error) {
    res.render('orders', { error: 'Error fetching orders' });
  }
});

// Update an existing order
router.post('/update/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await axios.put(`http://localhost:3001/api/orders/${orderId}`, { status });
    res.redirect('/orders');
  } catch (error) {
    res.render('orders', { error: 'Error updating order' });
  }
});

module.exports = router;