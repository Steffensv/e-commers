const resetDatabase = require('../scripts/resetDb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Controller function to handle database reset
const resetDb = async (req, res) => {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        status: 'error',
        statuscode: 403,
        data: { Result: 'Reset operation not allowed in production environment' }
      });
    }

    // Check for admin authentication
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        status: 'error',
        statuscode: 401,
        data: { Result: 'Authentication required' }
      });
    }

    try {
      // Verify token and check if user is admin
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded.isAdmin) {
        return res.status(403).json({
          status: 'error',
          statuscode: 403,
          data: { Result: 'Admin privileges required' }
        });
      }
    } catch (tokenError) {
      return res.status(401).json({
        status: 'error',
        statuscode: 401,
        data: { Result: 'Invalid token' }
      });
    }

    // If code reaches here, user is authenticated admin in development environment
    console.log('Starting database reset via API request...');
    
    // Execute the reset function
    await resetDatabase();
    
    return res.status(200).json({
      status: 'success',
      statuscode: 200,
      data: { Result: 'Database reset completed successfully' }
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return res.status(500).json({
      status: 'error',
      statuscode: 500,
      data: { Result: 'Database reset failed', details: error.message }
    });
  }
};

module.exports = { resetDb };