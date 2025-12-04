// scripts/run-migration.js
// Script to run SQL migrations against the database
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('Usage: node scripts/run-migration.js <migration-file>');
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, '..', migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  const dbUrl = process.env.DATABASE_URL;
  const useSSL = dbUrl && (dbUrl.includes('render.com') || dbUrl.includes('amazonaws.com'));
  
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log(`Running migration: ${migrationFile}`);
    await pool.query(sql);
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
