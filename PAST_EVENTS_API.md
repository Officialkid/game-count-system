# Past Events API Documentation

## Overview

The Past Events API provides a read-only interface for retrieving archived/completed events for an authenticated admin. This endpoint is designed for:

- **Event History**: View all past events associated with an admin account
- **Analytics**: Get summary data about completed events
- **Audit Trail**: Track event archival and finalization
- **Data Protection**: Archived events cannot be modified via API

---

## Endpoint

### GET /api/events/past

Retrieves all archived events for the authenticated admin.

**Authentication**: Required (X-ADMIN-TOKEN header)  
**Method**: GET  
**Response Format**: JSON  
**Rate Limit**: No specific limit (subject to general API limits)

---

## Request

### Headers

```
X-ADMIN-TOKEN: [admin_token]
```

**Required**: Yes  
**Description**: Admin token for the event (used to verify admin access)

### Query Parameters

None

### Request Body

None (GET request)

---

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "event_id": "evt_1a2b3c4d5e6f7g8h",
        "name": "Summer Camp 2025",
        "mode": "camp",
        "finalized_at": "2025-08-15T18:30:00Z",
        "is_finalized": true,
        "total_teams": 12,
        "total_days": 5
      },
      {
        "event_id": "evt_2b3c4d5e6f7g8h9i",
        "name": "Quick Tournament",
        "mode": "quick",
        "finalized_at": "2025-08-10T14:20:00Z",
        "is_finalized": true,
        "total_teams": 8,
        "total_days": null
      }
    ],
    "count": 2
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true on successful request |
| `data.events` | array | Array of past events |
| `data.count` | number | Total number of past events returned |

### Event Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `event_id` | string | Unique event identifier |
| `name` | string | Event name |
| `mode` | string | Event mode: `quick`, `camp`, or `advanced` |
| `finalized_at` | string \| null | ISO 8601 timestamp when event was finalized, null if not finalized |
| `is_finalized` | boolean | Whether event has been officially finalized |
| `total_teams` | number | Number of teams in the event |
| `total_days` | number \| null | Number of days (camp mode only), null for other modes |

---

## Error Responses

### 400 Bad Request

**Missing Admin Token Header**

```json
{
  "success": false,
  "error": "X-ADMIN-TOKEN header required"
}
```

**Cause**: The `X-ADMIN-TOKEN` header was not provided  
**Solution**: Include the header with a valid admin token

### 403 Forbidden

**Invalid Admin Token**

```json
{
  "success": false,
  "error": "Invalid admin token"
}
```

**Cause**: The provided admin token does not exist or is invalid  
**Solution**: Verify the admin token is correct

### 405 Method Not Allowed

**Mutation Attempts**

```json
{
  "success": false,
  "error": "Cannot modify archived events. They are read-only."
}
```

**Applicable to**: POST, PUT, PATCH, DELETE requests  
**Cause**: Attempted to modify or delete archived events  
**Solution**: Past events cannot be modified. They are permanently archived.

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to fetch past events"
}
```

**Cause**: Database error or server issue  
**Solution**: Contact support if the problem persists

---

## Examples

### cURL

```bash
curl -X GET "http://localhost:3000/api/events/past" \
  -H "X-ADMIN-TOKEN: your-admin-token-here"
```

### JavaScript/Fetch

```javascript
const adminToken = 'your-admin-token-here';

const response = await fetch('/api/events/past', {
  method: 'GET',
  headers: {
    'X-ADMIN-TOKEN': adminToken,
  },
});

const data = await response.json();

if (data.success) {
  console.log(`Found ${data.data.count} past events`);
  data.data.events.forEach(event => {
    console.log(`${event.name} (${event.mode} - ${event.total_teams} teams)`);
  });
} else {
  console.error('Error:', data.error);
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

export function PastEventsList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPastEvents = async () => {
      try {
        const response = await fetch('/api/events/past', {
          headers: {
            'X-ADMIN-TOKEN': adminToken, // from context or props
          },
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        setEvents(data.data.events);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPastEvents();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Past Events ({events.length})</h2>
      {events.length === 0 ? (
        <p>No past events yet.</p>
      ) : (
        <ul>
          {events.map(event => (
            <li key={event.event_id}>
              <strong>{event.name}</strong> ({event.mode})
              <br />
              Teams: {event.total_teams}
              {event.total_days && ` | Days: ${event.total_days}`}
              <br />
              Finalized: {event.finalized_at ? new Date(event.finalized_at).toLocaleDateString() : 'Not finalized'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Python

```python
import requests
import json

admin_token = 'your-admin-token-here'
headers = {'X-ADMIN-TOKEN': admin_token}

response = requests.get(
    'http://localhost:3000/api/events/past',
    headers=headers
)

data = response.json()

if data['success']:
    events = data['data']['events']
    print(f"Found {len(events)} past events:")
    for event in events:
        print(f"  - {event['name']} ({event['mode']}) - {event['total_teams']} teams")
else:
    print(f"Error: {data['error']}")
```

---

## Sorting & Ordering

Events are automatically sorted by `finalized_at` in descending order (newest first). If an event has not been finalized, it uses the `updated_at` timestamp as fallback.

**Sort Order**: Newest → Oldest

---

## Data Access Control

### Who Can Access

✅ **Event admin only** - Must provide valid admin token for that event

### What Data Is Returned

✅ **Minimal, read-only data** - Only summary information is returned

### What Cannot Be Done

❌ No event modifications  
❌ No team modifications  
❌ No score modifications  
❌ No event deletion  

---

## Status Codes Explained

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Use the returned data |
| 400 | Missing header | Add X-ADMIN-TOKEN header |
| 403 | Invalid token | Check token is correct |
| 405 | Mutation attempt | Use GET only, no mutations |
| 500 | Server error | Retry after a moment, contact support |

---

## Rate Limiting

This endpoint follows the general API rate limiting policy:

- **No specific limit** for this endpoint
- Subject to overall application rate limits
- Caching recommended for frequent access

---

## Caching Recommendations

Since past events don't change, you can safely cache responses:

```javascript
// Cache for 1 hour
const cacheKey = `past_events_${adminToken}`;
const cachedData = localStorage.getItem(cacheKey);

if (cachedData) {
  const cached = JSON.parse(cachedData);
  if (Date.now() - cached.timestamp < 3600000) {
    return cached.data;
  }
}

const response = await fetch('/api/events/past', {
  headers: { 'X-ADMIN-TOKEN': adminToken },
});
const data = await response.json();

localStorage.setItem(cacheKey, JSON.stringify({
  data: data.data,
  timestamp: Date.now(),
}));
```

---

## Event Archival

### How Events Become "Archived"

Events are archived when:

1. **Manually archived** - Admin archives the event
2. **Auto-archived** - System archives old events based on retention policy
3. **Status changed** - Event status set to `archived`

### Retrieving Archived Events

This endpoint automatically returns all events with `status = 'archived'` for the authenticated admin.

---

## Common Use Cases

### 1. Display Event History

```javascript
// Show all past events in a dropdown or list
const response = await fetch('/api/events/past', {
  headers: { 'X-ADMIN-TOKEN': adminToken },
});
const { data } = await response.json();
const events = data.events.map(e => ({
  value: e.event_id,
  label: `${e.name} (${e.total_teams} teams)`,
}));
```

### 2. Calculate Statistics

```javascript
// Get summary stats from past events
const response = await fetch('/api/events/past', {
  headers: { 'X-ADMIN-TOKEN': adminToken },
});
const { data } = await response.json();

const stats = {
  totalEvents: data.count,
  totalTeams: data.events.reduce((sum, e) => sum + e.total_teams, 0),
  avgTeamsPerEvent: data.count > 0 
    ? (data.events.reduce((sum, e) => sum + e.total_teams, 0) / data.count).toFixed(1)
    : 0,
  finalizedCount: data.events.filter(e => e.is_finalized).length,
};
```

### 3. Export Event Summary

```javascript
// Get data for export (CSV, PDF, etc.)
const response = await fetch('/api/events/past', {
  headers: { 'X-ADMIN-TOKEN': adminToken },
});
const { data } = await response.json();

const csv = [
  ['Event Name', 'Mode', 'Teams', 'Days', 'Finalized At'],
  ...data.events.map(e => [
    e.name,
    e.mode,
    e.total_teams,
    e.total_days || '-',
    e.finalized_at ? new Date(e.finalized_at).toLocaleDateString() : 'Not finalized',
  ]),
].map(row => row.join(',')).join('\n');
```

---

## FAQ

### Q: Why can't I modify archived events?

**A**: Archived events are locked to preserve historical data integrity. If you need to edit an event, it shouldn't be archived yet.

### Q: How do I archive an event?

**A**: This is typically done through the admin interface. Contact your system administrator for the archival process.

### Q: Can I unarchive an event?

**A**: No. Archived events are permanently read-only. If you need to reopen an event, contact support.

### Q: What if I don't see an event in the past list?

**A**: 
1. Verify the admin token is correct
2. Check that the event status is `archived`
3. Make sure you're using the right admin account

### Q: Can I delete past events?

**A**: No. Archived events cannot be deleted via API. Contact support for data removal requests.

### Q: Why is `total_days` null for non-camp events?

**A**: Only camp-mode events have multiple days. Quick and advanced modes don't track day breakdowns, so `total_days` is null.

---

## Implementation Notes

### Database Query

The endpoint uses an efficient SQL query that:

1. Joins events with teams table to count total teams
2. Subqueries event_days table for camp events
3. Filters by admin token and archived status
4. Groups and sorts by finalized_at DESC

### Performance

- **Query time**: Typically <100ms for small datasets
- **Optimization**: Index on `admin_token` and `status` columns
- **Scalability**: Efficient even with hundreds of archived events

---

## Security Considerations

✅ **Token Verification**: Admin token verified before returning any data  
✅ **Data Privacy**: Only the admin's own events are returned  
✅ **Read-Only**: No mutations allowed on archived events  
✅ **No Sensitive Data**: Passwords, tokens not returned  
✅ **SQL Injection Prevention**: Parameterized queries used

---

## Changelog

### Version 1.0 (2025)

- ✅ Initial release
- ✅ GET endpoint for past events
- ✅ Admin token authentication
- ✅ Read-only access control
- ✅ Comprehensive error handling

---

## Support

For issues or questions:

1. Check the [FAQ](#faq) section above
2. Review [Error Responses](#error-responses)
3. Verify your admin token is correct
4. Contact the development team if problems persist

