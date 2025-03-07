const express = require('express');
const axios = require('axios');
const router = express.Router();

// Test JWT token endpoint
router.get('/check-token', async (req, res) => {
  try {
    // Send JSON content type
    res.setHeader('Content-Type', 'application/json');
    
    const accessToken = req.session.accessToken || req.session.token;
    
    if (!accessToken) {
      return res.json({
        valid: false,
        message: 'No token found in session',
        sessionData: {
          hasUser: !!req.session.user,
          sessionKeys: Object.keys(req.session)
        }
      });
    }
    
    // Get token details without exposing full token
    const tokenInfo = {
      exists: true,
      prefix: accessToken.substring(0, 10) + '...'
    };
    
    try {
      // First, test against a simple verification endpoint
      const verifyResponse = await axios.get('http://localhost:3001/api/cart/verify-token', {
        headers: { 
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      // If verification passed, try the actual cart endpoint
      const cartResponse = await axios.get('http://localhost:3001/api/cart/verify-token', {
        headers: { 
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      return res.json({
        valid: true,
        message: 'Token is valid and working',
        tokenInfo: tokenInfo,
        verifyResponse: verifyResponse.data,
        cartResponse: {
          status: cartResponse.status,
          hasItems: Array.isArray(cartResponse.data?.data?.cart?.items)
        },
        user: req.session.user ? {
          id: req.session.user.id,
          username: req.session.user.username,
          email: req.session.user.email,
          role: req.session.user.role
        } : null
      });
    } catch (error) {
      return res.json({
        valid: false,
        message: 'Token validation failed against backend',
        tokenInfo: tokenInfo,
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        }
      });
    }
  } catch (error) {
    return res.json({
      valid: false,
      message: 'Error in token check route',
      error: error.message
    });
  }
});


module.exports = router;