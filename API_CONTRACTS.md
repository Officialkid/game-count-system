# GameScore API Reference

Complete REST API documentation for the GameScore event scoring system.

---

## 🔐 Authentication

**No user authentication.** All endpoints use **token-based access** via custom headers:

| Header | Purpose | Access Level |
|--------|---------|--------------|
| `X-ADMIN-TOKEN` | Full event control | Create teams, lock days, update event |
| `X-SCORER-TOKEN` | Submit data | Add scores to unlocked days |
| *(none)* | Public read | View scoreboard |

Tokens are **event-scoped** and returned on event creation.

---

## 📡 API Endpoints

### 1. Create Event

**POST /api/events**

Public endpoint - no authentication required.

**Request:**
```json
{
  "name": "Camp Games 2026",
  "mode": "camp",
  "start_at": "2026-01-12T08:00:00Z",
  "end_at": "2026-01-17T18:00:00Z",
  "retention_policy": "manual"
}
```

**Fields:**
- `name`: Event name (string, required)
- `mode`: `"quick"` | `"camp"` | `"advanced"` (required)
- `start_at`: ISO 8601 timestamp (required)
- `end_at`: ISO 8601 timestamp (optional)
- `retention_policy`: `"auto_expire"` | `"manual"` | `"archive"` (required)
- `expires_at`: ISO 8601 timestamp (optional, required if `retention_policy="auto_expire"`)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "event_id": "550e8400-e29b-41d4-a716-446655440000",
    "admin_url": "https://your-app.com/admin/{admin_token}",
    "scorer_url": "https://your-app.com/score/{scorer_token}",
    "public_url": "https://your-app.com/events/{public_token}"
  },
  "error": null
}
```

💡 **Save these URLs!** Tokens cannot be retrieved later.

---

### 2. Add Team

**POST /api/events/{event_id}/teams**

Requires: `X-ADMIN-TOKEN` header

**Request:**
```json
{
  "name": "Red Lions",
  "color": "#ff0000",
  "avatar_url": "https://example.com/avatar.png"
}
```

**Fields:**
- `name`: Team name (string, required, unique per event)
- `color`: Hex color (string, optional)
- `avatar_url`: Image URL (string, optional)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "team-uuid",
    "name": "Red Lions",
    "color": "#ff0000",
    "avatar_url": "https://example.com/avatar.png",
    "created_at": "2026-01-12T08:00:00Z"
  },
  "error": null
}
```

**Errors:**
- `401 UNAUTHORIZED` - Missing `X-ADMIN-TOKEN`
- `403 FORBIDDEN` - Invalid token
- `400 BAD_REQUEST` - Event not active
- `409 CONFLICT` - Team name already exists
- `400 VALIDATION_ERROR` - Invalid input

---

### 3. Submit Score

**POST /api/events/{event_id}/scores**

Requires: `X-SCORER-TOKEN` header

**Request:**
```json
{
  "day_number": 2,
  "team_id": "team-uuid",
  "category": "football",
  "points": 10
}
```

**Fields:**
- `day_number`: Day number (integer, optional for quick events, required for camp)
- `team_id`: Team UUID (string, required)
- `category`: Activity/game name (string, required)
- `points`: Points earned (integer >= 0, required)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "score-uuid",
    "event_id": "event-uuid",
    "day_id": "day-uuid",
    "team_id": "team-uuid",
    "category": "football",
    "points": 10,
    "created_at": "2026-01-12T14:30:00Z"
  },
  "error": null
}
```

**Behavior:**
- ✅ **Auto-creates** `event_day` if `day_number` provided and doesn't exist
- ❌ **Rejects** if day is locked
- ✅ **Validates** `points >= 0`

**Errors:**
- `401 UNAUTHORIZED` - Missing `X-SCORER-TOKEN`
- `403 FORBIDDEN` - Invalid token
- `400 BAD_REQUEST` - Event not active or day is locked
- `400 VALIDATION_ERROR` - Invalid input (e.g., negative points)

---

### 4. Lock Day

**POST /api/events/{event_id}/days/{day_number}/lock**

Requires: `X-ADMIN-TOKEN` header

Prevents further score submissions to this day.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "day-uuid",
    "event_id": "event-uuid",
    "day_number": 2,
    "is_locked": true,
    "message": "Day 2 locked successfully"
  },
  "error": null
}
```

**Errors:**
- `401 UNAUTHORIZED` - Missing `X-ADMIN-TOKEN`
- `403 FORBIDDEN` - Invalid token
- `400 VALIDATION_ERROR` - Invalid day number

---

### 5. Public Scoreboard

**GET /events/{public_token}**

No authentication required. Read-only public access.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "event-uuid",
      "name": "Camp Games 2026",
      "mode": "camp",
      "status": "active",
      "start_at": "2026-01-12T08:00:00Z",
      "end_at": "2026-01-17T18:00:00Z"
    },
    "days": [
      {
        "day_number": 1,
        "label": "Day 1",
        "is_locked": true
      },
      {
        "day_number": 2,
        "label": "Day 2",
        "is_locked": false
      }
    ],
    "teams": [
      {
        "id": "team-uuid",
        "name": "Red Lions",
        "color": "#ff0000",
        "avatar_url": "https://example.com/avatar.png",
        "total_points": 120
      }
    ],
    "breakdown": {
      "day_1": [
        {
          "team_name": "Red Lions",
          "points": 50
        },
        {
          "team_name": "Blue Tigers",
          "points": 45
        }
      ],
      "day_2": [
        {
          "team_name": "Red Lions",
          "points": 70
        }
      ]
    }
  },
  "error": null
}
```

**Notes:**
- Teams sorted by `total_points` DESC
- `breakdown` only populated for `camp` and `advanced` modes
- `total_points` is **computed**, never stored

**Errors:**
- `404 NOT_FOUND` - Invalid or expired token

---

## 🚨 Error Response Format

All errors follow this shape:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Points must be >= 0"
  }
}
```

**Error Codes:**
- `UNAUTHORIZED` (401) - Missing required token header
- `FORBIDDEN` (403) - Invalid token or access denied
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Duplicate resource (e.g., team name)
- `VALIDATION_ERROR` (400) - Invalid input data
- `BAD_REQUEST` (400) - Business rule violation (e.g., locked day)
- `INTERNAL_ERROR` (500) - Server error

---

## 🔄 Usage Flow

### One-Day Event (Quick Mode)

```bash
# 1. Create event
curl -X POST https://your-app.com/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Friday Fun Games",
    "mode": "quick",
    "start_at": "2026-01-15T10:00:00Z",
    "retention_policy": "auto_expire",
    "expires_at": "2026-01-16T00:00:00Z"
  }'

# 2. Add teams (using admin token from response)
curl -X POST https://your-app.com/api/events/{event_id}/teams \
  -H "X-ADMIN-TOKEN: {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Team A"}'

# 3. Submit scores (no day_number needed)
curl -X POST https://your-app.com/api/events/{event_id}/scores \
  -H "X-SCORER-TOKEN: {scorer_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "team-uuid",
    "category": "Trivia",
    "points": 50
  }'

# 4. View scoreboard (public)
curl https://your-app.com/events/{public_token}
```

### Multi-Day Camp Event

```bash
# 1. Create event
curl -X POST https://your-app.com/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Camp 2026",
    "mode": "camp",
    "start_at": "2026-06-01T09:00:00Z",
    "end_at": "2026-06-07T17:00:00Z",
    "retention_policy": "manual"
  }'

# 2. Add teams
curl -X POST https://your-app.com/api/events/{event_id}/teams \
  -H "X-ADMIN-TOKEN: {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Red Dragons", "color": "#ff0000"}'

# 3. Submit scores with day_number
curl -X POST https://your-app.com/api/events/{event_id}/scores \
  -H "X-SCORER-TOKEN: {scorer_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "day_number": 1,
    "team_id": "team-uuid",
    "category": "Swimming",
    "points": 30
  }'

# 4. Lock day when finished
curl -X POST https://your-app.com/api/events/{event_id}/days/1/lock \
  -H "X-ADMIN-TOKEN: {admin_token}"

# 5. View scoreboard
curl https://your-app.com/events/{public_token}
```

---

## ✅ Design Principles

1. **Event-Scoped Security** - Tokens grant access to one event only
2. **No Sessions** - Stateless, token-only authentication
3. **Auto-Creation** - Days created automatically when first score submitted
4. **Computed Totals** - Team totals calculated on read, never stored
5. **Idempotent Locks** - Locking a day multiple times is safe
6. **Predictable Shapes** - All responses follow `{success, data, error}` format
7. **RESTful Routes** - Resource-based URLs with standard verbs

---

## 🔗 Related Documentation

- [Database Schema](../README.md#database-schema)
- [Implementation Guide](../IMPLEMENTATION_GUIDE.md)
- [Data Access Layer](../lib/db-access.ts)

---

**API Version:** 1.0  
**Last Updated:** January 6, 2026
