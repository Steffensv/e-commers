const sequelize = require('../../config/database');

module.exports = {
  async up() {
    try {
      // Check if the column already exists
      const [checkResults] = await sequelize.query(`
        SHOW COLUMNS FROM Products LIKE 'isDeleted'
      `);
      
      if (checkResults.length === 0) {
        // Column doesn't exist, add it
        await sequelize.query(`
          ALTER TABLE Products ADD COLUMN isDeleted BOOLEAN DEFAULT false NOT NULL
        `);
        console.log('Successfully added isDeleted column to Products table');
      } else {
        console.log('isDeleted column already exists in Products table');
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
        SHOW COLUMNS FROM Products LIKE 'isDeleted'
      `);
      
      if (checkResults.length > 0) {
        // Column exists, remove it
        await sequelize.query(`
          ALTER TABLE Products DROP COLUMN isDeleted
        `);
        console.log('Successfully removed isDeleted column from Products table');
      } else {
        console.log('isDeleted column does not exist in Products table');
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error executing migration rollback:', error);
      return Promise.reject(error);
    }
  }
};