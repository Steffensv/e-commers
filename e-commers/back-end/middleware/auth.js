const jwt = require('jsonwebtoken');
const { User } = require('../models');
require('dotenv').config();

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ status: 'error', statuscode: 401, data: { Result: 'Please authenticate' } });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ status: 'error', statuscode: 401, data: { Result: 'Please authenticate' } });
  }
};

function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.roleId)) {
      return res.status(403).json({ status: 'error', statuscode: 403, data: { Result: 'Access denied' } });
    }
    next();
  };
}

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.accessToken) {
    next();
  } else {
    res.render('/login');
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      // Add an isAdmin property based on the user's role
      req.user.isAdmin = decoded.roleId === 1;
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without setting user
    next();
  }
};


const isAdmin = authorize([1]);


// Token validation middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Auth token received:', token ? token.substring(0, 15) + '...' : 'none');
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        statuscode: 401,
        data: { Result: 'Please authenticate' }
      });
    }
    
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    console.log('Token verified, decoded payload:', decoded);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username
    };
    
    next();
  } catch (error) {
    console.error('Token authentication error:', error.message);
    return res.status(401).json({
      status: 'error',
      statuscode: 401,
      data: { Result: 'Invalid token' }
    });
  }
};

module.exports = { authenticate, authorize, isAdmin, isAuthenticated, authenticateToken, optionalAuth };