const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const sqlPath = path.join(__dirname, '..', 'migrations', 'schema-audit-migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({
    connectionString: 'postgresql://gamescore_db_user:TiyXzFwjLnBldlu4udBbGypsADDvRzJV@dpg-d5el72juibrs738qii2g-a.oregon-postgres.render.com:5432/gamescore_db',
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    await client.query(sql);
    console.log('migration applied');
  } catch (err) {
    console.error('migration failed');
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
