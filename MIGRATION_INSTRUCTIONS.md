# Database Migration Instructions
## Migration: 003_team_name_uniqueness.sql

**IMPORTANT:** This migration must be run manually on your Render PostgreSQL database.

---

## Steps to Apply Migration

### Option 1: Using Render Dashboard (Recommended)

1. **Log in to Render Dashboard**
   - Go to https://dashboard.render.com
   - Navigate to your PostgreSQL database

2. **Open SQL Shell**
   - Click on your database instance
   - Click "Connect" → "External Connection"
   - Use the provided connection string with psql or a GUI tool

3. **Run Migration**
   ```bash
   psql "postgresql://user:password@host/database?sslmode=require"
   ```
   
   Then paste the contents of `migrations/003_team_name_uniqueness.sql`

### Option 2: Using psql Command Line

```bash
# From your local machine
cd migrations
psql "$POSTGRES_URL" -f 003_team_name_uniqueness.sql
```

Replace `$POSTGRES_URL` with your Render database connection string.

### Option 3: Using pgAdmin or DBeaver

1. Connect to your Render PostgreSQL database
2. Open the SQL query editor
3. Copy and paste the contents of `003_team_name_uniqueness.sql`
4. Execute the query

---

## What This Migration Does

1. **Finds existing duplicates** - Scans for team names that appear multiple times in the same event
2. **Auto-renames duplicates** - Appends numbers (Team 2, Team 3) to make them unique
3. **Creates unique index** - Adds `idx_teams_event_name_unique` on `(event_id, LOWER(team_name))`
4. **Adds performance indexes** - Improves duplicate checking speed
5. **Verifies success** - Confirms no duplicates remain after migration

---

## Expected Output

```
NOTICE:  Renamed duplicate team from "Red Team" to "Red Team 2" in event abc123
NOTICE:  Renamed duplicate team from "Blue Squad" to "Blue Squad 2" in event def456
NOTICE:  Finished renaming duplicate teams
CREATE INDEX
NOTICE:  Migration successful: No duplicate team names found
CREATE INDEX
CREATE INDEX
```

---

## Verification

After running the migration, verify it worked:

```sql
-- Check for any remaining duplicates
SELECT event_id, LOWER(team_name), COUNT(*) as count
FROM teams
GROUP BY event_id, LOWER(team_name)
HAVING COUNT(*) > 1;

-- Should return 0 rows
```

```sql
-- Verify unique index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'teams' 
AND indexname = 'idx_teams_event_name_unique';

-- Should return 1 row showing the index definition
```

---

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove unique index
DROP INDEX IF EXISTS idx_teams_event_name_unique;

-- Remove performance indexes
DROP INDEX IF EXISTS idx_teams_name_lower;
```

**Note:** This will NOT undo the team name changes. You would need to manually restore team names from a backup.

---

## Next Steps

After applying the migration:

1. ✅ Test team creation in the UI
2. ✅ Try creating duplicate team names (should show validation error)
3. ✅ Verify real-time validation works
4. ✅ Check that suggestions appear for duplicates

---

## Troubleshooting

**Error: "duplicate key value violates unique constraint"**
- The migration found duplicates but couldn't rename them
- Check the error message for which teams are duplicated
- Manually rename them or run the DO block again

**Error: "index already exists"**
- The migration was already applied
- Safe to ignore or use `DROP INDEX IF EXISTS` first

**No output/hangs**
- Check database connection
- Ensure you have write permissions
- Try running individual sections of the migration

---

## Support

If you encounter issues:
1. Check Render database logs
2. Verify connection credentials
3. Ensure database is not read-only
4. Contact Render support if migration fails

---

## Files Changed

- `migrations/003_team_name_uniqueness.sql` - Migration script
- `lib/db.ts` - Added `isTeamNameDuplicate()` and `generateTeamNameSuggestions()`
- `app/api/teams/check-name/route.ts` - New endpoint for real-time checking
- `app/api/teams/add/route.ts` - Enhanced with duplicate prevention
- `components/EventSetupWizard.tsx` - Real-time validation UI
- `flow.md` - Updated documentation
- `TEAM_NAME_VALIDATION.md` - Comprehensive feature documentation
