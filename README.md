# Game Count System

A complete Next.js application for managing game scoring events with authentication, teams, and live scoreboards.

**Status:** Migrating from PostgreSQL to Appwrite  
**Current Mode:** Frontend fully functional with mock data (isolation mode)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Appwrite account (Cloud or self-hosted)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your Appwrite credentials to .env.local:
# NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
# NEXT_PUBLIC_APPWRITE_PROJECT=your-project-id
# APPWRITE_API_KEY=your-server-api-key

# Start development server
npm run dev
```

## 🔧 Appwrite Setup

### Step 1: Create Appwrite Project

1. Go to [Appwrite Cloud](https://cloud.appwrite.io/) or your self-hosted instance
2. Create a new project
3. Copy your **Project ID** and **Endpoint URL**

### Step 2: Configure Environment Variables

Create `.env.local` in the project root:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=694164500028df77ada9
APPWRITE_API_KEY=your-server-api-key-here

# Auth Toggle
# When true, the app uses Appwrite-based auth (Account SDK)
# When false (default previously), it uses mock auth in isolation mode
NEXT_PUBLIC_USE_APPWRITE=true
```

**Important:**
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe for endpoint/project ID)
- `APPWRITE_API_KEY` is **server-only** and must never be exposed to the client

### Step 3: Set Up Database Collections

Create the following collections in your Appwrite project:

**Database ID:** `main`

**Collections:**

1. **users** - User profiles
   - Attributes: `name` (string), `email` (string), `role` (string)
   - Indexes: `email` (unique)

2. **events** - Scoring events
   - Attributes: `user_id`, `event_name`, `theme_color`, `logo_url`, `allow_negative`, `display_mode`, `num_teams`, `status`
   - Indexes: `user_id`, `status`

3. **teams** - Event teams
   - Attributes: `event_id`, `team_name`, `avatar_url`, `total_points`
   - Indexes: `event_id`

4. **scores** - Game scores
   - Attributes: `event_id`, `team_id`, `game_number`, `points`
   - Indexes: `event_id`, `team_id`

5. **share_links** - Public scoreboard tokens
   - Attributes: `event_id`, `token`, `is_active`
   - Indexes: `token` (unique), `event_id`

6. **event_admins** - Multi-user event permissions
   - Attributes: `event_id`, `user_id`, `role`
   - Indexes: `event_id`, `user_id`

### Step 4: Set Up Storage Buckets

Create the following storage buckets:

1. **avatars** - Team avatar images
   - Max file size: 2MB
   - Allowed extensions: jpg, png, gif, webp

2. **logos** - Event logo images
   - Max file size: 5MB
   - Allowed extensions: jpg, png, svg, webp

### Step 5: Configure Permissions

Set appropriate permissions for each collection and bucket based on your security requirements. See `APPWRITE_CONTRACT.md` for detailed permission schemas.

## 🏗️ SDK Wrapper

The Appwrite SDK is configured in `lib/appwrite.ts`:

```typescript
import { client, account, databases, storage, functions } from '@/lib/appwrite';

// Client-side usage
const user = await account.get();

// Server-side usage (API routes only)
import { getServerClient } from '@/lib/appwrite';
const { databases } = getServerClient();
```

## 🔐 Auth Toggle (Phase B)

- The app can switch between mock auth and Appwrite auth via `NEXT_PUBLIC_USE_APPWRITE`.
- When `true`, the following are used:
  - `lib/appwriteAuth.ts` for `login`, `register`, `logout`, `getCurrentUser`
  - `lib/auth-context.tsx` switches to session-based auth (no localStorage token)
- When `false`, the mock isolation auth remains active for offline development.

Existing UI and components do not change — the `AuthContext` API stays the same.

## 📚 API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: {
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
    "token": "jwt-token"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: {
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "john@example.com" },
    "token": "jwt-token"
  }
}
```

### Events

#### Create Event
```http
POST /api/events/create
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "event_name": "Summer Games 2025"
}

Response: {
  "success": true,
  "data": {
    "event": { "id": "uuid", "event_name": "Summer Games 2025" },
    "share_token": "public-share-token"
  }
}
```

#### List Events
```http
GET /api/events/list
Authorization: Bearer <jwt-token>

Response: {
  "success": true,
  "data": {
    "events": [
      { "id": "uuid", "event_name": "Summer Games 2025", "share_token": "..." }
    ]
  }
}
```

### Teams

#### Add Team
```http
POST /api/teams/add
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "event_id": "event-uuid",
  "team_name": "Red Dragons",
  "avatar_url": "https://example.com/avatar.png" // optional
}

Response: {
  "success": true,
  "data": {
    "team": { "id": "uuid", "team_name": "Red Dragons", "total_points": 0 }
  }
}
```

#### List Teams
```http
GET /api/teams/list?event_id=event-uuid
Authorization: Bearer <jwt-token>

Response: {
  "success": true,
  "data": {
    "teams": [
      { "id": "uuid", "team_name": "Red Dragons", "total_points": 150 }
    ]
  }
}
```

### Scores

#### Add Score
```http
POST /api/scores/add
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "event_id": "event-uuid",
  "team_id": "team-uuid",
  "game_number": 1,
  "points": 50
}

Response: {
  "success": true,
  "data": {
    "score": { "id": "uuid", "game_number": 1, "points": 50 },
    "updated_team": { "id": "uuid", "team_name": "Red Dragons", "total_points": 50 }
  }
}
```

#### Get Scores by Event
```http
GET /api/scores/by-event?event_id=event-uuid
Authorization: Bearer <jwt-token>

Response: {
  "success": true,
  "data": {
    "scores": [
      { "team_name": "Red Dragons", "game_number": 1, "points": 50 }
    ]
  }
}
```

### Public Scoreboard

#### Get Public Scoreboard
```http
GET /api/public/{share-token}

Response: {
  "success": true,
  "data": {
    "event": { "id": "uuid", "event_name": "Summer Games 2025" },
    "teams": [
      { "team_name": "Red Dragons", "total_points": 150, "avatar_url": "..." }
    ],
    "scores": [
      { "team_name": "Red Dragons", "game_number": 1, "points": 50 }
    ]
  }
}
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: 7-day expiration tokens
- **Input Validation**: Zod schemas for all endpoints
- **SQL Injection Protection**: Prepared statements via Vercel Postgres
- **Authorization**: User ownership verification for all protected resources

## 🗄️ Database

The system uses PostgreSQL with:
- UUID primary keys
- CASCADE DELETE for referential integrity
- Automatic `total_points` calculation via database triggers
- Indexed queries for optimal performance

## 🏗️ Project Structure

```
game-count-system/
├── app/
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   └── login/route.ts
│       ├── events/
│       │   ├── create/route.ts
│       │   └── list/route.ts
│       ├── teams/
│       │   ├── add/route.ts
│       │   └── list/route.ts
│       ├── scores/
│       │   ├── add/route.ts
│       │   └── by-event/route.ts
│       └── public/
│           └── [token]/route.ts
├── lib/
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database queries
│   ├── middleware.ts    # Auth middleware
│   ├── types.ts         # TypeScript types
│   └── validations.ts   # Zod schemas
├── schema.sql           # PostgreSQL schema
├── package.json
└── tsconfig.json
```

## 📦 Dependencies

- **next**: Next.js framework
- **@vercel/postgres**: PostgreSQL client
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT tokens
- **zod**: Input validation
- **nanoid**: Unique token generation

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Environment Variables

```env
POSTGRES_URL=postgres://...
JWT_SECRET=your-secret-key
NODE_ENV=production
```

## 📝 Notes

- All authenticated endpoints require `Authorization: Bearer <token>` header
- Team `total_points` is automatically calculated by database triggers
- Share tokens are generated using nanoid for public scoreboard access
- All timestamps use UTC timezone

## 🤝 Contributing

This is a production-ready backend. Ensure all new endpoints include:
- Authentication/authorization checks
- Input validation with Zod
- Proper error handling
- TypeScript types
