const sequelize = require('../config/database');

async function resetDatabase() {
  try {
    // First disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Use a better approach to drop all tables
    await sequelize.query('DROP TABLE IF EXISTS cart_items');
    await sequelize.query('DROP TABLE IF EXISTS carts');
    await sequelize.query('DROP TABLE IF EXISTS order_items');
    await sequelize.query('DROP TABLE IF EXISTS orders');
    await sequelize.query('DROP TABLE IF EXISTS tokens');
    await sequelize.query('DROP TABLE IF EXISTS products');
    await sequelize.query('DROP TABLE IF EXISTS categories');
    await sequelize.query('DROP TABLE IF EXISTS brands');
    await sequelize.query('DROP TABLE IF EXISTS users');
    await sequelize.query('DROP TABLE IF EXISTS roles');
    await sequelize.query('DROP TABLE IF EXISTS memberships');
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('All tables dropped successfully');
    
    // Now sync the models to recreate tables
    await sequelize.sync({ force: true });
    console.log('Database reset complete');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
}

resetDatabase();