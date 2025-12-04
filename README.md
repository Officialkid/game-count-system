# Game Count System - Backend API

A complete Next.js backend for managing game scoring events with authentication, teams, and live scoreboards.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Vercel Postgres or Neon)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your database credentials
# POSTGRES_URL="postgres://username:password@host:5432/database"
# JWT_SECRET="your-super-secret-jwt-key"

# Run the database schema
# Execute schema.sql against your PostgreSQL database

# Start development server
npm run dev
```

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
