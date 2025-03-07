const fs = require('fs');
const path = require('path');

// Get migration name from command line args
const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Please provide a migration name. Example: npm run migrate:create add-status-to-orders');
  process.exit(1);
}

// Create timestamp
const now = new Date();
const timestamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0')
].join('');

// Create migration filename
const filename = `${timestamp}-${migrationName}.js`;

// Create migrations directory if it doesn't exist
const migrationsDir = path.join(__dirname, '..', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Migration template
const template = `const sequelize = require('../../config/database');

module.exports = {
  async up() {
    try {
      // Write your migration code here
      // For example:
      // await sequelize.query(\`
      //   ALTER TABLE TableName ADD COLUMN ColumnName VARCHAR(255)
      // \`);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error executing migration:', error);
      return Promise.reject(error);
    }
  },
  
  async down() {
    try {
      // Write your rollback code here
      // For example:
      // await sequelize.query(\`
      //   ALTER TABLE TableName DROP COLUMN IF EXISTS ColumnName
      // \`);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error executing migration rollback:', error);
      return Promise.reject(error);
    }
  }
};
`;

// Write the migration file
const filePath = path.join(migrationsDir, filename);
fs.writeFileSync(filePath, template);

console.log(`Created migration file: ${filename}`);
console.log(`Location: ${filePath}`);
console.log('Remember to edit the file to add your migration code!');