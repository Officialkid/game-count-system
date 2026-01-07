# GameScore System

**Event-centric scoring platform for competitions, camps, and tournaments.**

Token-based • No authentication • PostgreSQL • Next.js 14

---

## 🎯 What is GameScore?

GameScore is a **production-ready scoring system** for managing multi-team events:

- ✅ **No user accounts** - Anyone can create an event instantly
- 🔐 **Token-based access** - Secure admin, scorer, and public tokens per event
- 📊 **Live scoreboards** - Real-time public viewing with shareable links
- 📅 **Multi-day support** - Perfect for camps, tournaments, and competitions
- ⏱️ **Auto-cleanup** - Events expire automatically based on retention policy

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Render, Supabase, Neon, or local)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your PostgreSQL connection in .env.local:
# DATABASE_URL=postgresql://user:password@host:5432/database

# Run database migrations
psql $DATABASE_URL < migrations/001_initial_schema.sql

# Start development server
npm run dev
```

### First Event

```bash
# Create your first event
curl -X POST http://localhost:3000/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Camp 2026",
    "mode": "camp",
    "start_at": "2026-06-01T09:00:00Z",
    "retention_policy": "auto_expire",
    "expires_at": "2026-12-31T23:59:59Z"
  }'

# Response includes 3 tokens:
# - admin_token: Full control
# - scorer_token: Add scores/teams
# - public_token: View scoreboard
```

---

## 🗄️ Database Setup

### Step 1: Create PostgreSQL Database

Choose a provider:
- **Render** (recommended): Free tier, auto-backups
- **Supabase**: Generous free tier
- **Neon**: Serverless PostgreSQL
- **Local**: `brew install postgresql` / `apt install postgresql`

### Step 2: Configure Environment Variables

Create `.env.local`:

```env
# PostgreSQL Connection
DATABASE_URL=postgresql://username:password@hostname:5432/database
POSTGRES_URL=postgresql://username:password@hostname:5432/database

# Cron Job Security (optional but recommended)
CRON_SECRET=your-random-secret-here

# Node Environment
NODE_ENV=development
```

### Step 3: Run Migrations

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i migrations/001_initial_schema.sql

# Verify tables
\dt
```

---

## 🔐 Token-Based Access Control

**No authentication required.** Events use three token types:

| Token Type | Access Level | Use Case |
|------------|-------------|----------|
| **Admin** | Full control | Update event, lock days, delete |
| **Scorer** | Add data | Create teams, submit scores |
| **Public** | Read-only | View scoreboard |

### Usage Example

```bash
# Add a team (requires scorer or admin token)
curl -X POST http://localhost:3000/api/teams/add \
  -H "Authorization: Bearer YOUR_SCORER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "event-uuid",
    "name": "Red Dragons",
    "color": "#FF0000"
  }'

# Add a score
curl -X POST http://localhost:3000/api/scores/add \
  -H "Authorization: Bearer YOUR_SCORER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "event-uuid",
    "team_id": "team-uuid",
    "category": "Game 1",
    "points": 50
  }'

# View public scoreboard (no auth)
curl http://localhost:3000/api/public/YOUR_PUBLIC_TOKEN
```

---

## 📚 Database Schema

### Tables

**events**
- `id` UUID (primary key)
- `name` TEXT
- `mode` ENUM ('quick', 'camp', 'advanced')
- `start_at`, `end_at` TIMESTAMP
- `retention_policy` ENUM ('auto_expire', 'manual', 'archive')
- `expires_at` TIMESTAMP
- `admin_token`, `scorer_token`, `public_token` TEXT (unique)
- `status` ENUM ('active', 'completed', 'expired', 'archived')

**event_days**
- `id` UUID (primary key)
- `event_id` UUID → events
- `day_number` INT
- `label` TEXT
- `is_locked` BOOLEAN

**teams**
- `id` UUID (primary key)
- `event_id` UUID → events
- `name` TEXT (unique per event)
- `color`, `avatar_url` TEXT

**scores**
- `id` UUID (primary key)
- `event_id` UUID → events
- `day_id` UUID → event_days (nullable)
- `team_id` UUID → teams
- `category` TEXT
- `points` INT (CHECK >= 0)

💡 **Note:** Team totals are **computed**, not stored. Use `listTeamsWithTotals()` for aggregation.

---

## 🧮 Key Queries

### Team Totals (Leaderboard)

```sql
SELECT 
  t.id, 
  t.name, 
  COALESCE(SUM(s.points), 0) AS total_points
FROM teams t
LEFT JOIN scores s ON s.team_id = t.id
WHERE t.event_id = $1
GROUP BY t.id
ORDER BY total_points DESC;
```

### Day Breakdown

```sql
SELECT 
  d.day_number, 
  t.name AS team_name, 
  SUM(s.points) AS points
FROM scores s
JOIN teams t ON t.id = s.team_id
JOIN event_days d ON d.id = s.day_id
WHERE s.event_id = $1
GROUP BY d.day_number, t.name
ORDER BY d.day_number, points DESC;
```

---

## 📚 API Reference

### Core Endpoints

#### Create Event (Public)
```http
POST /api/events/create
Content-Type: application/json

{
  "name": "Summer Games 2026",
  "mode": "camp",
  "start_at": "2026-06-01T09:00:00Z",
  "end_at": "2026-06-07T17:00:00Z",
  "retention_policy": "auto_expire",
  "expires_at": "2026-12-31T23:59:59Z"
}

Response (201):
{
  "success": true,
  "data": {
    "event_id": "uuid",
    "name": "Summer Games 2026",
    "tokens": {
      "admin": "admin-token-hex",
      "scorer": "scorer-token-hex",
      "public": "public-token-hex"
    }
  }
}
```

#### Add Team
```http
POST /api/teams/add
Authorization: Bearer <scorer-or-admin-token>
Content-Type: application/json

{
  "event_id": "event-uuid",
  "name": "Red Dragons",
  "color": "#FF0000"
}

Response (201):
{
  "success": true,
  "data": {
    "id": "team-uuid",
    "event_id": "event-uuid",
    "name": "Red Dragons",
    "color": "#FF0000"
  }
}
```

#### Add Score
```http
POST /api/scores/add
Authorization: Bearer <scorer-or-admin-token>
Content-Type: application/json

{
  "event_id": "event-uuid",
  "team_id": "team-uuid",
  "day_id": "day-uuid",
  "category": "Game 1",
  "points": 50
}

Response (201):
{
  "success": true,
  "data": {
    "id": "score-uuid",
    "points": 50
  }
}
```

#### Public Scoreboard
```http
GET /api/public/{public-token}

Response (200):
{
  "success": true,
  "data": {
    "event": { ... },
    "teams": [
      {
        "id": "uuid",
        "name": "Red Dragons",
        "total_points": 150
      }
    ],
    "scores": [ ... ],
    "scores_by_day": [ ... ]
  }
}
```

---

## ⏱️ Retention & Cleanup

### Automatic Expiration

Events with `retention_policy = 'auto_expire'` are deleted when `expires_at < NOW()`.

**Cron Job:** `/api/cron/cleanup` runs daily at 2:00 AM UTC (configured in `vercel.json`).

```sql
-- Manual cleanup query
DELETE FROM events
WHERE retention_policy = 'auto_expire'
AND expires_at < NOW();
```

### Retention Policies

| Policy | Behavior |
|--------|----------|
| `auto_expire` | Auto-deleted after `expires_at` |
| `manual` | Never auto-deleted, manual only |
| `archive` | Marked archived, never deleted |

---

## 🧪 Data Access Layer

All database operations are in `lib/db-access.ts`:

```typescript
import { 
  createEvent, 
  getEventByToken,
  addTeam,
  addScore,
  listTeamsWithTotals,
  listScoresByDay 
} from '@/lib/db-access';

// Create event
const event = await createEvent({
  name: "My Event",
  mode: "quick",
  start_at: new Date(),
  retention_policy: "auto_expire",
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

// Verify token
const event = await getEventByToken(token, 'scorer');

// Get leaderboard
const teams = await listTeamsWithTotals(eventId);
```

### Available Functions

**Events:**
- `createEvent(input)` → Event with tokens
- `getEventByToken(token, type)` → Event or null
- `updateEvent(id, input)` → Event
- `deleteEvent(id)` → void

**Teams:**
- `addTeam(input)` → Team
- `updateTeam(id, input)` → Team
- `deleteTeam(id)` → void
- `listTeamsWithTotals(eventId)` → TeamWithTotal[]

**Scores:**
- `addScore(input)` → Score
- `listScores(eventId)` → Score[]
- `listScoresByDay(eventId)` → ScoreByDay[]
- `deleteScore(id)` → void

**Days:**
- `createDayIfNotExists(input)` → EventDay
- `lockEventDay(dayId, isLocked)` → EventDay
- `listEventDays(eventId)` → EventDay[]

**Cleanup:**
- `cleanupExpiredEvents()` → number (deleted count)

---

## 🔒 Security Features

- ✅ **No passwords** - Token-based access only
- ✅ **Event-scoped** - Tokens grant access to single event
- ✅ **Crypto-secure** - Tokens use `crypto.randomBytes()`
- ✅ **Timing-safe** - Token comparison prevents timing attacks
- ✅ **Input validation** - Zod schemas on all inputs
- ✅ **SQL injection** - Parameterized queries only
- ✅ **CASCADE DELETE** - No orphaned records

---

## 🏗️ Project Structure

```
game-count-system/
├── app/
│   └── api/
│       ├── events/create/route.ts
│       ├── teams/add/route.ts
│       ├── scores/add/route.ts
│       ├── public/[token]/route.ts
│       └── cron/cleanup/route.ts
├── lib/
│   ├── db-client.ts         # PostgreSQL connection
│   ├── db-access.ts         # Data access layer
│   ├── db-validations.ts    # Zod schemas
│   └── tokens.ts            # Token generation
├── migrations/
│   └── 001_initial_schema.sql
├── package.json
└── README.md
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "pg": "^8.11.0",
    "zod": "^3.22.4",
    "react": "^18.2.0"
  }
}
```

**Install pg:**
```bash
npm install pg @types/pg
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `CRON_SECRET` (optional)
4. Deploy

### Database Providers

**Render PostgreSQL:**
```bash
# Free tier includes:
- 256 MB RAM
- 1 GB storage
- Auto-backups
- SSL enabled
```

**Supabase:**
```bash
# Free tier includes:
- 500 MB database
- Unlimited API requests
- Auto-scaling
```

**Neon:**
```bash
# Free tier includes:
- 3 GB storage
- Serverless autoscaling
- Branching support
```

---

## 📝 Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@host:5432/db
POSTGRES_URL=postgresql://user:pass@host:5432/db

# Optional
CRON_SECRET=your-secret-here
NODE_ENV=production
```

---

## ✅ Success Criteria

When properly deployed:

- ✅ Any anonymous user can create an event
- ✅ Tokens provide secure, event-scoped access
- ✅ Scores aggregate correctly (no `total_points` column)
- ✅ Multi-day camps work with locked days
- ✅ Events expire automatically based on policy
- ✅ Public scoreboards are shareable and read-only
- ✅ No authentication or user accounts required

---

## 🤝 Contributing

This is production-ready code. When extending:

- ✅ Use TypeScript everywhere
- ✅ Validate inputs with Zod
- ✅ Use parameterized queries (never string concat)
- ✅ Test token verification
- ✅ Document API changes

---

## 📄 License

MIT

---

**Built with:** Next.js 14 • PostgreSQL • TypeScript • Zod
