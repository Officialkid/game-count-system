const { Client } = require('pg');
const url = 'postgresql://gamescore_db_user:TiyXzFwjLnBldlu4udBbGypsADDvRzJV@dpg-d5el72juibrs738qii2g-a/gamescore_db';
(async () => {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query("SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'events'::regclass AND contype = 'c';");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
})().catch(err => { console.error(err); process.exit(1); });
