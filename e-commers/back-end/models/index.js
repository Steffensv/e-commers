const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const basename = path.basename(__filename);
const db = {};

// Load models dynamically
fs.readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    } catch (err) {
      console.error(`Error loading model from file ${file}:`, err);
    }
  });

// Debug output for loaded models
console.log('Models loaded:', Object.keys(db));

// Log model methods for verification
Object.keys(db).forEach(modelName => {
  if (db[modelName]) {
    console.log(`Model ${modelName} methods:`, 
      typeof db[modelName].findOne === 'function' ? 'has findOne' : 'NO findOne',
      typeof db[modelName].create === 'function' ? 'has create' : 'NO create'
    );
  }
});

// Set up associations if they exist
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
      console.log(`Associations set up for ${modelName}`);
    } catch (err) {
      console.error(`Error setting up associations for ${modelName}:`, err);
    }
  }
});

// Add Sequelize instance and constructor to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Manual associations as fallback if the associate methods don't work
try {
  // Make sure each model has proper associations
  if (db.User && db.Role && !db.User._isAssociated) {
    db.User.belongsTo(db.Role, { foreignKey: 'roleId' });
    db.User._isAssociated = true;
  }
  
  if (db.User && db.Membership && !db.Membership._isAssociated) {
    db.User.hasOne(db.Membership, { foreignKey: 'userId' });
    db.Membership.belongsTo(db.User, { foreignKey: 'userId' });
    db.Membership._isAssociated = true;
  }
  
  if (db.Cart && db.User && db.CartItem && !db.Cart._isAssociated) {
    db.Cart.belongsTo(db.User, { foreignKey: 'userId' });
    db.Cart.hasMany(db.CartItem, { foreignKey: 'cartId', onDelete: 'CASCADE' });
    db.Cart._isAssociated = true;
  }
  
  if (db.CartItem && db.Product && db.Cart && !db.CartItem._isAssociated) {
    db.CartItem.belongsTo(db.Product, { foreignKey: 'productId' });
    db.CartItem.belongsTo(db.Cart, { foreignKey: 'cartId' });
    db.CartItem._isAssociated = true;
  }
  
  if (db.Order && db.User && db.OrderItem && !db.Order._isAssociated) {
    db.Order.belongsTo(db.User, { foreignKey: 'userId' });
    db.Order.hasMany(db.OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
    db.Order._isAssociated = true;
  }
  
  if (db.OrderItem && db.Product && db.Order && !db.OrderItem._isAssociated) {
    db.OrderItem.belongsTo(db.Product, { foreignKey: 'productId' });
    db.OrderItem.belongsTo(db.Order, { foreignKey: 'orderId' });
    db.OrderItem._isAssociated = true;
  }

  // Product associations
  if (db.Product && db.Category && db.Brand && !db.Product._isAssociated) {
    db.Product.belongsTo(db.Category, { foreignKey: 'categoryId' });
    db.Product.belongsTo(db.Brand, { foreignKey: 'brandId' });
    db.Product._isAssociated = true;
  }
  
  console.log('Manual associations completed as fallback');
} catch (error) {
  console.error('Error setting up manual associations:', error);
}

module.exports = db;