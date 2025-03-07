const express = require('express');
const axios = require('axios');
const router = express.Router();

// Forward search requests to backend
router.post('/search', async (req, res) => {
  try {
    const { query, type } = req.body;
    const token = req.session.accessToken;
    
    const response = await axios.post('http://localhost:3001/api/search', 
      { query, type },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding search request:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error performing search',
      details: error.message
    });
  }
});

module.exports = router;