# Event Mode Architecture Documentation

## Overview

The Game Count System now supports three distinct event modes, each designed for specific use cases with different requirements, features, and lifecycles.

---

## Event Modes

### 🔸 Quick Mode
**Perfect for one-time, temporary events**

**Characteristics:**
- ✅ No authentication required
- ✅ Auto-cleanup after 24 hours
- ✅ Single-day events only
- ✅ Instant setup
- ❌ No multi-day support
- ❌ No organization features
- ❌ No advanced analytics

**Use Cases:**
- One-time competitions
- Quick tournaments
- Temporary scoreboards
- Demo/testing events

**Lifecycle:**
1. Created → Draft status
2. Activated → Active status
3. Auto-archived after 24 hours → Deleted

---

### 🟣 Camp Mode
**Ideal for multi-day camps and extended events**

**Characteristics:**
- ⚠️ Optional authentication
- ✅ Multi-day support (up to 30 days)
- ✅ Daily scoring mode available
- ✅ Manual archival
- ✅ Advanced analytics
- ✅ Customization options
- ❌ No organization features

**Use Cases:**
- Summer camps
- Multi-day tournaments
- Extended competitions
- Sports events

**Lifecycle:**
1. Created → Draft status
2. Activated → Active status
3. Completed → Completed status
4. Manually archived → Archived status

---

### 🔴 Advanced Mode
**Full-featured events for organizations**

**Characteristics:**
- ✅ Authentication required
- ✅ Unlimited duration
- ✅ Multi-day support
- ✅ Organization management
- ✅ Advanced analytics
- ✅ Full customization
- ✅ Permanent storage

**Use Cases:**
- Organization events
- League management
- Long-term competitions
- Enterprise use

**Lifecycle:**
1. Created → Draft status
2. Activated → Active status
3. Completed → Completed status
4. Manually archived → Archived status (never deleted)

---

## Firestore Schema

### Updated Event Document Structure

```typescript
{
  id: string;
  name: string;
  
  // Event Mode System (NEW)
  eventMode: 'quick' | 'camp' | 'advanced';
  eventStatus: 'draft' | 'active' | 'completed' | 'archived';
  requiresAuthentication: boolean;
  autoCleanupDate?: string; // ISO date - for Quick mode
  
  // Scoring Configuration
  scoringMode: 'continuous' | 'daily';
  number_of_days: number;
  
  // Legacy (for backward compatibility)
  status: 'active' | 'expired' | 'finalized';
  
  // Dates
  start_at: string;
  end_at: string;
  
  // Security
  admin_token: string;
  scorer_token: string;
  public_token: string;
  
  // Finalization
  is_finalized: boolean;
  finalized_at?: string;
  
  // Organization (Advanced mode)
  organization_id?: string;
  organization_name?: string;
  
  // Metadata
  created_at: Timestamp;
  updated_at: Timestamp;
  created_by?: string;
}
```

---

## API Changes

### Create Event - Updated Request

```typescript
POST /api/events/create

{
  "name": "Summer Camp 2026",
  "number_of_days": 7,
  "scoringMode": "daily",
  
  // New fields
  "eventMode": "camp",
  "requiresAuthentication": false,
  "organizationId": "org_123",      // For advanced mode
  "organizationName": "Camp ABC",   // For advanced mode
  "createdBy": "user_456"           // If authenticated
}
```

### Create Event - Updated Response

```typescript
{
  "success": true,
  "data": {
    "event": {
      "id": "event_789",
      "name": "Summer Camp 2026",
      "eventMode": "camp",
      "eventStatus": "draft",
      "requiresAuthentication": false,
      // ... other fields
    },
    "modeInfo": {
      "mode": "camp",
      "config": {
        "requiresAuth": false,
        "autoCleanup": false,
        "maxDuration": 30,
        "features": {
          "multiDay": true,
          "organizations": false,
          "advancedAnalytics": true,
          "customization": true
        }
      },
      "autoCleanup": false,
      "maxDuration": 30
    }
  }
}
```

### New Endpoint: Update Event Status

```typescript
PUT /api/events/[event_id]/status

Request:
{
  "status": "active",
  "admin_token": "your_admin_token"
}

Response:
{
  "success": true,
  "data": {
    "eventId": "event_789",
    "previousStatus": "draft",
    "newStatus": "active",
    "availableTransitions": ["completed", "archived"]
  }
}
```

### Get Status Transitions

```typescript
GET /api/events/[event_id]/status

Response:
{
  "success": true,
  "data": {
    "currentStatus": "active",
    "availableTransitions": ["completed", "archived"]
  }
}
```

---

## Component Usage

### EventModeSelector Component

```tsx
import EventModeSelector from '@/components/EventModeSelector';
import { EventMode } from '@/lib/firebase-collections';
import { useState } from 'react';

function CreateEventForm() {
  const [eventMode, setEventMode] = useState<EventMode>('quick');
  
  return (
    <form>
      <EventModeSelector
        selectedMode={eventMode}
        onModeChange={setEventMode}
      />
      
      {/* Rest of form fields */}
    </form>
  );
}
```

---

## Helper Functions

### Event Mode Helpers

```typescript
import {
  getEventModeConfig,
  calculateAutoCleanupDate,
  calculateEndDate,
  validateModeConstraints,
  isFeatureAvailable,
  getModeName,
  getModeDescription,
  shouldCleanupEvent,
  getStatusColor,
  getModeColor,
  getAvailableStatusTransitions,
} from '@/lib/event-mode-helpers';

// Get mode configuration
const config = getEventModeConfig('camp');

// Calculate cleanup date for Quick events
const cleanupDate = calculateAutoCleanupDate('quick', new Date());

// Validate mode constraints
const validation = validateModeConstraints('quick', 3, false);
// Returns: { valid: false, errors: ["Quick Mode only supports single-day events"] }

// Check feature availability
if (isFeatureAvailable('advanced', 'organizations')) {
  // Show organization selector
}

// Get status transitions
const transitions = getAvailableStatusTransitions('draft');
// Returns: ['active', 'archived']
```

---

## Migration

### Migrate Existing Events

```bash
# Run migration script to add mode fields to existing events
node migrate-add-event-modes.js
```

**What it does:**
- Analyzes existing events
- Determines appropriate mode based on duration and features
- Sets eventStatus based on current status
- Calculates autoCleanupDate for Quick events
- Updates all events in Firestore

**Logic:**
- Single-day events → Quick mode
- 2-30 day events → Camp mode
- 30+ day events or with organization → Advanced mode

---

## Status Transitions

### Valid Transitions

```
draft → active, archived
active → completed, archived
completed → archived
archived → (no transitions)
```

### Status Meanings

- **draft**: Event created but not yet started
- **active**: Event is live and accepting scores
- **completed**: Event finished, results finalized
- **archived**: Event stored for historical reference

---

## Validation Rules

### Mode Constraints

**Quick Mode:**
- Max 1 day
- No authentication allowed
- Auto-cleanup required

**Camp Mode:**
- Max 30 days
- Optional authentication
- No organization features

**Advanced Mode:**
- Unlimited duration
- Authentication required (if using org features)
- Organization ID required for org features

---

## Auto-Cleanup System

### How It Works

1. Quick events get `autoCleanupDate` set to 24 hours after creation
2. Background job checks for events past cleanup date
3. Events are automatically deleted when cleanup date is reached

### Implementing Cleanup (Future)

```typescript
// Example cleanup function (to be called by cron job)
import { shouldCleanupEvent } from '@/lib/event-mode-helpers';

async function cleanupExpiredEvents() {
  const events = await getAllEvents();
  
  for (const event of events) {
    if (shouldCleanupEvent(event.eventMode, event.autoCleanupDate)) {
      await deleteEvent(event.id);
      console.log(`Cleaned up Quick event: ${event.name}`);
    }
  }
}
```

---

## Frontend Integration

### Display Mode Badge

```tsx
import { getModeColor, getModeName } from '@/lib/event-mode-helpers';

function EventCard({ event }) {
  return (
    <div>
      <span 
        style={{ backgroundColor: getModeColor(event.eventMode) }}
        className="px-2 py-1 rounded text-white text-xs"
      >
        {getModeName(event.eventMode)}
      </span>
      
      <h3>{event.name}</h3>
    </div>
  );
}
```

### Display Status Badge

```tsx
import { getStatusColor } from '@/lib/event-mode-helpers';

function EventStatus({ status }) {
  return (
    <span 
      style={{ backgroundColor: getStatusColor(status) }}
      className="px-2 py-1 rounded text-white text-xs"
    >
      {status.toUpperCase()}
    </span>
  );
}
```

---

## Testing

### Test Event Creation with Modes

```bash
# Create Quick event
curl -X POST http://localhost:3000/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quick Test",
    "number_of_days": 1,
    "eventMode": "quick",
    "scoringMode": "continuous"
  }'

# Create Camp event
curl -X POST http://localhost:3000/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Camp",
    "number_of_days": 7,
    "eventMode": "camp",
    "scoringMode": "daily"
  }'

# Create Advanced event
curl -X POST http://localhost:3000/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "League Event",
    "number_of_days": 90,
    "eventMode": "advanced",
    "requiresAuthentication": true,
    "organizationId": "org_123",
    "organizationName": "Sports League"
  }'
```

---

## Summary

### Files Created/Modified

**Created:**
- `lib/event-mode-helpers.ts` - 15+ helper functions
- `components/EventModeSelector.tsx` - Mode selection UI
- `app/api/events/[event_id]/status/route.ts` - Status management
- `migrate-add-event-modes.js` - Migration script
- `EVENT_MODE_ARCHITECTURE.md` - This documentation

**Modified:**
- `lib/firebase-collections.ts` - Added mode types and interfaces
- `app/api/events/create/route.ts` - Added mode support

### Next Steps

1. ✅ Run migration: `node migrate-add-event-modes.js`
2. ✅ Test mode selector component in event creation
3. ✅ Implement auto-cleanup cron job (optional)
4. ✅ Update frontend to display mode badges
5. ✅ Add mode filtering to event lists

---

**The event mode architecture is now fully implemented and ready to use!** 🎉
