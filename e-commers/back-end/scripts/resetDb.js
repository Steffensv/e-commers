const sequelize = require('../config/database');

async function resetDatabase() {
  try {
    console.log("Starting database reset...");
    
    // Disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Get all table names from the database
    const [results] = await sequelize.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'exam_e_commerce'}'`
    );
    
    console.log("Found tables in database:", results.map(r => r.TABLE_NAME));
    
    // Drop tables - using both snake_case and camelCase variants
    // This handles potential discrepancies between model definitions and actual tables
    const tablesToDrop = [
      // Original list
      'cart_items', 'carts', 'order_items', 'orders', 'tokens',
      'products', 'categories', 'brands', 'users', 'roles', 'memberships',
      // Adding camelCase variants
      'cartItems', 'cartitems', 'orderItems', 'orderitems'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`Dropped table ${table}`);
      } catch (dropError) {
        console.warn(`Warning: Could not drop table ${table}:`, dropError.message);
      }
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log("All tables dropped. Re-syncing models...");
    
    // Recreate all tables
    await sequelize.sync({ force: true });
    
    console.log("Database reset complete.");
    return true;
  } catch (error) {
    console.error("Error during database reset:", error);
    throw error;
  }
}

// Check if script is run directly
if (require.main === module) {
  resetDatabase().then(() => {
    console.log("Reset script completed");
    process.exit(0);
  }).catch(err => {
    console.error("Reset script failed:", err);
    process.exit(1);
  });
} else {
  module.exports = resetDatabase;
}