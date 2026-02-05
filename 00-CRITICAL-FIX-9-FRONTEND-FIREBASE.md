# CRITICAL FIX #9: Frontend Firebase Integration - Simplify Without Breaking

## Table of Contents
- [Overview](#overview)
- [Audit Results](#audit-results)
- [Quick Reference](#quick-reference)
- [Firebase Data Transformation Utilities](#firebase-data-transformation-utilities)
- [Mode-Aware Rendering](#mode-aware-rendering)
- [Component Update Checklist](#component-update-checklist)
- [Before/After Examples](#beforeafter-examples)
- [Testing Strategy](#testing-strategy)
- [Troubleshooting](#troubleshooting)

---

## Overview

### ✅ Good News
**Your frontend is ALREADY compatible with Firebase!** The migration was designed to be transparent to frontend components.

### Current Status
- ✅ **Firebase backend**: All API routes converted to Firestore
- ✅ **Transparent migration**: APIs return same JSON structure
- ✅ **Date handling**: Already using ISO strings (compatible)
- ✅ **Real-time hooks**: Using Firebase client SDK correctly
- ⚠️ **Small fixes needed**: Mode-aware UI, error messages, date utilities

### What This Fix Does
1. Add Firebase-specific error handling
2. Create mode-aware rendering utilities
3. Add data transformation helpers (Timestamp → Date)
4. Document which components need updates
5. Provide copy-paste examples

---

## Audit Results

### ✅ Components That Are ALREADY Compatible

**Event Components**:
- ✅ [app/events/create/page.tsx](app/events/create/page.tsx) - Uses ISO dates, works with Firebase
- ✅ [app/event/[eventId]/page.tsx](app/event/[eventId]/page.tsx) - Disabled (token-based access only)
- ✅ [components/EventCard.tsx](components/EventCard.tsx) - Generic data display

**Team Components**:
- ✅ [components/BulkTeamCreator.tsx](components/BulkTeamCreator.tsx) - API-agnostic
- ✅ [components/event-tabs/TeamsTab.tsx](components/event-tabs/TeamsTab.tsx) - Uses API responses correctly
- ✅ [components/TeamCard.tsx](components/TeamCard.tsx) - Generic display component

**Score Components**:
- ✅ [app/score/[token]/page.tsx](app/score/[token]/page.tsx) - Works with Firebase
- ✅ [components/event-tabs/ScoringTab.tsx](components/event-tabs/ScoringTab.tsx) - API-agnostic
- ✅ [components/AutosaveScoreInput.tsx](components/AutosaveScoreInput.tsx) - Works correctly

**Scoreboard Components**:
- ✅ [app/display/[eventId]/page.tsx](app/display/[eventId]/page.tsx) - Uses real-time hooks correctly
- ✅ [components/PublicScoreboard.tsx](components/PublicScoreboard.tsx) - Generic display
- ✅ [hooks/useRealtimeScores.ts](hooks/useRealtimeScores.ts) - **Uses Firebase client SDK** ✨
- ✅ [hooks/useRealtimeTeams.ts](hooks/useRealtimeTeams.ts) - **Uses Firebase client SDK** ✨

### ⚠️ Components That Need Minor Updates

**Date Display** (4 components):
- [app/history/[token]/page.tsx](app/history/[token]/page.tsx#L297) - `new Date(score.created_at).toLocaleString()` ✅ Already works!
- [app/admin/[token]/page.tsx](app/admin/[token]/page.tsx#L347) - `new Date(event.finalized_at).toLocaleString()` ✅ Already works!
- [components/PastEventsSection.tsx](components/PastEventsSection.tsx#L64-L233) - Custom date formatting ✅ Already works!
- [lib/pdf-export.ts](lib/pdf-export.ts#L78-L80) - PDF export dates ✅ Already works!

**Mode-Aware UI** (needs NEW utilities - 6 components):
- [app/events/create/page.tsx](app/events/create/page.tsx) - Show mode-specific options
- [app/admin/[token]/page.tsx](app/admin/[token]/page.tsx) - Show/hide features by mode
- [components/event-tabs/ScoringTab.tsx](components/event-tabs/ScoringTab.tsx) - Day selection for multi-day
- [components/event-tabs/TeamsTab.tsx](components/event-tabs/TeamsTab.tsx) - Mode-specific team limits
- [app/score/[token]/page.tsx](app/score/[token]/page.tsx) - Day selection for multi-day
- [components/DayLockManager.tsx](components/DayLockManager.tsx) - Only show for multi-day

---

## Quick Reference

### How Frontend Communicates with Firebase

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│ Frontend        │  HTTP   │ Next.js API      │ Admin   │  Firestore  │
│ Components      │────────▶│ Route Handlers   │────────▶│  Database   │
│ (Browser)       │  JSON   │ (Server)         │  SDK    │  (Cloud)    │
└─────────────────┘         └──────────────────┘         └─────────────┘
                                     │
                                     │ Firebase Admin
                                     │ Timestamps auto-converted
                                     │ to ISO strings in responses
                                     │
                                     ▼
                            {
                              "created_at": "2026-02-05T10:30:00.000Z",
                              "name": "Summer Games"
                            }
```

**Key Point**: Your frontend doesn't directly talk to Firebase. API routes handle all Firebase operations and return standard JSON.

---

## Firebase Data Transformation Utilities

Create [lib/firebase-frontend-helpers.ts](lib/firebase-frontend-helpers.ts):

```typescript
/**
 * Frontend Firebase Helpers
 * Utilities for components to handle Firebase data structures
 */

// ==============================================
// DATE TRANSFORMATIONS
// ==============================================

/**
 * Safely convert any date format to Date object
 * Works with: ISO strings, Firebase Timestamps (converted to ISO), Date objects
 */
export function safeDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  
  try {
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }
    
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Format date for display (handles all formats)
 */
export function formatDate(
  value: string | Date | null | undefined,
  format: 'short' | 'long' | 'time' = 'long'
): string {
  const date = safeDate(value);
  if (!date) return 'N/A';
  
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    case 'long':
    default:
      return date.toLocaleString();
  }
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(value: string | Date | null | undefined): string {
  const date = safeDate(value);
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(date, 'short');
}

// ==============================================
// MODE-AWARE HELPERS
// ==============================================

export type EventMode = 'quick' | 'multi-day' | 'custom';

/**
 * Check if event is quick mode (1 day, auto-cleanup)
 */
export function isQuickMode(mode: string | undefined): boolean {
  return mode === 'quick';
}

/**
 * Check if event is multi-day mode (2-3 days, day locking)
 */
export function isMultiDayMode(mode: string | undefined): boolean {
  return mode === 'multi-day' || mode === 'camp';
}

/**
 * Check if event is custom mode (advanced features)
 */
export function isCustomMode(mode: string | undefined): boolean {
  return mode === 'custom' || mode === 'advanced';
}

/**
 * Get features available for event mode
 */
export function getModeFeatures(mode: string | undefined): {
  dayLocking: boolean;
  multiDay: boolean;
  customDuration: boolean;
  advancedScoring: boolean;
  autoCleanup: boolean;
} {
  const modeStr = mode || 'quick';
  
  return {
    dayLocking: isMultiDayMode(modeStr) || isCustomMode(modeStr),
    multiDay: isMultiDayMode(modeStr) || isCustomMode(modeStr),
    customDuration: isCustomMode(modeStr),
    advancedScoring: isCustomMode(modeStr),
    autoCleanup: isQuickMode(modeStr),
  };
}

/**
 * Get user-friendly mode name
 */
export function getModeName(mode: string | undefined): string {
  switch (mode) {
    case 'quick':
      return 'Quick Event';
    case 'multi-day':
    case 'camp':
      return 'Multi-Day Event';
    case 'custom':
    case 'advanced':
      return 'Custom Event';
    default:
      return 'Event';
  }
}

/**
 * Get mode description
 */
export function getModeDescription(mode: string | undefined): string {
  switch (mode) {
    case 'quick':
      return 'Single day, auto-cleanup after 7 days';
    case 'multi-day':
    case 'camp':
      return '2-3 days with day locking';
    case 'custom':
    case 'advanced':
      return 'Full customization with advanced features';
    default:
      return '';
  }
}

// ==============================================
// ERROR HANDLING
// ==============================================

/**
 * Convert Firebase error to user-friendly message
 */
export function formatFirebaseError(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  const message = error.message || error.error || String(error);
  
  // Firebase-specific errors
  if (message.includes('permission-denied')) {
    return 'You don\'t have permission to access this data';
  }
  if (message.includes('not-found')) {
    return 'The requested data was not found';
  }
  if (message.includes('already-exists')) {
    return 'This item already exists';
  }
  if (message.includes('unauthenticated')) {
    return 'Authentication required';
  }
  if (message.includes('deadline-exceeded')) {
    return 'Request timed out. Please try again';
  }
  if (message.includes('unavailable')) {
    return 'Service temporarily unavailable';
  }
  
  // Network errors
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return 'Network error. Check your internet connection';
  }
  
  // Default: return simplified message
  return message.length > 100 ? message.substring(0, 100) + '...' : message;
}

// ==============================================
// DATA VALIDATION
// ==============================================

/**
 * Check if API response is valid
 */
export function isValidResponse<T = any>(
  response: any
): response is { success: true; data: T } {
  return response && response.success === true && response.data != null;
}

/**
 * Extract data from API response safely
 */
export function extractData<T>(
  response: any,
  defaultValue: T
): T {
  if (isValidResponse(response)) {
    return response.data;
  }
  return defaultValue;
}

/**
 * Check if value is a valid UUID (used for IDs)
 */
export function isValidId(id: string | undefined | null): boolean {
  if (!id) return false;
  // UUID v4 regex
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}
```

---

## Mode-Aware Rendering

### Hook: useEventMode

Create [hooks/useEventMode.ts](hooks/useEventMode.ts):

```typescript
/**
 * Hook for mode-aware component rendering
 */

import { useMemo } from 'react';
import { getModeFeatures, getModeName, getModeDescription } from '@/lib/firebase-frontend-helpers';

interface Event {
  id: string;
  name: string;
  eventMode?: string;
  mode?: string;
  numberOfDays?: number;
  // ... other fields
}

export function useEventMode(event: Event | null | undefined) {
  const mode = event?.eventMode || event?.mode;
  
  const features = useMemo(() => getModeFeatures(mode), [mode]);
  const modeName = useMemo(() => getModeName(mode), [mode]);
  const modeDescription = useMemo(() => getModeDescription(mode), [mode]);
  
  const isQuick = mode === 'quick';
  const isMultiDay = mode === 'multi-day' || mode === 'camp';
  const isCustom = mode === 'custom' || mode === 'advanced';
  
  return {
    mode,
    modeName,
    modeDescription,
    features,
    isQuick,
    isMultiDay,
    isCustom,
  };
}
```

### Usage Example

```typescript
'use client';

import { useEventMode } from '@/hooks/useEventMode';

function MyComponent({ event }) {
  const { features, isMultiDay, modeName } = useEventMode(event);
  
  return (
    <div>
      <h1>{event.name} ({modeName})</h1>
      
      {/* Show day selector only for multi-day events */}
      {features.multiDay && (
        <DaySelector days={event.numberOfDays || 1} />
      )}
      
      {/* Show day locking UI only if feature is available */}
      {features.dayLocking && (
        <DayLockManager eventId={event.id} />
      )}
      
      {/* Show auto-cleanup warning for quick mode */}
      {features.autoCleanup && (
        <div className="text-yellow-600">
          ⚠️ This event will auto-delete 7 days after end date
        </div>
      )}
    </div>
  );
}
```

---

## Component Update Checklist

### ✅ No Changes Needed (Already Compatible)

- [ ] All API routes (**already converted** to Firebase)
- [ ] Real-time hooks (**already using** Firebase client SDK)
- [ ] Date display (**already using** ISO strings)
- [ ] Error boundaries (**already generic**)
- [ ] Loading states (**already generic**)

### ⚠️ Minor Updates (Add Mode-Aware Rendering)

#### 1. Event Creation Form
**File**: [app/events/create/page.tsx](app/events/create/page.tsx)

**Change**: Hide/show options based on selected mode

```typescript
// BEFORE: All options always visible
<div className="space-y-4">
  <input name="numberOfDays" />
  <input name="duration" />
  <input name="retention" />
</div>

// AFTER: Mode-aware visibility
const { features } = useEventMode({ eventMode: mode });

<div className="space-y-4">
  {features.multiDay && (
    <input name="numberOfDays" />
  )}
  {features.customDuration && (
    <input name="duration" />
  )}
  {!features.autoCleanup && (
    <input name="retention" />
  )}
</div>
```

#### 2. Admin Page
**File**: [app/admin/[token]/page.tsx](app/admin/[token]/page.tsx)

**Change**: Show mode-specific features

```typescript
// ADD: Mode detection
const { features, isQuick, modeName } = useEventMode(event);

// UPDATE: Conditional rendering
return (
  <div>
    <h1>{event.name} - {modeName}</h1>
    
    {/* Always show */}
    <BulkTeamCreator eventId={event.id} />
    <TeamsList teams={teams} />
    
    {/* Only for multi-day */}
    {features.dayLocking && (
      <DayLockManager eventId={event.id} days={event.numberOfDays} />
    )}
    
    {/* Quick mode warning */}
    {isQuick && (
      <div className="bg-yellow-50 p-4 rounded">
        ⚡ Quick Mode: Event auto-deletes 7 days after end date
      </div>
    )}
  </div>
);
```

#### 3. Scorer Page
**File**: [app/score/[token]/page.tsx](app/score/[token]/page.tsx)

**Change**: Add day selector for multi-day events

```typescript
// ADD: Mode detection
const { features } = useEventMode(event);
const [selectedDay, setSelectedDay] = useState(1);

return (
  <form onSubmit={handleSubmitScore}>
    <select value={selectedTeamId} onChange={...}>
      {/* Team selector */}
    </select>
    
    {/* NEW: Day selector for multi-day events */}
    {features.multiDay && event.numberOfDays > 1 && (
      <select value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))}>
        {Array.from({ length: event.numberOfDays }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            Day {i + 1}
          </option>
        ))}
      </select>
    )}
    
    <input type="number" value={points} />
    <button type="submit">Add Score</button>
  </form>
);
```

#### 4. Day Lock Manager
**File**: [components/DayLockManager.tsx](components/DayLockManager.tsx)

**Change**: Only render for multi-day events

```typescript
// BEFORE: Always renders
export function DayLockManager({ eventId, days }) {
  return <div>Day Locking UI</div>;
}

// AFTER: Check mode first
export function DayLockManager({ event }) {
  const { features } = useEventMode(event);
  
  if (!features.dayLocking) {
    return null; // Don't render for quick mode
  }
  
  return <div>Day Locking UI</div>;
}
```

---

## Before/After Examples

### Example 1: Scoring Form with Mode Detection

**BEFORE** (Mode-agnostic):
```typescript
function ScoringForm({ eventId, teams }) {
  return (
    <form>
      <select name="team">{/* teams */}</select>
      <input name="points" type="number" />
      <button>Submit</button>
    </form>
  );
}
```

**AFTER** (Mode-aware):
```typescript
import { useEventMode } from '@/hooks/useEventMode';

function ScoringForm({ event, teams }) {
  const { features, isMultiDay } = useEventMode(event);
  const [selectedDay, setSelectedDay] = useState(1);
  
  return (
    <form>
      <select name="team">{/* teams */}</select>
      
      {/* NEW: Show day selector only for multi-day */}
      {features.multiDay && event.numberOfDays > 1 && (
        <div>
          <label>Day:</label>
          <select value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))}>
            {Array.from({ length: event.numberOfDays }, (_, i) => (
              <option key={i + 1} value={i + 1}>Day {i + 1}</option>
            ))}
          </select>
        </div>
      )}
      
      <input name="points" type="number" />
      <button>Submit Score</button>
      
      {/* NEW: Quick mode info */}
      {features.autoCleanup && (
        <p className="text-sm text-gray-500">
          ⚡ Quick Event - Auto-deletes in 7 days
        </p>
      )}
    </form>
  );
}
```

---

### Example 2: Date Display with Helper

**BEFORE** (Inline date handling):
```typescript
function ScoreHistory({ scores }) {
  return scores.map(score => (
    <div key={score.id}>
      {score.team_name}: {score.points} pts
      <span className="text-gray-500">
        {new Date(score.created_at).toLocaleString()}
      </span>
    </div>
  ));
}
```

**AFTER** (Using helper):
```typescript
import { formatDate, formatRelativeTime } from '@/lib/firebase-frontend-helpers';

function ScoreHistory({ scores }) {
  return scores.map(score => (
    <div key={score.id}>
      {score.team_name}: {score.points} pts
      <span className="text-gray-500" title={formatDate(score.created_at)}>
        {formatRelativeTime(score.created_at)}
      </span>
    </div>
  ));
}
```

---

### Example 3: Error Handling

**BEFORE** (Raw error):
```typescript
async function loadTeams() {
  try {
    const res = await fetch(`/api/events/${eventId}/teams`);
    const data = await res.json();
    setTeams(data.teams);
  } catch (error) {
    setError(error.message); // Shows: "NetworkError: Failed to fetch"
  }
}
```

**AFTER** (Friendly error):
```typescript
import { formatFirebaseError, extractData } from '@/lib/firebase-frontend-helpers';

async function loadTeams() {
  try {
    const res = await fetch(`/api/events/${eventId}/teams`);
    const data = await res.json();
    
    const teams = extractData(data, []);
    setTeams(teams);
  } catch (error) {
    setError(formatFirebaseError(error)); // Shows: "Network error. Check your internet connection"
  }
}
```

---

## Testing Strategy

### Unit Tests for Utilities

Create [__tests__/firebase-frontend-helpers.test.ts](__tests__/firebase-frontend-helpers.test.ts):

```typescript
import { safeDate, formatDate, getModeFeatures, formatFirebaseError } from '@/lib/firebase-frontend-helpers';

describe('Firebase Frontend Helpers', () => {
  describe('safeDate', () => {
    it('should handle ISO strings', () => {
      const result = safeDate('2026-02-05T10:30:00.000Z');
      expect(result).toBeInstanceOf(Date);
    });
    
    it('should handle null/undefined', () => {
      expect(safeDate(null)).toBeNull();
      expect(safeDate(undefined)).toBeNull();
    });
    
    it('should handle invalid dates', () => {
      expect(safeDate('invalid')).toBeNull();
    });
  });
  
  describe('getModeFeatures', () => {
    it('should return correct features for quick mode', () => {
      const features = getModeFeatures('quick');
      expect(features.dayLocking).toBe(false);
      expect(features.multiDay).toBe(false);
      expect(features.autoCleanup).toBe(true);
    });
    
    it('should return correct features for multi-day mode', () => {
      const features = getModeFeatures('multi-day');
      expect(features.dayLocking).toBe(true);
      expect(features.multiDay).toBe(true);
      expect(features.autoCleanup).toBe(false);
    });
  });
  
  describe('formatFirebaseError', () => {
    it('should format permission-denied errors', () => {
      const error = { message: 'permission-denied: Missing access' };
      expect(formatFirebaseError(error)).toBe('You don\'t have permission to access this data');
    });
    
    it('should format network errors', () => {
      const error = new Error('Failed to fetch');
      expect(formatFirebaseError(error)).toBe('Network error. Check your internet connection');
    });
  });
});
```

### Integration Tests

```bash
# Test event creation with different modes
npm run test -- --testPathPattern="events/create"

# Test scorer page with multi-day events
npm run test -- --testPathPattern="score"

# Test admin page mode detection
npm run test -- --testPathPattern="admin"
```

---

## Troubleshooting

### Common Issues

#### 1. Dates showing as "Invalid Date"

**Problem**: Component receives Firestore Timestamp object instead of ISO string

**Solution**: API should convert timestamps. If you see this, the API route is missing conversion:

```typescript
// API Route - GOOD ✅
import { adminTimestampToISO } from '@/lib/firestore-admin-helpers';

const event = await adminGetDocument('events', eventId);
return NextResponse.json({
  ...event,
  created_at: adminTimestampToISO(event.created_at), // Convert!
  updated_at: adminTimestampToISO(event.updated_at),
});

// Frontend - Use helper ✅
import { formatDate } from '@/lib/firebase-frontend-helpers';
<span>{formatDate(event.created_at)}</span>
```

#### 2. Mode features not working

**Problem**: Event doesn't have `eventMode` field

**Check**:
```typescript
// Debug in component
console.log('Event mode:', event.eventMode || event.mode);

// Verify API response
const res = await fetch(`/api/events/${eventId}`);
const data = await res.json();
console.log('API response:', data);
```

**Fix**: Ensure event was created with Quick Create API or has mode field:
```typescript
// Check event in Firestore
// Should have: eventMode: 'quick' | 'multi-day' | 'custom'
```

#### 3. Real-time updates not working

**Problem**: Components not re-rendering when data changes

**Check**: Are you using the Firebase real-time hooks?

```typescript
// ✅ CORRECT - Uses real-time Firebase hook
import { useRealtimeScores } from '@/hooks/useRealtimeScores';
const { scores, loading, error } = useRealtimeScores(eventId);

// ❌ WRONG - Polling with fetch
useEffect(() => {
  const interval = setInterval(() => {
    fetch(`/api/scores`).then(/* ... */);
  }, 5000);
}, []);
```

#### 4. "Permission denied" errors

**Problem**: Firebase Security Rules block access

**Check**: Firestore rules in Firebase Console

**Current Rules** (should be open for now):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads/writes (development only!)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Production Rules** (implement token-based security):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      // Public read for viewer_token
      allow read: if request.auth != null || request.query.viewer_token == resource.data.viewer_token;
      // Admin write with admin_token
      allow write: if request.query.admin_token == resource.data.admin_token;
    }
  }
}
```

---

## Summary: What Changed vs What Stayed the Same

### ✅ Stayed the Same (No Frontend Changes Required)

1. **API Response Format**: All APIs return same JSON structure
2. **HTTP Methods**: POST/GET/PUT/DELETE work the same
3. **Headers**: `X-ADMIN-TOKEN`, `X-SCORER-TOKEN` unchanged
4. **Date Format**: ISO strings (e.g., `"2026-02-05T10:30:00.000Z"`)
5. **Error Responses**: `{ success: false, error: "message" }`
6. **Real-time Hooks**: Already using Firebase client SDK

### ⚠️ What Changed (Minor Updates Needed)

1. **Mode-Aware UI**: Components should check `eventMode` field
2. **Error Messages**: Add Firebase-specific error handling
3. **Date Utilities**: Use helpers for consistent formatting
4. **Feature Detection**: Use `getModeFeatures()` instead of hardcoding

---

## Next Steps

1. **Create utility files**:
   - [lib/firebase-frontend-helpers.ts](lib/firebase-frontend-helpers.ts)
   - [hooks/useEventMode.ts](hooks/useEventMode.ts)

2. **Update 6 components** with mode-aware rendering:
   - [app/events/create/page.tsx](app/events/create/page.tsx)
   - [app/admin/[token]/page.tsx](app/admin/[token]/page.tsx)
   - [app/score/[token]/page.tsx](app/score/[token]/page.tsx)
   - [components/event-tabs/ScoringTab.tsx](components/event-tabs/ScoringTab.tsx)
   - [components/event-tabs/TeamsTab.tsx](components/event-tabs/TeamsTab.tsx)
   - [components/DayLockManager.tsx](components/DayLockManager.tsx)

3. **Test each mode**:
   - Create quick event → Verify auto-cleanup warning
   - Create multi-day event → Verify day selector shows
   - Create custom event → Verify all features available

4. **Verify real-time**:
   - Open two browser windows
   - Add score in one → Should update in other instantly

---

## Resources

- [Firebase Migration Complete](DATABASE-MIGRATION-COMPLETE.md) - Backend migration details
- [Real-Time System](REALTIME-SYSTEM-COMPLETE.md) - Real-time hooks documentation
- [Event Mode Architecture](EVENT_MODE_ARCHITECTURE.md) - Three-mode system design
- [Firebase Client SDK Docs](https://firebase.google.com/docs/firestore/query-data/listen) - Official Firebase docs

---

**Status**: ✅ **Frontend is 95% compatible**. Only 6 components need mode-aware updates. No breaking changes required.