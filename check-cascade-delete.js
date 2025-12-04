#!/usr/bin/env node

/**
 * Find foreign keys without CASCADE DELETE
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const fks = await pool.query(`
      SELECT pg_get_constraintdef(oid) as constraint_def, conname as name, conrelid::regclass as table_name
      FROM pg_constraint
      WHERE contype = 'f'
      ORDER BY conname
    `);

    console.log('=== FOREIGN KEY ANALYSIS ===\n');
    console.log(`Total FK constraints: ${fks.rows.length}\n`);

    const noCascade = fks.rows.filter(row => !row.constraint_def.includes('ON DELETE CASCADE'));
    const withCascade = fks.rows.filter(row => row.constraint_def.includes('ON DELETE CASCADE'));

    console.log(`WITH CASCADE DELETE: ${withCascade.length}`);
    withCascade.forEach(row => {
      console.log(`  ✓ ${row.name}`);
    });

    console.log(`\nWITHOUT CASCADE DELETE: ${noCascade.length}`);
    noCascade.forEach(row => {
      console.log(`  ✗ ${row.name}`);
      console.log(`    Table: ${row.table_name}`);
      console.log(`    Definition: ${row.constraint_def}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
