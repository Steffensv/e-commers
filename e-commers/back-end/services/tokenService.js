const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate access token
function generateAccessToken(user) {
  // Always use lowercase 'id'
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: '2h' }
  );
}

// Generate refresh token
function generateRefreshToken(user) {
  // Always use lowercase 'id'
  return jwt.sign(
    { 
      id: user.id,
      email: user.email 
    },
    process.env.REFRESH_SECRET || 'your_refresh_secret_key',
    { expiresIn: '7d' }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };