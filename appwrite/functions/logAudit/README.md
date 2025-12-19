# logAudit Function

**Purpose:** Create audit log entries for all important operations in the system.

## Deployment Steps

1. **Create Function in Appwrite Console:**
   - Go to Functions → Create Function
   - Name: `logAudit`
   - Runtime: **Node.js 18**
   - Entry point: `index.js`
   - Build commands: `npm install`

2. **Set Environment Variables:**
   ```
   APPWRITE_API_KEY=<your-api-key-from-project-settings>
   ```

3. **Upload Files:**
   - `index.js`
   - `package.json`

4. **Set Execute Permissions:**
   - Role: `Users` (any authenticated user)

5. **Get Function ID:**
   - Copy the function ID after creation
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_APPWRITE_FUNCTION_LOG_AUDIT=<function-id>
     ```

## Input Schema

```json
{
  "user_id": "string (required)",
  "action": "string (required)",
  "entity": "string (required)",
  "record_id": "string (required)",
  "details": {
    "key": "value"
  },
  "ip_address": "string (optional)",
  "user_agent": "string (optional)"
}
```

## Action Naming Convention

Use dot notation for consistency:

- `score.create`, `score.update`, `score.delete`
- `event.create`, `event.update`, `event.delete`
- `team.create`, `team.update`, `team.delete`
- `user.login`, `user.logout`, `user.register`
- `user.role_change`, `user.invite`, `user.password_reset`
- `sharelink.create`, `sharelink.regenerate`, `sharelink.delete`

## Entity Names

- `scores`
- `events`
- `teams`
- `users`
- `share_links`
- `recaps`

## Example Usage

### From Another Function

```javascript
import { Functions } from 'node-appwrite';

const functions = new Functions(client);

await functions.createExecution(
  '<logAudit-function-id>',
  JSON.stringify({
    user_id: userId,
    action: 'score.create',
    entity: 'scores',
    record_id: scoreDoc.$id,
    details: {
      event_id: eventId,
      team_id: teamId,
      points: points,
    },
  }),
  true // async
);
```

### From Frontend API Route

```typescript
import { functions } from '@/lib/appwrite';

const auditFunctionId = process.env.NEXT_PUBLIC_APPWRITE_FUNCTION_LOG_AUDIT;

await functions.createExecution(
  auditFunctionId,
  JSON.stringify({
    user_id: user.id,
    action: 'event.update',
    entity: 'events',
    record_id: eventId,
    details: {
      changes: { theme_color: newColor },
    },
    ip_address: req.headers['x-forwarded-for'],
    user_agent: req.headers['user-agent'],
  })
);
```

## Response

Success:
```json
{
  "success": true,
  "data": {
    "audit_id": "...",
    "timestamp": "2024-12-16T10:30:00.000Z"
  }
}
```

Error:
```json
{
  "success": false,
  "error": "Missing user_id"
}
```

## Integration Points

This function should be called from:

1. **submitScoreHandler** - Score creation/updates
2. **generateRecap** - Recap generation
3. **Event CRUD operations** - Create, update, delete events
4. **Team CRUD operations** - Create, update, delete teams
5. **User management** - Role changes, invites
6. **Share link operations** - Create, regenerate, delete

## Querying Audit Logs

```typescript
import { databases } from '@/lib/appwrite';
import { Query } from 'appwrite';

// Get all logs for a user
const userLogs = await databases.listDocuments(
  'main',
  'audit_logs',
  [Query.equal('user_id', userId), Query.orderDesc('timestamp')]
);

// Get logs for specific entity
const eventLogs = await databases.listDocuments(
  'main',
  'audit_logs',
  [Query.equal('entity', 'events'), Query.equal('record_id', eventId)]
);

// Get logs by action type
const deletions = await databases.listDocuments(
  'main',
  'audit_logs',
  [Query.search('action', 'delete')]
);
```

## Security Notes

- Only authenticated users can create audit logs
- Audit logs are **immutable** (no update/delete permissions)
- Admin users can query all logs
- Regular users can only query their own logs (implement via permissions)

## Monitoring

Check function executions in Appwrite Console:
- Go to Functions → logAudit → Executions
- View logs for debugging
- Monitor execution time and errors
