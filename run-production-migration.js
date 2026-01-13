const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Prefer a provided environment variable so we can run this locally against Render DBs.
const connectionString = process.env.DATABASE_URL || 'postgresql://gamescore_db_user:TiyXzFwjLnBldlu4udBbGypsADDvRzJV@dpg-d5el72juibrs738qii2g-a.oregon-postgres.render.com/gamescore_db';

async function runMigration() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'schema-audit-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running migration...\n');
    console.log('─'.repeat(60));

    // Execute migration
    const result = await client.query(migrationSQL);

    console.log('─'.repeat(60));
    console.log('\n✅ Migration completed successfully!\n');

    // Verify the changes
    console.log('🔍 Verifying migration results...\n');

    // Check events table columns
    const eventsColumnsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_name = 'events'
    `);
    console.log(`✓ Events table columns: ${eventsColumnsResult.rows[0].count}`);

    // Check scores table columns
    const scoresColumnsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_name = 'scores'
    `);
    console.log(`✓ Scores table columns: ${scoresColumnsResult.rows[0].count}`);

    // Check indexes
    const indexesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_indexes 
      WHERE tablename IN ('events', 'scores')
    `);
    console.log(`✓ Total indexes on events/scores: ${indexesResult.rows[0].count}`);

    // Check if new columns exist
    const newColumnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name IN ('events', 'scores')
      AND column_name IN ('is_finalized', 'finalized_at', 'updated_at')
      ORDER BY column_name
    `);
    console.log(`\n✓ New columns added:`);
    newColumnsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

    // Check if trigger exists
    const triggerResult = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name = 'scores_updated_at_trigger'
    `);
    if (triggerResult.rows.length > 0) {
      console.log(`\n✓ Auto-update trigger: scores_updated_at_trigger (active)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION SUCCESSFUL - DATABASE READY FOR PRODUCTION');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

runMigration();
