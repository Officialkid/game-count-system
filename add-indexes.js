// add-indexes.js
require('dotenv').config();
const { Client } = require('pg');

async function addIndexes() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('🔗 Connected to database\n');

    // Check existing indexes
    console.log('📊 Checking existing indexes...\n');
    const existingIndexes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('events', 'teams', 'game_scores', 'share_links')
      ORDER BY tablename, indexname
    `);
    
    console.log('Existing indexes:');
    existingIndexes.rows.forEach(row => {
      console.log(`  - ${row.tablename}.${row.indexname}`);
    });
    console.log();

    // Create indexes
    const indexes = [
      {
        name: 'idx_events_user_id',
        table: 'events',
        column: 'user_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id)'
      },
      {
        name: 'idx_events_created_at',
        table: 'events',
        column: 'created_at',
        sql: 'CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC)'
      },
      {
        name: 'idx_teams_event_id',
        table: 'teams',
        column: 'event_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_teams_event_id ON teams(event_id)'
      },
      {
        name: 'idx_game_scores_team_id',
        table: 'game_scores',
        column: 'team_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_game_scores_team_id ON game_scores(team_id)'
      },
      {
        name: 'idx_game_scores_event_id',
        table: 'game_scores',
        column: 'event_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_game_scores_event_id ON game_scores(event_id)'
      },
      {
        name: 'idx_game_scores_game_number',
        table: 'game_scores',
        column: 'game_number',
        sql: 'CREATE INDEX IF NOT EXISTS idx_game_scores_game_number ON game_scores(event_id, game_number)'
      },
      {
        name: 'idx_share_links_token',
        table: 'share_links',
        column: 'token',
        sql: 'CREATE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token)'
      },
      {
        name: 'idx_share_links_event_id',
        table: 'share_links',
        column: 'event_id',
        sql: 'CREATE INDEX IF NOT EXISTS idx_share_links_event_id ON share_links(event_id)'
      },
    ];

    console.log('🔨 Creating performance indexes...\n');
    
    for (const index of indexes) {
      try {
        await client.query(index.sql);
        console.log(`✅ Created: ${index.name} on ${index.table}(${index.column})`);
      } catch (error) {
        if (error.code === '42P07') {
          console.log(`⏭️  Skipped: ${index.name} (already exists)`);
        } else {
          console.error(`❌ Failed: ${index.name} - ${error.message}`);
        }
      }
    }

    console.log('\n📊 Final indexes:');
    const finalIndexes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('events', 'teams', 'game_scores', 'share_links')
      ORDER BY tablename, indexname
    `);
    
    finalIndexes.rows.forEach(row => {
      console.log(`  - ${row.tablename}.${row.indexname}`);
    });

    console.log('\n✅ Index creation complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
    process.exit();
  }
}

addIndexes();
