const sequelize = require('../../config/database');

module.exports = {
  async up() {
    try {
      // Disable foreign key checks temporarily
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Drop tables in reverse dependency order
      await sequelize.query('DROP TABLE IF EXISTS order_items');
      await sequelize.query('DROP TABLE IF EXISTS orders');
      await sequelize.query('DROP TABLE IF EXISTS cart_items');
      await sequelize.query('DROP TABLE IF EXISTS carts');
      
      // Re-create the tables in the correct order
      // First orders table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          status VARCHAR(255) NOT NULL DEFAULT 'In Progress',
          totalAmount FLOAT NOT NULL DEFAULT 0.0,
          discountAmount FLOAT NOT NULL DEFAULT 0.0,
          orderNumber VARCHAR(8) NOT NULL UNIQUE,
          membershipStatus VARCHAR(255) NOT NULL DEFAULT 'Bronze',
          membershipDiscount FLOAT NOT NULL DEFAULT 0.0,
          paymentDetails TEXT,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id)
        )
      `);
      console.log('Created orders table');
      
      // Then order_items table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          orderId INT NOT NULL,
          productId INT NOT NULL,
          quantity INT NOT NULL,
          price FLOAT NOT NULL,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL,
          FOREIGN KEY (orderId) REFERENCES orders(id),
          FOREIGN KEY (productId) REFERENCES products(id)
        )
      `);
      console.log('Created order_items table');
      
      // Re-enable foreign key checks
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      
      console.log('Successfully fixed table creation order');
      return Promise.resolve();
    } catch (error) {
      console.error('Error fixing table creation order:', error);
      return Promise.reject(error);
    }
  },
  
  async down() {
    try {
      // In the down migration, we don't need to do anything specific
      // since dropping tables is handled elsewhere if needed
      return Promise.resolve();
    } catch (error) {
      console.error('Error in down migration:', error);
      return Promise.reject(error);
    }
  }
};