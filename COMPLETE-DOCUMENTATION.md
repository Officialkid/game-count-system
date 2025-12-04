# Game Count System
## Complete Documentation & User Guide

**Version:** 3.1.0  
**Last Updated:** December 4, 2025  
**Status:** Production-ready (unified public APIs, SSE, caching, rate limiting)

---

## Table of Contents

1. [Overview](#overview)
2. [Recent Updates](#recent-updates)
3. [Features](#features)
4. [Architecture](#architecture)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [User Guide](#user-guide)
8. [API Documentation](#api-documentation)
9. [Database Schema](#database-schema)
10. [Diagnostics & Scripts](#diagnostics--scripts)
11. [Deployment](#deployment)
12. [Future Enhancements](#future-enhancements)
13. [Troubleshooting](#troubleshooting)

---

## Overview

**Game Count System** is a professional event scoring and management platform designed for tracking team-based competitions. It features real-time scoring via SSE, public scoreboards, analytics, CSV/PDF export, LRU caching with TTL, and rate-limited public endpoints.

### Key Capabilities
- **Flexible Team Management:** 2-20 teams per event
- **Advanced Scoring:** Positive/negative points with cumulative/per-game displays
- **Custom Branding:** 12 professional color palettes + custom logos (10MB max)
- **Real-time Updates:** SSE live updates with auto-refresh fallback
- **Secure Authentication:** JWT-based with 15min access tokens, 30-day refresh tokens
- **Public Sharing:** Share links with unique tokens for read-only access
- **Clean Codebase:** Production-ready with no deprecated code
- **Mobile-First Design:** Fully responsive across all devices

---

## Recent Updates

### Version 3.1.0 (December 4, 2025)

#### 🛡️ Public APIs Standardized
- Unified response for `/api/public/[token]` and `/api/public/scoreboard/[token]`: `{ success, data: { event, teams, scores } }`
- Added `/api/public/verify/[token]` for quick token existence checks and event resolution

#### ⚡ Real-time & Performance
- Implemented SSE endpoint: `GET /api/events/[eventId]/stream` with keepalive and cleanup
- Broadcasts score updates; public scoreboard listens and refetches minimally
- LRU caches with TTL; now avoid caching null/undefined to prevent sticky 404s
- Optimized history/leaderboard queries and added indexes

#### 🔒 Rate Limiting
- IP-based rate limiting on public endpoints and SSE to prevent abuse

#### 📈 Analytics & Exports
- Analytics tab with charts and insights helpers
- CSV and PDF exports via server routes

#### 🧰 Developer Experience
- Diagnostics scripts: `check-share-links.js`, `check-tables.js`, `add-indexes.js`, `run-migration.js`
- Standardized logs for token receipt, query results, cache HIT/MISS

#### 🧽 Cleanup
- Removed Cloudinary integration and related env/config
- Removed unused/empty legacy public route folders

### Version 3.0.0 (December 3, 2025)

#### 🎨 Branding System
- **12 Professional Color Palettes:** Purple, Blue, Green, Orange, Red, Pink, Teal, Indigo, Ocean, Sunset, Forest, Professional
- **Color Palette Selector:** Visual dropdown with gradient previews and color swatches
- **Logo Upload Component:** Drag-and-drop support with 10MB max size (PNG/JPG)
- **Dynamic Theming:** Public scoreboards display custom colors and logos
- **Palette System:** Pre-defined color sets for consistent, professional branding

#### 🔐 Authentication Fixes
- Fixed 401 Unauthorized errors on dashboard and event creation
- Resolved timing issues with localStorage token access
- Dashboard now waits for client mount before API calls
- Auto-token inclusion in all API requests (GET/POST methods)

#### 🗑️ Codebase Cleanup
- Removed all unused directories: `examples/`, `sql/`, `scripts/`, `tests/`
- Deleted obsolete files: schema.sql, playwright.config.ts, old documentation
- Eliminated deprecated code and test files without dependencies
- Clean project structure with only production-ready code

#### 🐛 Bug Fixes
- Fixed hydration errors in Navbar (Login vs Dashboard text mismatch)
- Resolved public scoreboard 404 errors (share link token support)
- Fixed unterminated comment syntax error
- Added missing `clearAuth()` export for logout functionality
- Changed `db.addTeam` → `db.createTeam` (correct function name)
- Fixed nodemailer typo: `createTransporter` → `createTransport`
- Resolved APIResponse import issues in API routes

#### 📝 Form Improvements
- Added password confirmation field to registration with validation
- Increased logo upload size from 2MB to 10MB
- Enhanced EventSetupWizard with ColorPaletteSelector and LogoUpload
- Better error messages and validation feedback

#### 🗄️ Database Enhancements
- Added `events.theme_color` column (VARCHAR 50) for palette IDs
- Added `events.logo_url` column (TEXT) for logo URLs
- Increased connection timeout from 2s to 10s (Render compatibility)
- SSL enabled for all environments (production + development)
- Migration successfully executed (57 SQL statements)

---

## Features

### Core Features ✅
- User authentication with JWT (15min access, 30-day refresh)
- Event creation with 2-step wizard
- Team management (2-20 teams) with avatar URLs
- Score submission and tracking
- Automatic total point calculation via database triggers
- Public scoreboard sharing with unique tokens
- Real-time updates via SSE (with 7s fallback refresh)

### Current Capabilities

#### 🔐 Authentication & Security
- **User Registration & Login:** Secure account creation with email/password
- **JWT Authentication:** Access tokens (15min) + refresh tokens (30 days)
- **Password Security:** bcrypt hashing with salt rounds
- **Token Management:** Auto-refresh on expiry, secure localStorage storage
- **Rate Limiting:** Protection against brute force attacks
- **Account Lockout:** Automatic lockout after failed attempts
- **Timing Attack Prevention:** Constant-time password comparison

#### 🎮 Event Management
- **Create Events:** Set up game events with custom names and configurations
- **Variable Team Count:** Support for 2-20 teams per event
- **Custom Branding:** 12 professional color palettes to choose from
- **Logo Upload:** Add event logos up to 10MB (PNG/JPG)
- **Event Settings:** 
  - Allow/disallow negative points
  - Cumulative vs per-day display modes
  - Event descriptions and details
- **Event Dashboard:** View all your events with quick stats
- **Share Links:** Generate public URLs with unique tokens

#### 👥 Team Management
- **Dynamic Teams:** Add teams during event setup or later
- **Team Names:** Custom team names with validation
- **Team Totals:** Automatic calculation of cumulative scores
- **Team Ranking:** Real-time leaderboard based on total points

#### 📊 Score Tracking
- **Multi-Game Support:** Track scores across multiple games
- **Flexible Scoring:** Positive and negative points (configurable)
- **Score History:** Complete audit trail of all score changes
- **Real-time Updates:** Scores update instantly on scoreboard
- **Score Validation:** Ensures data integrity and prevents duplicates

#### 🏆 Public Scoreboard
- **Shareable Links:** Unique URLs for each event
- **Auto-Refresh:** Updates every 10 seconds automatically
- **Custom Branding:** Uses event theme colors and logo
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Game Selection:** Filter scores by specific games
- **Countdown Timer:** Optional countdown display
- **Loading States:** Smooth transitions during data fetches

#### 🎨 Branding System
- **12 Color Palettes:**
  - Purple (default), Blue, Green, Orange, Red, Pink
  - Teal, Indigo, Ocean, Sunset, Forest, Professional
- **Palette Previews:** Visual gradient previews before selection
- **Consistent Theming:** Colors applied across all UI elements
- **Logo Display:** Shows event logo on scoreboard
- **Background Gradients:** Elegant gradient backgrounds per palette

#### 🗄️ Database Features
- **PostgreSQL:** Robust relational database with SSL
- **Connection Pooling:** Efficient resource management (max 10 connections)
- **Optimized Queries:** 10-second timeout for reliability
- **Schema Validation:** Constraints and foreign keys
- **Audit Logging:** Comprehensive change tracking
- **Data Integrity:** Triggers and validations

#### 🔧 Developer Experience
- **TypeScript:** Full type safety across frontend and backend
- **Zod Validation:** Schema validation for all API inputs
- **API Client:** Centralized client with auto-authentication
- **Error Handling:** Comprehensive error messages and recovery
- **Code Organization:** Clean separation of concerns
- **Type Definitions:** Shared interfaces between client/server

---

## Architecture

### Tech Stack
- **Frontend:** Next.js 14.2.33 (App Router), React 18, TypeScript, TailwindCSS
- **Backend:** Next.js API Routes, Node.js 20
- **Database:** PostgreSQL 15+ (Render with SSL)
- **Authentication:** JWT (jsonwebtoken 9.x), bcrypt 5.x
- **Validation:** Zod 3.x
- **File Upload:** Native File API with preview support
- **Deployment:** Self-hosted (Render or similar)

### Project Structure
```
game-count-system/
├── app/
│   ├── api/                   # API Routes
│   │   ├── auth/              # Authentication endpoints
│   │   │   ├── login/         # POST /api/auth/login
│   │   │   ├── register/      # POST /api/auth/register
│   │   │   └── refresh/       # POST /api/auth/refresh
│   │   ├── events/            # Event management
│   │   │   ├── create/        # POST /api/events/create
│   │   │   ├── list/          # GET /api/events/list
│   │   │   ├── update/        # PATCH /api/events/update
│   │   │   └── [eventId]/     # Dynamic event routes
│   │   │       ├── scores/    # POST/GET scores for event
│   │   │       ├── history/   # GET history for event
│   │   │       ├── stream/    # GET SSE stream for event
│   │   │       └── share-link/# GET/POST/DELETE share link
│   │   ├── teams/             # Team management
│   │   │   └── add/           # POST /api/teams/add
│   │   ├── scores/            # Score management
│   │   │   └── add/           # POST /api/scores/add
│   │   └── public/            # Public access
│   │       ├── [token]/             # GET public data (unified)
│   │       ├── scoreboard/[token]/  # GET public scoreboard (unified)
│   │       ├── verify/[token]/      # GET token verification
│   │       └── events/              # GET list of public events
│   ├── dashboard/             # Main dashboard page
│   ├── event/[eventId]/       # Event detail page (tabs: Teams, Scoring, History, Analytics, Settings)
│   ├── login/                 # Login page with form
│   ├── register/              # Registration page with form
│   ├── scoreboard/[token]/    # Public scoreboard viewer (SSE + fallback refresh)
│   ├── layout.tsx             # Root layout with Navbar
│   └── page.tsx               # Landing/home page
├── components/                # React Components
│   ├── Navbar.tsx             # Navigation bar with auth state
│   ├── EventSetupWizard.tsx   # 2-step event creation wizard
│   ├── PublicScoreboard.tsx   # Branded scoreboard (client viewer)
│   ├── ColorPaletteSelector.tsx # Theme palette picker with previews
│   └── LogoUpload.tsx         # Drag-drop logo uploader (10MB max)
├── lib/                       # Utilities & Core Logic
│   ├── db.ts                  # PostgreSQL queries (pg Pool) + helpers
│   ├── auth.ts                # JWT token utilities
│   ├── api-client.ts          # Frontend API client with auto-auth
│   ├── validations.ts         # Zod validation schemas
│   ├── types.ts               # Shared TypeScript interfaces
│   ├── color-palettes.ts      # Color themes (branding)
│   ├── sse.ts                 # In-memory pub/sub for SSE
│   ├── cache.ts               # LRU caches with TTL
│   ├── rate-limit.ts          # IP-based rate limiting
│   └── analytics.ts           # Analytics helpers (insights, charts)
├── migrations/                # Database Migrations
│   └── 2025-12-03-add-branding-columns.sql
├── .vscode/                   # VS Code settings
├── .next/                     # Next.js build output (gitignored)
├── tailwind.config.js         # TailwindCSS configuration
├── next.config.js             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
├── .env.local                 # Environment variables (gitignored)
└── COMPLETE-DOCUMENTATION.md  # This file
```

---

## Installation

### Prerequisites
- Node.js 20.x or higher
- PostgreSQL 15+ database (local or hosted on Render/Vercel)
- npm or yarn package manager
- Git for version control

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd game-count-system
```

### Step 2: Install Dependencies
```bash
npm install
```

This installs:
- Next.js 14.2.33, React 18, TypeScript
- PostgreSQL client (pg 8.x)
- Authentication (jsonwebtoken, bcrypt)
- Validation (zod)
- UI (tailwindcss)

### Step 3: Environment Variables
Create `.env.local` in root directory:
```env
# Database Connection (Use your Render PostgreSQL URL)
POSTGRES_URL="postgresql://user:password@host.oregon-postgres.render.com:5432/database?ssl=true"

# Authentication Secret (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-change-in-production"

# Application Base URL
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Optional: Email Service (for notifications)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="Game Count System <noreply@example.com>"
```

**Security Notes:**
- Never commit `.env.local` to version control
- Generate a strong JWT_SECRET (minimum 32 characters)
- Use SSL connection for production database
- Keep database credentials secure

### Step 4: Database Setup

#### Option A: Using Existing Database (Recommended)
If you already have a Render PostgreSQL database:

```bash
# The database already has all tables and migrations applied
# Just verify connection:
npm run dev
# Check http://localhost:3000/api/auth/login returns 405 (means API is working)
```

#### Option B: Fresh Database Setup
If setting up a new database:

```sql
-- Connect to your database
psql "postgresql://user:password@host:5432/database?ssl=true"

-- Create tables (run migrations in order)
-- 1. Base schema (users, events, teams, scores, share_links)
-- 2. Branding columns migration (theme_color, logo_url)
\i migrations/2025-12-03-add-branding-columns.sql
```

**Database Schema Overview:**
- `users`: User accounts with password hashes
- `events`: Game events with branding (theme_color, logo_url)
- `teams`: Teams associated with events
- `scores`: Individual game scores for teams
- `share_links`: Public access tokens for scoreboards

### Step 5: Run Development Server
```bash
npm run dev
```

Server starts at `http://localhost:3000`

**Expected Output:**
```
  ▲ Next.js 14.2.33
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

### Step 6: Verify Installation

1. **Check API Health:**
   ```bash
   curl http://localhost:3000/api/auth/login
   # Should return: {"error":"Method not allowed"} (405 status)
   ```

2. **Register First User:**
   - Navigate to http://localhost:3000/register
   - Create account (email + password)
   - Should redirect to /login

3. **Create Test Event:**
   - Login at http://localhost:3000/login
   - Go to dashboard
   - Create new event with teams
   - Generate share link
   - View public scoreboard

---

## Configuration

### Color Palettes
Available themes in `lib/color-palettes.ts`:
```typescript
export const COLOR_PALETTES: ColorPalette[] = [
  { id: 'purple', name: 'Purple', ... },
  { id: 'blue', name: 'Blue', ... },
  { id: 'green', name: 'Green', ... },
  // ... 9 more palettes
]
```

Add custom palettes by extending this array.

### Logo Upload Settings
Native file input is supported for logos (PNG/JPG up to 10MB). External cloud storage (e.g., S3, Vercel Blob) can be integrated later; Cloudinary has been removed.

### Event Defaults
Customize in `lib/validations.ts`:
```typescript
export const createEventSchema = z.object({
  theme_color: z.string().default('purple'), // Default palette
  num_teams: z.number().min(2).max(20).default(3),
  display_mode: z.enum(['cumulative', 'per_day']).default('cumulative'),
});
```

### Real-time & Refresh
- Live updates via SSE: `GET /api/events/[eventId]/stream`
- Client hook: `hooks/useEventStream.ts`
- Fallback refresh interval on public scoreboard: 7000ms

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Authentication

**POST /api/auth/register**
```json
// Request
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

// Response (201)
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
    "token": "jwt_token"
  }
}
```

**POST /api/auth/login**
```json
// Request
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}

// Response (200)
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
    "token": "jwt_token"
  }
}
```

#### Events

**POST /api/events/create**
```json
// Request (Auth required)
{
  "event_name": "Jewels Bootcamp Q4 2025",
  "brand_color": "#6b46c1",
  "logo_url": "https://example.com/logo.png",
  "allow_negative": false,
  "display_mode": "cumulative",
  "num_teams": 5
}

// Response (201)
{
  "success": true,
  "data": {
    "event": {
      "id": "uuid",
      "event_name": "Jewels Bootcamp Q4 2025",
      "brand_color": "#6b46c1",
      "num_teams": 5,
      "created_at": "2025-12-03T10:00:00Z"
    },
    "share_token": "abc123xyz"
  }
}
```

**GET /api/events/list** (Auth required)
```json
// Response (200)
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "event_name": "Jewels Bootcamp Q4 2025",
        "brand_color": "#6b46c1",
        "num_teams": 5,
        "created_at": "2025-12-03T10:00:00Z"
      }
    ]
  }
}
```

**POST /api/events/update** (Auth required)
```json
// Request
{
  "event_id": "uuid",
  "event_name": "Updated Event Name",
  "brand_color": "#9b59b6"
}

// Response (200)
{
  "success": true,
  "data": {
    "event": { /* updated event */ }
  }
}
```

#### Teams

**POST /api/events/[eventId]/teams** (Auth required)
```json
// Request
{
  "team_name": "Team Alpha",
  "avatar_url": "https://api.dicebear.com/7.x/shapes/svg?seed=alpha"
}

// Response (201)
{
  "success": true,
  "data": {
    "team": {
      "id": "uuid",
      "team_name": "Team Alpha",
      "total_points": 0
    }
  }
}
```

**GET /api/events/[eventId]/teams**
```json
// Response (200)
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "uuid",
        "team_name": "Team Alpha",
        "avatar_url": "...",
        "total_points": 150
      }
    ]
  }
}
```

#### Scores

**POST /api/events/[eventId]/scores** (Auth required)
```json
// Single Score Request
{
  "team_id": "uuid",
  "game_number": 1,
  "points": 50,
  "submission_id": "optional-idempotency-key"
}

// Batch Scores Request
{
  "scores": [
    { "team_id": "uuid1", "game_number": 1, "points": 50 },
    { "team_id": "uuid2", "game_number": 1, "points": 45 }
  ]
}

// Response (201)
{
  "success": true,
  "data": {
    "score": {
      "id": "uuid",
      "team_id": "uuid",
      "game_number": 1,
      "points": 50,
      "created_at": "2025-12-03T11:00:00Z"
    }
  }
}
```

**GET /api/events/[eventId]/history**
```
GET /api/events/[eventId]/history?page=1&limit=50&team_id=uuid&game_number=1

// Response (200)
{
  "success": true,
  "data": {
    "history": [ /* score objects */ ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "totalPages": 3
    }
  }
}
```

#### Share Links

**GET /api/events/[eventId]/share-link** (Auth required)
```
// Response (200)
{
  "success": true,
  "data": {
    "shareLink": { "share_token": "LTXKa6...", "created_at": "..." }
  }
}
```

**POST /api/events/[eventId]/share-link** (Auth required)
```json
// Response (200)
{
  "success": true,
  "data": {
    "shareLink": {
      "share_token": "abc123xyz",
      "created_at": "2025-12-03T10:00:00Z"
    }
  }
}
```

**DELETE /api/events/[eventId]/share-link** (Auth required)
```json
// Response (200)
{
  "success": true,
  "data": { "message": "Share link deleted successfully" }
}
```

#### Public Scoreboard

**GET /api/public/[token]**
```json
// Response (200) unified
{
  "success": true,
  "data": {
    "event": { "id": "uuid", "event_name": "Event", "theme_color": "purple", "logo_url": null, "created_at": "..." },
    "teams": [ { "id": "uuid", "team_name": "Team Alpha", "total_points": 150 } ],
    "scores": [ { "id": "uuid", "team_id": "uuid", "game_number": 1, "points": 50, "created_at": "..." } ]
  }
}
```

**GET /api/public/scoreboard/[token]**
```json
// Response (200) unified
{
  "success": true,
  "data": { /* same as /api/public/[token] */ }
}
```

**GET /api/public/verify/[token]**
```json
// Response (200)
{
  "success": true,
  "data": { "exists": true, "event": { "id": "uuid", "event_name": "Event" } }
}
```

### Error Responses
All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Database Schema

### Tables

#### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### events
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    theme_color VARCHAR(50) DEFAULT 'purple',
    logo_url VARCHAR(500) NULL,
    allow_negative BOOLEAN DEFAULT FALSE,
    display_mode VARCHAR(20) DEFAULT 'cumulative',
    num_teams INTEGER DEFAULT 3,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### teams
```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    total_points INTEGER DEFAULT 0,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

#### game_scores
```sql
CREATE TABLE game_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    team_id UUID NOT NULL,
    game_number INTEGER NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP WITH TIME ZONE NULL,
    edited_by UUID NULL,
    submission_id VARCHAR(100) NULL UNIQUE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE (event_id, team_id, game_number)
);
```

#### share_links
```sql
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL UNIQUE,
    token VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB NULL,
    new_value JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

#### ai_event_profiles
```sql
CREATE TABLE ai_event_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL UNIQUE,
    mood VARCHAR(50),
    generated_palette JSONB,
    layout_style VARCHAR(50),
    insights TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
```

### Triggers

**Automatic Total Points Update:**
```sql
-- Triggers fire on INSERT/UPDATE/DELETE to game_scores
-- Automatically maintains teams.total_points
```

**Negative Points Validation:**
```sql
-- Trigger validates points against events.allow_negative
-- RAISES EXCEPTION if negative points not allowed
```

**Audit Logging:**
```sql
-- Trigger logs all changes to audit_logs table
-- Stores old_value and new_value as JSONB
```

### Views

**event_summary** - Summary statistics per event  
**team_performance** - Performance metrics per team  
**game_statistics** - Game-level statistics  
**event_analytics** - Materialized view for analytics (refresh periodically)  

### Functions

**get_event_leaderboard(event_id)** - Returns ranked leaderboard  
**get_team_cumulative_history(team_id)** - Returns cumulative score history  
**validate_event_consistency(event_id)** - Validates data integrity  
**refresh_event_analytics()** - Refreshes materialized view  

---

## Diagnostics & Scripts

### Quick Scripts
- `node check-share-links.js`: Lists all rows in `share_links` with tokens and mapped event IDs
- `node check-tables.js`: Verifies required tables/columns exist
- `node add-indexes.js`: Applies performance indexes
- `node run-migration.js`: Runs pending migrations

### Dev Server Reset (Windows PowerShell)
```powershell
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq '' } | Stop-Process -Force
Start-Sleep -Seconds 2
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue
npm run dev
```

### Public Token Sanity Check
1) Verify token exists: `GET /api/public/verify/{token}`  
2) Load data: `GET /api/public/{token}`  
3) Open scoreboard: `/scoreboard/{token}`

If 404 persists, confirm you’re using the share token (short string), not the event ID (UUID).

---

## Testing

### API Integration Tests
```bash
npm run test:api
```

Run tests in `tests/api/*.test.ts` using Jest.

### E2E Tests
```bash
# Install Playwright browsers
npx playwright install

# Run tests
npx playwright test

# Run tests with UI
npx playwright test --ui

# Run specific test
npx playwright test tests/e2e/user-flows.spec.ts
```

### Test Coverage
- ✅ User authentication (register, login)
- ✅ Event creation with EventSetupWizard
- ✅ Score submission and validation
- ✅ Public scoreboard viewing
- ✅ Analytics dashboard
- ✅ Responsive design (mobile, tablet, desktop)

---

## Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel --prod
```

4. **Set Environment Variables:**
Go to Vercel Dashboard → Project → Settings → Environment Variables

Required variables:
- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `JWT_SECRET`
- `NEXT_PUBLIC_BASE_URL`

### Database Setup on Vercel Postgres

1. Create Vercel Postgres database
2. Copy connection string
3. Run migrations:
```bash
# Connect to Vercel Postgres
psql $POSTGRES_URL

# Run all SQL files
\i sql/schema.sql
\i sql/phase2-migration.sql
\i sql/performance-indexes.sql
```

### Post-Deployment Checks
- [ ] Homepage loads correctly
- [ ] Registration/login works
- [ ] Event creation works
- [ ] Score submission works
- [ ] Public scoreboard accessible
- [ ] SSL certificate active
- [ ] Database migrations applied
- [ ] Environment variables set

---

## User Guide

### Getting Started

#### 1. Register Your Account
1. Navigate to http://localhost:3000/register
2. Fill in registration form:
   - **Full Name:** Your display name
   - **Email:** Valid email address (used for login)
   - **Password:** Minimum 6 characters
   - **Confirm Password:** Must match password
3. Click "Register" button
4. You'll be redirected to login page

**Password Requirements:**
- Minimum 6 characters
- Case-sensitive
- Stored securely with bcrypt hashing

#### 2. Login to Dashboard
1. Go to http://localhost:3000/login
2. Enter your email and password
3. Click "Login" button
4. JWT token stored in browser (15min expiry, auto-refresh)
5. Redirected to dashboard at /dashboard

**Session Management:**
- Access tokens expire after 15 minutes
- Refresh tokens last 30 days
- Auto-refresh on API calls
- Logout clears all stored tokens

#### 3. Create Your First Event

**Step 1: Event Details**
1. Click "Create New Event" button on dashboard
2. Fill in event information:
   - **Event Name:** e.g., "Summer Camp 2024"
   - **Number of Teams:** Select 2-20 teams
   - **Description:** Optional event details
3. **Choose Brand Color:**
   - Click on Color Palette Selector dropdown
   - Browse 12 professional themes with gradient previews:
     - Purple (default), Blue, Green, Orange, Red, Pink
     - Teal, Indigo, Ocean, Sunset, Forest, Professional
   - Click on a palette to select it
   - Colors apply to public scoreboard background and UI
4. **Upload Event Logo (Optional):**
   - Click "Choose File" or drag & drop logo
   - Supported formats: PNG, JPG
   - Maximum size: 10MB
   - Preview appears immediately
   - Click "Remove Logo" to change
5. **Event Settings:**
   - ☑️ Allow Negative Points (checked = teams can have negative scores)
   - Display Mode: Cumulative (default) or Per Day
6. Click "Next: Add Teams" button

**Step 2: Add Teams**
1. Enter team names in text inputs
2. Add more teams with "Add Another Team" button
3. Remove teams with trash icon
4. Click "Create Event" button
5. Event created successfully! Redirected to event page

#### 4. Manage Scores

**Adding Scores:**
1. From dashboard, click on your event
2. Select team from dropdown
3. Enter game number (e.g., Game 1, Game 2)
4. Enter points scored (positive or negative if allowed)
5. Click "Add Score" button
6. Score appears in history table
7. Team totals update automatically in leaderboard

**Score Validation:**
- Game number required (1-999)
- Points required (-999 to 999 if negative allowed, otherwise 0-999)
- Duplicate game submissions update existing score
- All changes logged in database audit trail

**Score History:**
- View all scores in chronological order
- Filter by team or game
- See timestamps for each entry
- Track who made changes (user_id)

#### 5. Generate Public Share Link

1. Go to your event page
2. Click "Generate Share Link" button
3. Unique token created (e.g., `abc123xyz456`)
4. Copy URL: `http://localhost:3000/public/abc123xyz456`
5. Share link with participants, audience, or display on projector
6. Anyone with link can view scoreboard (no login required)

**Share Link Features:**
- No expiration (permanent access)
- No authentication required
- Auto-refresh every 10 seconds
- Shows event logo and branded colors
- Responsive on all devices

#### 6. View Public Scoreboard

**Accessing Scoreboard:**
1. Open share link in any browser
2. No login required
3. Works on desktop, tablet, mobile

**Scoreboard Features:**
- **Event Header:** Shows event name and logo (if uploaded)
- **Countdown Timer:** Optional timer display
- **Leaderboard:** Real-time rankings sorted by total points
  - Rank, team name, total points
  - Color-coded by selected theme
- **Game Selection:** Checkboxes to show/hide specific games
- **Auto-Refresh:** Updates every 10 seconds automatically
- **Loading States:** Smooth transitions during data fetches
- **Branded Design:** Uses selected color palette throughout

**Scoreboard Controls:**
- Toggle countdown timer visibility
- Select/deselect specific games to display
- Manual refresh with browser reload

### Advanced Features

#### Event Branding
- **12 Professional Palettes:** Each with coordinated primary, secondary, accent, background, and text colors
- **Logo Display:** Event logo appears prominently on scoreboard
- **Consistent Theming:** Colors applied to headers, buttons, backgrounds, and UI elements
- **Gradient Backgrounds:** Elegant gradients using palette colors

#### Score Management
- **Flexible Scoring:** Enable/disable negative points per event
- **Multiple Games:** Track unlimited games per event
- **Real-time Updates:** Scores sync instantly across all viewers
- **Audit Trail:** Complete history of all score changes

#### Team Management
- **Dynamic Teams:** Add teams during setup or later
- **Custom Names:** Any team name (validated for length)
- **Automatic Ranking:** Teams sorted by total points
- **Team Totals:** Cumulative scores calculated automatically

### Tips & Tricks

**For Event Organizers:**
- Test your share link before sharing with participants
- Upload high-quality logos (up to 10MB) for best display
- Choose color palettes that match your event theme
- Use descriptive event names for easier management
- Enable negative points for penalty-based games

**For Score Entry:**
- Enter scores as games complete for real-time updates
- Use unique game numbers (Game 1, Game 2, Round 1A, etc.)
- Double-check team selection before submitting
- Negative points useful for penalties or deductions

**For Viewers:**
- Bookmark share link for quick access
- Full-screen browser for projector display
- Auto-refresh means no manual reloading needed
- Works offline (shows last loaded data until reconnected)

**Mobile Usage:**
- All features fully responsive
- Scoreboard optimized for portrait and landscape
- Touch-friendly buttons and controls
- Share link via SMS, email, or QR code

**Best Practices:**
- Create events in advance to test setup
- Add all teams before event starts
- Keep team names concise for better display
- Use high-contrast logos for visibility
- Test scoreboard on target display devices

---

## Future Enhancements

### Priority 1: User Experience Improvements

#### 📊 Enhanced Dashboard
- **Quick Stats Widget:** Show total events, teams, and scores at a glance
- **Recent Activity Feed:** List of recently created events and score updates
- **Event Templates:** Save and reuse event configurations (teams, settings)
- **Bulk Event Actions:** Archive, duplicate, or delete multiple events
- **Search & Filter:** Find events by name, date, or status

#### 🎮 Score Management
- **Undo/Redo Scores:** Allow score corrections with history tracking
- **Score Comments:** Add notes/reasons for score changes
- **Score Verification:** Require confirmation for large point changes
- **Batch Import:** Upload CSV file with team names and scores
- **Score Notifications:** Real-time alerts when scores are updated

#### 👥 Team Features
- **Team Profiles:** Add descriptions, members, and photos
- **Team Statistics:** Historical performance across multiple events
- **Team Badges:** Awards for achievements (1st place, most improved, etc.)
- **Team Colors:** Custom colors per team for visual distinction
- **Team QR Codes:** Generate QR codes for quick team check-in

### Priority 2: Analytics & Reporting

#### 📈 Advanced Analytics
- **Performance Trends:** Line charts showing team performance over time
- **Comparison Mode:** Side-by-side team comparisons
- **Leaderboard History:** Track position changes throughout event
- **Peak Performance:** Identify best/worst performing games
- **Prediction Engine:** ML-based predictions for final standings

#### 📄 Reports & Export
- **PDF Reports:** Generate professional event summaries
- **Custom Report Builder:** Choose metrics and visualizations
- **Scheduled Reports:** Email reports automatically at intervals
- **Data Visualization:** More chart types (radar, heatmap, scatter)
- **Multi-Event Reports:** Compare performance across events

### Priority 3: Collaboration Features

#### 👫 Multi-User Support
- **Event Co-Hosts:** Invite others to manage events
- **Role-Based Access:** Admin, Editor, Viewer permissions
- **Live Collaboration:** See who's online and editing scores
- **Activity Log:** Track all changes with user attribution
- **User Profiles:** Avatars, bios, and contact information

#### 💬 Communication
- **In-App Messaging:** Chat with participants and co-hosts
- **Announcements:** Broadcast messages to all event participants
- **Email Notifications:** Configurable alerts for score updates
- **SMS Integration:** Send score updates via text (Twilio)
- **Webhook Support:** Integrate with Slack, Discord, Teams

### Priority 4: Event Management

#### ⚙️ Event Settings
- **Event Scheduling:** Set start/end times with auto-archive
- **Game Rounds:** Define rounds with time limits
- **Bonus Multipliers:** Apply point multipliers to specific games
- **Penalty System:** Automatic deductions for rule violations
- **Custom Fields:** Add event-specific data fields

#### 🏆 Gamification
- **Achievements System:** Unlock badges for milestones
- **Streaks:** Track consecutive wins/point streaks
- **Power-ups:** Temporary bonuses (double points, shields)
- **Challenges:** Mini-competitions within events
- **Rewards Integration:** Connect to prizes/rewards system

### Priority 5: Technical Enhancements

#### 🚀 Performance
- **Real-time Sync:** WebSocket support for instant updates
- **Offline Mode:** Progressive Web App with offline capabilities
- **Caching Strategy:** Redis for faster data retrieval
- **Image Optimization:** Automatic compression and CDN delivery
- **Load Balancing:** Handle high-traffic events

#### 🔒 Security
- **Two-Factor Authentication:** SMS or authenticator app support
- **API Rate Limiting:** Enhanced protection (already basic version)
- **Audit Trail:** Comprehensive logging of all actions
- **Data Encryption:** End-to-end encryption for sensitive data
- **Session Management:** Better control over active sessions

#### 📱 Mobile App
- **Native Apps:** iOS and Android applications
- **Push Notifications:** Native mobile notifications
- **Biometric Login:** Face ID / Touch ID support
- **Camera Integration:** Scan QR codes for quick access
- **Offline Scoring:** Submit scores without internet

### Priority 6: Integrations

#### 🔗 Third-Party Services
- **Cloud Storage:** Upload logos to AWS S3, Cloudinary, or Vercel Blob
- **Payment Integration:** Stripe for paid events or premium features
- **Social Media:** Share results on Twitter, Facebook, LinkedIn
- **Calendar Sync:** Google Calendar, Outlook integration
- **Video Streaming:** Embed live streams on scoreboard

#### 🤖 Automation
- **Zapier Integration:** Connect to 5000+ apps
- **API Webhooks:** Trigger external actions on events
- **Scheduled Tasks:** Automated reminders and reports
- **Auto-Scoring:** Connect to external scoring systems
- **Data Sync:** Two-way sync with external databases

### Quick Wins (Easy Implementations)

1. **Dark Mode Enhancement:** More theme colors beyond current options
2. **Keyboard Shortcuts:** Quick navigation (Ctrl+N for new event, etc.)
3. **Tooltip Help:** Contextual help text throughout the app
4. **Loading Skeletons:** Better loading states instead of spinners
5. **Success Animations:** Celebrate achievements with confetti/animations
6. **Copy to Clipboard:** Quick copy for share links, event IDs
7. **Recent Items:** Dropdown showing recently accessed events
8. **Breadcrumbs:** Better navigation trail
9. **Responsive Tables:** Better mobile table views
10. **Event Archiving:** Soft delete with restore capability
11. **Favicon Updates:** Custom favicon per event branding
12. **Print Styles:** Printer-friendly scoreboard layouts
13. **Color Contrast:** Accessibility improvements for color schemes
14. **Empty States:** Helpful illustrations for empty dashboards
15. **Onboarding Tour:** First-time user walkthrough

### Implementation Roadmap

**Q1 2026:**
- Enhanced dashboard with quick stats
- Score undo/redo functionality
- Team profiles and badges
- PDF report generation

**Q2 2026:**
- Multi-user collaboration
- Role-based permissions
- Real-time WebSocket updates
- Mobile PWA enhancements

**Q3 2026:**
- Native mobile apps (iOS/Android)
- Advanced analytics with ML predictions
- Cloud storage integration for logos
- Payment system for premium features

**Q4 2026:**
- Third-party integrations (Zapier, webhooks)
- Advanced gamification features
- Enterprise features (SSO, white-label)
- API marketplace

---

## Troubleshooting

### Common Issues

**Issue:** "401 Unauthorized on dashboard"
```
Solution:
1. Clear browser cache and localStorage
2. Login again to get fresh token
3. Check that you're logged in (JWT in localStorage)
4. Ensure API client is auto-including token
```

**Issue:** "Failed to connect to database"
```
Solution:
1. Check POSTGRES_URL in .env.local
2. Verify database is running on Render
3. Check firewall settings allow your IP
4. Connection timeout increased to 10s (should work now)
5. Verify SSL is enabled in connection string
```

**Issue:** "Invalid JWT token"
```
Solution:
1. Clear browser localStorage: localStorage.clear()
2. Login again
3. Check JWT_SECRET matches in .env.local
4. Tokens expire after 15 minutes (refresh tokens last 30 days)
```

**Issue:** "Public scoreboard shows 404"
```
Solution:
1. Use share link token, NOT event ID
2. Create share link for event first
3. URL format: /public/[share-token] not /public/[event-id]
4. Check share_links table has entry for event
```

**Issue:** "Logo upload fails"
```
Solution:
1. Maximum file size is 10MB (increased from 2MB)
2. Only PNG and JPG formats supported
3. Check file is not corrupted
4. Logo currently stores as preview URL (implement cloud storage for production)
```

**Issue:** "Theme colors not showing on scoreboard"
```
Solution:
1. Verify theme_color column exists in events table
2. Check API returns theme_color and logo_url
3. Reload public scoreboard page (Ctrl+Shift+R)
4. Clear browser cache if needed
```

**Issue:** "Team totals not updating"
```
Solution:
1. Check database triggers are installed
2. Run: SELECT validate_event_consistency('event-uuid');
3. Manually recalculate: SELECT recalculate_team_total('team-uuid');
```

**Issue:** "Public scoreboard not loading"
```
Solution:
1. Verify share link exists
2. Check token in URL matches database
3. Ensure event hasn't been deleted
```

### Support

For additional support:
- GitHub Issues: [repository-url]/issues
- Email: support@jewelsmentorship.com
- Documentation: This file

---

## Changelog

### Version 2.0.0 (2025-12-03)
- ✅ Complete Phase 2 & 3 implementation
- ✅ Variable team support (2-20 teams)
- ✅ Event customization (brand_color, logo_url)
- ✅ Autosave with debouncing
- ✅ Analytics dashboard with charts
- ✅ Comprehensive test suite
- ✅ Production-ready deployment

### Version 1.0.0 (2025-11-01)
- ✅ Initial MVP release
- ✅ Basic event management
- ✅ Score tracking
- ✅ Public scoreboards

---

## License

© 2025 Jewels Mentorship Bootcamp. All rights reserved.

---

**End of Documentation**
