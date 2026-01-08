# Database Migration Instructions

## Issue
The automated migration script cannot connect to the database due to authentication issues.

## Solution Options

### Option 1: Run SQL Manually in Database Client

**If you're using a database GUI (pgAdmin, DBeaver, etc.):**

1. Open your PostgreSQL database client
2. Connect to your database
3. Copy and paste this SQL:

```sql
-- Add is_finalized column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT FALSE;

-- Add finalized_at timestamp
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP;

-- Create index
CREATE INDEX IF NOT EXISTS idx_events_is_finalized ON events(is_finalized);

-- Add comments
COMMENT ON COLUMN events.is_finalized IS 'Whether admin has published final results';
COMMENT ON COLUMN events.finalized_at IS 'Timestamp when event was finalized';
```

4. Execute the SQL
5. Verify columns were added:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('is_finalized', 'finalized_at');
```

### Option 2: Using psql Command Line

**If you have psql installed:**

```bash
# Replace with your actual database connection details
psql -h your-host -U your-username -d your-database -f migrations/add-finalized-column.sql
```

### Option 3: Via Neon/Vercel Dashboard

**If using Neon or Vercel Postgres:**

1. Go to your Neon/Vercel dashboard
2. Navigate to SQL Editor
3. Paste the SQL from Option 1
4. Click "Run"

### Option 4: Fix .env.local and Retry

**Check your `.env.local` file:**

```env
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

Make sure:
- Password is properly quoted if it contains special characters
- No extra spaces
- Connection string format is correct

Then run:
```bash
node run-finalize-migration.js
```

## Verification

After running the migration, verify it worked:

```sql
-- Check columns exist
\d events

-- Or use:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
```

You should see:
- `is_finalized` (boolean, default: false)
- `finalized_at` (timestamp without time zone, nullable)

## What This Migration Does

1. **Adds `is_finalized` column**
   - Type: BOOLEAN
   - Default: FALSE
   - Purpose: Track if admin has published final results

2. **Adds `finalized_at` column**
   - Type: TIMESTAMP
   - Default: NULL
   - Purpose: Record when event was finalized

3. **Creates index**
   - Name: `idx_events_is_finalized`
   - Purpose: Fast queries for finalized/non-finalized events

## Impact

- **Existing events:** Will have `is_finalized = FALSE` by default
- **New events:** Will also default to `is_finalized = FALSE`
- **No data loss:** Safe migration using `IF NOT EXISTS`
- **Backwards compatible:** Existing queries still work

## If Migration Already Applied

If you see errors like "column already exists", the migration may have already been applied. You can check with:

```sql
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'events' 
AND column_name IN ('is_finalized', 'finalized_at');
```

If it returns `2`, the migration is already complete! ✅

## Next Steps

After successful migration:
1. ✅ Columns added
2. ✅ Index created
3. ✅ Application ready to use finalization feature
4. Test the feature in admin panel

## Troubleshooting

**Error: "relation 'events' does not exist"**
- Your database structure may be different
- Check table name is exactly `events`

**Error: "column already exists"**
- Migration already applied (safe to ignore)
- Or remove `IF NOT EXISTS` to see actual error

**Connection errors**
- Check `.env.local` DATABASE_URL
- Verify database is running
- Check firewall/network access
- Verify credentials are correct

## Contact

If you need assistance with the migration, the SQL commands above are ready to copy-paste into any PostgreSQL client. The feature will work immediately after the columns are added.
