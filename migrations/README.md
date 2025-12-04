# Database Migration Instructions

## How to Apply These Migrations

You need to run these SQL migrations on your PostgreSQL database to add the new event date and status features.

### Option 1: Using psql Command Line

```bash
# Connect to your database
psql "postgresql://game_count_system_user:***@dpg-d4o1jli4d50c73a62no0-a.oregon-postgres.render.com/game_count_system?ssl=true"

# Run migration 001
\i migrations/001_add_event_dates.sql

# Run migration 002
\i migrations/002_add_event_status.sql
```

### Option 2: Using Render Dashboard

1. Go to https://dashboard.render.com
2. Navigate to your PostgreSQL instance
3. Click "Shell" tab
4. Copy and paste the contents of each migration file and execute

### Option 3: Using a Database GUI (Recommended)

1. Use a tool like DBeaver, pgAdmin, or TablePlus
2. Connect to your database with the connection string
3. Open a SQL editor and run each migration file in order

## Migration Files

### 001_add_event_dates.sql
- Adds `start_date` and `end_date` columns to events table
- Adds constraint to ensure end_date >= start_date
- Creates index on end_date for performance

### 002_add_event_status.sql
- Adds `status` column (active/inactive) to events table
- Creates index on status for filtering
- Sets default status to 'active'

## Setting Up Auto-Deactivation

After running migrations, set up a daily cron job to auto-deactivate expired events:

### Using Render Cron Jobs (Recommended for Render hosting)

1. In Render dashboard, go to your web service
2. Add a Cron Job:
   - **Name**: Deactivate Expired Events
   - **Schedule**: `0 0 * * *` (daily at midnight)
   - **Command**: `curl -X POST https://game-count-system.onrender.com/api/cron/deactivate-expired-events -H "Authorization: Bearer YOUR_CRON_SECRET"`
3. Add environment variable:
   - **Key**: `CRON_SECRET`
   - **Value**: Generate a random secret (e.g., `openssl rand -hex 32`)

### Using GitHub Actions (Alternative)

Create `.github/workflows/deactivate-events.yml`:

```yaml
name: Deactivate Expired Events
on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  deactivate:
    runs-on: ubuntu-latest
    steps:
      - name: Call deactivation endpoint
        run: |
          curl -X POST https://game-count-system.onrender.com/api/cron/deactivate-expired-events \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Then add `CRON_SECRET` to your GitHub repository secrets.

## Verifying Migrations

After running migrations, verify with:

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('start_date', 'end_date', 'status');

-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'events';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'events';
```
