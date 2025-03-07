const { Sequelize } = require('sequelize');
require('dotenv').config();

// Custom logger that only logs errors
const customLogger = (msg) => {
  // Only log errors, not regular queries
  if (msg.includes('ERROR') || msg.includes('error')) {
    console.error(msg);
  }
};

const sequelize = new Sequelize(
  process.env.DB_NAME || 'e-commerce',
  process.env.DB_USER || 'ProjectAdmin',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? customLogger : false, // Disable or customize logging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;