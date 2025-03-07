const fs = require('fs');
const path = require('path');

// Migration tracking file
const MIGRATION_TRACKER_FILE = path.join(__dirname, '..', 'migrations', '.migrations-run.json');
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// Initialize or read the migration tracker
function getMigrationsRun() {
  if (fs.existsSync(MIGRATION_TRACKER_FILE)) {
    return JSON.parse(fs.readFileSync(MIGRATION_TRACKER_FILE, 'utf8'));
  }
  return [];
}

// Save completed migrations
function saveMigrationsRun(migrations) {
  // Create directory if it doesn't exist
  if (!fs.existsSync(path.dirname(MIGRATION_TRACKER_FILE))) {
    fs.mkdirSync(path.dirname(MIGRATION_TRACKER_FILE), { recursive: true });
  }
  fs.writeFileSync(MIGRATION_TRACKER_FILE, JSON.stringify(migrations, null, 2));
}

// Run all pending migrations
async function runMigrations() {
  // Create migrations directory if it doesn't exist
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    console.log(`Created migrations directory at: ${MIGRATIONS_DIR}`);
  }
  
  const migrationsRun = getMigrationsRun();
  
  // Get all migration files
  const allMigrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.js') && !file.startsWith('.'))
    .sort();
    
  // Filter out already run migrations
  const pendingMigrations = allMigrationFiles
    .filter(file => !migrationsRun.includes(file));
  
  if (pendingMigrations.length === 0) {
    console.log('No pending migrations to run');
    return;
  }
  
  console.log(`Found ${pendingMigrations.length} pending migrations`);
  
  // Run each migration
  for (const file of pendingMigrations) {
    console.log(`Running migration: ${file}`);
    const migration = require(path.join(MIGRATIONS_DIR, file));
    
    try {
      await migration.up();
      
      // Mark this migration as completed
      migrationsRun.push(file);
      saveMigrationsRun(migrationsRun);
      
      console.log(`Migration ${file} completed successfully`);
    } catch (error) {
      console.error(`Error running migration ${file}:`, error);
      process.exit(1);
    }
  }
  
  console.log('All migrations completed successfully');
}

// Rollback the last run migration
async function rollbackLastMigration() {
  const migrationsRun = getMigrationsRun();
  
  if (migrationsRun.length === 0) {
    console.log('No migrations to roll back');
    return;
  }
  
  const lastMigration = migrationsRun.pop();
  console.log(`Rolling back migration: ${lastMigration}`);
  
  const migration = require(path.join(MIGRATIONS_DIR, lastMigration));
  
  try {
    await migration.down();
    saveMigrationsRun(migrationsRun);
    console.log(`Migration ${lastMigration} rolled back successfully`);
  } catch (error) {
    console.error(`Error rolling back migration ${lastMigration}:`, error);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];

if (command === 'rollback') {
  rollbackLastMigration();
} else {
  runMigrations();
}