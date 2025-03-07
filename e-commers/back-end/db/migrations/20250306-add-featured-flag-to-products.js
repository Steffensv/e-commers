const sequelize = require('../../config/database');

module.exports = {
  async up() {
    try {
      // Check if the column already exists
      const [checkResults] = await sequelize.query(`
        SHOW COLUMNS FROM Products LIKE 'isFeatured'
      `);
      
      if (checkResults.length === 0) {
        // Column doesn't exist, add it
        await sequelize.query(`
          ALTER TABLE Products ADD COLUMN isFeatured BOOLEAN DEFAULT false NOT NULL
        `);
        console.log('Successfully added isFeatured column to Products table');
      } else {
        console.log('isFeatured column already exists in Products table');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error executing migration:', error);
      return Promise.reject(error);
    }
  },
  
  async down() {
    try {
      // Check if the column exists before attempting to remove
      const [checkResults] = await sequelize.query(`
        SHOW COLUMNS FROM Products LIKE 'isFeatured'
      `);
      
      if (checkResults.length > 0) {
        // Column exists, remove it
        await sequelize.query(`
          ALTER TABLE Products DROP COLUMN isFeatured
        `);
        console.log('Successfully removed isFeatured column from Products table');
      } else {
        console.log('isFeatured column does not exist in Products table');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error executing migration rollback:', error);
      return Promise.reject(error);
    }
  }
};