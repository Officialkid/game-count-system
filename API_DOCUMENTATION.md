# Phase 3: Backend & Database - API Documentation

## Overview

This document outlines the REST API design, endpoints, and integration patterns for Game Count System. All endpoints follow REST conventions with proper HTTP verbs, resource-based URLs, and consistent response formats.

---

## Authentication & Authorization

### JWT Token Management

- **Token Type**: HTTP-only cookie + Authorization header
- **Access Token**: 15 minutes
- **Refresh Token**: 30 days
- **Cookie Settings**: `httpOnly: true, secure: true, sameSite: 'strict', path: '/'`

### Authentication Flow

1. **POST /api/auth/login**
   - Credentials: `{ email, password }`
   - Response: User data + sets HTTP-only cookie with token
   - Status: 200 success, 401 invalid credentials

2. **GET /api/auth/me**
   - Returns: Current user profile & token status
   - Status: 200 success, 401 unauthorized

3. **POST /api/auth/refresh**
   - Refreshes access token using refresh token
   - Response: New access token
   - Status: 200 success, 401 token expired

4. **POST /api/auth/logout**
   - Clears JWT cookies
   - Status: 200 success

### Role-Based Access Control (RBAC)

```typescript
// Token payload includes role
interface JWTPayload {
  userId: string;
  email: string;
  role?: 'user' | 'admin';
}
```

**Admin Permissions**:
- Manage users (system admins only)
- View audit logs
- Access system settings
- Override restrictions

**User Permissions**:
- Create/manage own events
- Manage teams in own events
- Add scores
- Share events

---

## API Endpoints

### Events Resource

#### GET /api/events
**List user's events** (paginated)

```
GET /api/events?page=1&limit=20&status=active

Query Parameters:
  - page: number (default: 1)
  - limit: number (default: 20, max: 100)
  - status: 'active' | 'inactive' | 'all' (default: 'all')

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_name": "Team Lunch Competition",
      "theme_color": "purple",
      "logo_url": null,
      "status": "active",
      "created_at": "2025-12-16T10:00:00Z",
      "user_id": "uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasMore": true
  }
}

Errors:
  - 401: Unauthorized
```

#### POST /api/events
**Create new event**

```
POST /api/events
Content-Type: application/json

Body:
{
  "event_name": "Team Lunch Competition",
  "theme_color": "purple",
  "logo_url": null,
  "allow_negative": false,
  "display_mode": "cumulative",
  "num_teams": 3,
  "start_date": null,
  "end_date": null
}

Response (201):
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_name": "Team Lunch Competition",
    "user_id": "uuid",
    "created_at": "2025-12-16T10:00:00Z"
  }
}

Errors:
  - 400: Bad request (missing fields)
  - 401: Unauthorized
  - 422: Validation error
```

#### GET /api/events/{eventId}
**Get event details**

```
GET /api/events/123e4567-e89b-12d3-a456-426614174000

Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "event_name": "Team Lunch Competition",
    "user_id": "uuid",
    "theme_color": "purple",
    "status": "active",
    "created_at": "2025-12-16T10:00:00Z",
    "updated_at": "2025-12-16T11:00:00Z"
  }
}

Errors:
  - 401: Unauthorized
  - 404: Event not found
```

#### PATCH /api/events/{eventId}
**Update event**

```
PATCH /api/events/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json

Body:
{
  "event_name": "Updated Name",
  "theme_color": "blue"
}

Response (200):
{
  "success": true,
  "data": { ... updated event }
}

Errors:
  - 401: Unauthorized
  - 403: Forbidden (not event owner)
  - 404: Not found
```

#### DELETE /api/events/{eventId}
**Delete event (soft delete)**

```
DELETE /api/events/123e4567-e89b-12d3-a456-426614174000

Response (200):
{
  "success": true,
  "message": "Event deleted"
}

Errors:
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not found
```

---

### Teams Resource

#### GET /api/teams?eventId={eventId}
**List teams for event**

```
GET /api/teams?eventId=123e4567-e89b-12d3-a456-426614174000&page=1&limit=50

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "team_name": "Red Hawks",
      "avatar_url": null,
      "total_points": 150,
      "created_at": "2025-12-16T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /api/teams
**Create team in event**

```
POST /api/teams
Content-Type: application/json

Body:
{
  "event_id": "uuid",
  "team_name": "Red Hawks",
  "avatar_url": null
}

Response (201):
{
  "success": true,
  "data": { ... new team }
}

Errors:
  - 400: Bad request
  - 401: Unauthorized
  - 409: Team name already exists in event
```

#### PATCH /api/teams/{teamId}
**Update team**

```
PATCH /api/teams/uuid

Body:
{
  "team_name": "Blue Eagles",
  "avatar_url": "https://..."
}

Response (200):
{
  "success": true,
  "data": { ... }
}
```

#### DELETE /api/teams/{teamId}
**Delete team**

```
DELETE /api/teams/uuid

Response (200):
{
  "success": true,
  "message": "Team deleted"
}
```

---

### Scores Resource

#### GET /api/scores?eventId={eventId}&teamId={teamId}
**List scores for event or team**

```
GET /api/scores?eventId=uuid&page=1&limit=50

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "event_id": "uuid",
      "team_id": "uuid",
      "game_number": 1,
      "points": 10,
      "created_at": "2025-12-16T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

#### POST /api/scores
**Add score to team**

```
POST /api/scores
Content-Type: application/json

Body:
{
  "event_id": "uuid",
  "team_id": "uuid",
  "game_number": 1,
  "points": 10
}

Response (201):
{
  "success": true,
  "data": { ... new score }
}

Errors:
  - 400: Invalid input
  - 401: Unauthorized
  - 404: Event or team not found
```

#### PATCH /api/scores/{scoreId}
**Update score (admin only)**

```
PATCH /api/scores/uuid

Body:
{
  "points": 15,
  "game_number": 2
}

Response (200):
{
  "success": true,
  "data": { ... }
}
```

#### DELETE /api/scores/{scoreId}
**Delete score (soft delete)**

```
DELETE /api/scores/uuid

Response (200):
{
  "success": true,
  "message": "Score deleted"
}
```

---

### Settings Resource

#### GET /api/user/settings
**Get user settings**

```
GET /api/user/settings

Response (200):
{
  "success": true,
  "data": {
    "theme": "dark",
    "notifications_email": true,
    "language": "en"
  }
}
```

#### POST /api/user/settings
**Update user settings**

```
POST /api/user/settings
Content-Type: application/json

Body:
{
  "theme": "light",
  "notifications_email": false
}

Response (200):
{
  "success": true,
  "data": { ... updated settings }
}
```

---

### Audit Logs Resource

#### GET /api/audit-logs?entityType={type}&entityId={id}
**List audit logs (admin only)**

```
GET /api/audit-logs?entityType=event&entityId=uuid&page=1&limit=50

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "entity_type": "event",
      "entity_id": "uuid",
      "action": "update",
      "old_value": { ... },
      "new_value": { ... },
      "created_at": "2025-12-16T10:00:00Z",
      "ip_address": "192.168.1.1",
      "status_code": 200
    }
  ]
}

Errors:
  - 401: Unauthorized
  - 403: Forbidden (not admin)
```

---

## Response Format

### Success Response

```typescript
{
  "success": true,
  "data": { /* resource data */ },
  "message"?: "Optional message",
  "timestamp": "2025-12-16T10:00:00.000Z"
}
```

### Error Response

```typescript
{
  "success": false,
  "error": "Human-readable error message",
  "code": "error_code",
  "details"?: { /* additional error context */ },
  "timestamp": "2025-12-16T10:00:00.000Z"
}
```

### HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input or missing fields
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Authenticated but insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Rate Limiting

- **Login**: 5 requests per minute per IP
- **API endpoints**: 100 requests per minute per user
- **Response Headers**:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 99
  X-RateLimit-Reset: 1702726800
  Retry-After: 60 (on 429)
  ```

---

## Database Schema (Phase 3)

### Tables

```sql
-- Core tables (existing)
users
events
teams
game_scores

-- Phase 3 additions
audit_logs        -- Complete audit trail
settings          -- User & system preferences

-- Indexes
event_id (FK)
team_id (FK)
user_id (FK)
created_at
updated_at
```

### Connection Pooling

```typescript
// lib/db.ts
const pool = new Pool({
  max: 10,                          // Max connections
  idleTimeoutMillis: 30000,         // 30 seconds
  connectionTimeoutMillis: 10000,   // 10 seconds
  allowExitOnIdle: true
});
```

---

## Error Handling Best Practices

1. **Always return structured errors** with HTTP status codes
2. **Log errors** to audit trail for debugging
3. **Don't expose internal details** in error messages
4. **Validate input** before database operations
5. **Handle rate limits gracefully** with Retry-After header
6. **Use appropriate status codes** (400 vs 401 vs 403 vs 422)

---

## Security Considerations

1. **JWT Secrets**: Min 32 characters, rotate periodically
2. **HTTPS Only**: Secure cookies require HTTPS in production
3. **CORS**: Configure allowed origins
4. **CSRF Protection**: SameSite cookies + token verification
5. **SQL Injection**: Use parameterized queries (pg library)
6. **Rate Limiting**: Prevent abuse and brute force attacks
7. **Audit Logging**: Track all changes for compliance
8. **Input Sanitization**: Validate and sanitize all inputs

---

## Migration & Deployment

### Running Migrations

```bash
npm run migrate
# Runs: npx tsx scripts/run-migration.ts
```

### Environment Variables

```env
POSTGRES_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=<32+ character secret>
NODE_ENV=production
```

### Connection String (Render/Neon)

```
postgresql://user:password@host:port/database?sslmode=require
```

---

## Development Guide

### Adding a New Endpoint

1. Create file: `app/api/{resource}/{action}/route.ts`
2. Import utilities: `requireAuth`, `errorJSON`, `successJSON`, `paginatedResponse`
3. Validate input with Zod schemas
4. Call database methods
5. Return standardized response
6. Add to this documentation

### Example Endpoint

```typescript
// app/api/events/[eventId]/route.ts
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { db } from '@/lib/db';
import { successJSON, errorJSON } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const auth = requireAuth(request);
  if (!auth.authenticated) return auth.error;

  const event = await db.getEventById(params.eventId);
  if (!event) {
    return errorJSON('Event not found', 404);
  }

  return successJSON(event);
}
```

---

## Monitoring & Logging

- **Request Logging**: Automatic via `request-logger.ts`
- **Error Logging**: All errors logged to audit_logs
- **Performance**: Track response times in development
- **Rate Limit Metrics**: Monitor in audit logs

---

## Future Enhancements

- [ ] WebSocket support for real-time score updates
- [ ] GraphQL endpoint (optional)
- [ ] Webhooks for integrations
- [ ] API key management for third-party access
- [ ] Advanced filtering & search
- [ ] Batch operations
- [ ] Data export (CSV, JSON)
- [ ] Versioning strategy (v1, v2, etc.)
