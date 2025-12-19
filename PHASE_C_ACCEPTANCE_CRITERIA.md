# Phase C - Manual Testing & Acceptance Criteria

**Status:** Service layer complete and type-safe  
**Testing Phase:** Ready for manual collection setup and verification

---

## Acceptance Criteria Checklist

### Criterion 1: Events List Loads from Appwrite when USE_APPWRITE=true
- [ ] `NEXT_PUBLIC_USE_APPWRITE_SERVICES=true` in `.env.local`
- [ ] Collections created in Appwrite Console
- [ ] Dashboard/events page loads events from Appwrite
- [ ] Events filtered by user_id
- [ ] No 401/403 permission errors

**Test Script:**
```bash
# Set environment
export NEXT_PUBLIC_USE_APPWRITE_SERVICES=true

# In browser console after navigation to /events:
localStorage.getItem('auth_token')  # Should be null (session-based)
console.log('[Service Mode]', window.location.href)
```

**Expected Result:** ✅ Events appear immediately, no localStorage token needed

---

### Criterion 2: Create/Edit/Delete Operations Persist
- [ ] Create new event → appears in Appwrite Console
- [ ] Edit event name → updated in real-time
- [ ] Delete event → removed from console
- [ ] Timestamps auto-set (created_at, updated_at)
- [ ] Permissions set correctly (user: creator only)

**Manual Test Steps:**

#### 2.1 Create Event
```
1. Navigate to /events
2. Click "New Event"
3. Fill form:
   - Event Name: "Test Event"
   - Theme Color: "#7c3aed"
   - Teams: 4
4. Submit
```

**Verify in Appwrite Console:**
```
Collection: events
Expected document:
{
  $id: "...",
  user_id: "current-user-id",
  event_name: "Test Event",
  theme_color: "#7c3aed",
  num_teams: 4,
  status: "draft",
  created_at: "2025-12-16T...",
  updated_at: "2025-12-16T...",
  $permissions: ["user:current-user-id"]
}
```

**Expected Result:** ✅ Document exists with correct permissions

#### 2.2 Edit Event
```
1. From events list, click edit icon
2. Change "Test Event" → "Test Event Updated"
3. Save
```

**Verify in Appwrite Console:**
```
Same document:
- event_name changed to "Test Event Updated"
- updated_at timestamp refreshed
- user_id unchanged
```

**Expected Result:** ✅ Event name updated, timestamps correct

#### 2.3 Delete Event
```
1. From events list, click delete icon
2. Confirm deletion
```

**Verify in Appwrite Console:**
```
Query events collection with:
- event_id = original-event-$id
- Result: No documents
```

**Expected Result:** ✅ Document deleted, cannot retrieve

---

### Criterion 3: Dashboard Search & Filter Operate on Appwrite Queries

#### 3.1 Filter by Status
```
1. Create 3 events with statuses: draft, draft, active
2. On dashboard, click "Filter" → "Active"
3. Should show only the active event
```

**Appwrite Query Used:**
```typescript
Query.equal('status', 'active')
```

**Expected Result:** ✅ Only 1 event shown

#### 3.2 Search by Name
```
1. Create events: "Team Alpha", "Team Beta", "Camp Countdown"
2. In search box, type "team"
3. Should filter to 2 events (case-insensitive)
```

**Implementation Note:** Currently client-side filtering (acceptable per acceptance criteria). Can be optimized to server-side later.

**Expected Result:** ✅ Client-side search works, shows matching events

#### 3.3 Sort by Date
```
1. Create 3 events on different days
2. List should show newest first (orderDesc('created_at'))
```

**Expected Result:** ✅ Newest event at top

---

## Integration Test Procedures

### Test 1: Mock → Appwrite Service Toggle

**Setup:**
```bash
# Terminal 1: Start dev server with mock
export NEXT_PUBLIC_USE_APPWRITE_SERVICES=false
npm run dev

# Create event via UI
# Note: saved to mock state only
```

**Verify:**
```
Browser Console:
  [Service Layer] Using Mock services
```

**Then:**
```bash
# Terminal 2: Switch to Appwrite (after collections created)
export NEXT_PUBLIC_USE_APPWRITE_SERVICES=true
npm run dev  # Restart

# Same event should NOT appear (Appwrite collection empty)
# Create new event via UI
```

**Verify in Appwrite Console:**
```
New event appears in events collection
```

**Expected Result:** ✅ Service adapter correctly toggles

---

### Test 2: Permission Verification

**Setup:**
```typescript
// Simulate 2 users
const user1 = { id: 'user-1', email: 'alice@test.com' };
const user2 = { id: 'user-2', email: 'bob@test.com' };

// User 1 creates event
const res1 = await eventsService.createEvent(user1.id, {
  event_name: 'Alice\'s Event'
});

// User 1 should see it
const list1 = await eventsService.getEvents(user1.id);
// Result: 1 event ✅

// User 2 should NOT see it
const list2 = await eventsService.getEvents(user2.id);
// Result: 0 events ✅
```

**In Appwrite Console:**
```
Event document:
- $permissions: ["user:user-1"]
- User 2 cannot read/update/delete
```

**Expected Result:** ✅ Document-level permissions enforced

---

### Test 3: Upsert Logic (Scores Collection)

**Setup:**
```typescript
// Same game, same team, different scores
const score1 = await scoresService.addScore(userId, {
  event_id: eventId,
  team_id: teamId,
  game_number: 1,
  points: 50
});
// Creates new document ✅

const score2 = await scoresService.addScore(userId, {
  event_id: eventId,
  team_id: teamId,
  game_number: 1,  // Same game & team
  points: 75       // Different points
});
// Updates existing document (not creating new) ✅
```

**Verify:**
```
Scores collection:
- Only 1 document for (event_id, team_id, game_number=1)
- points: 75 (updated value)
- Composite index prevents duplicates
```

**Expected Result:** ✅ Upsert works correctly

---

### Test 4: Pagination

**Setup:**
```typescript
// Create 15 events
for (let i = 0; i < 15; i++) {
  await eventsService.createEvent(userId, {
    event_name: `Event ${i}`
  });
}

// Get page 1 (limit 5)
const page1 = await eventsService.getEvents(userId, { 
  limit: 5, 
  offset: 0 
});
// Result: 5 events ✅

// Get page 2 (limit 5, offset 5)
const page2 = await eventsService.getEvents(userId, { 
  limit: 5, 
  offset: 5 
});
// Result: 5 events (different 5) ✅

// Get page 3 (limit 5, offset 10)
const page3 = await eventsService.getEvents(userId, { 
  limit: 5, 
  offset: 10 
});
// Result: 5 events ✅
```

**Expected Result:** ✅ Pagination works, no duplicates across pages

---

## Migration Test: Mock → Appwrite

### Acceptance Criterion 4: Export Mock, Import to Appwrite

**Goal:** Verify data model matches between mock and Appwrite

#### 4.1 Export Mock Events
```typescript
import mockData from '@/lib/mockData';

const mockEvents = mockData.events;
console.log(JSON.stringify(mockEvents, null, 2));
```

**Output shape should match:**
```json
[
  {
    "id": "...",
    "user_id": "...",
    "event_name": "Camp Countdown 2025",
    "theme_color": "#7c3aed",
    "allow_negative": false,
    "display_mode": "cumulative",
    "num_teams": 4,
    "status": "active",
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### 4.2 Create Appwrite Collection with Same Schema
**Done via:** `APPWRITE_COLLECTIONS_SETUP.md`
- ✅ events collection created
- ✅ All attributes match mock data
- ✅ Types match (string, number, boolean, datetime)

#### 4.3 Verify Schema Alignment

| Mock Field | Appwrite Attribute | Type | Notes |
|---|---|---|---|
| id | $id | string | Auto-generated |
| user_id | user_id | string | Required |
| event_name | event_name | string | Required |
| theme_color | theme_color | string | Optional, default #7c3aed |
| logo_path | logo_path | string | Optional |
| allow_negative | allow_negative | boolean | Optional, default false |
| display_mode | display_mode | string | Optional, enum |
| num_teams | num_teams | number | Optional, default 2 |
| status | status | string | Optional, enum |
| created_at | created_at | datetime | Auto-set |

**Expected Result:** ✅ Complete schema match

---

## End-to-End Test Scenario

### Scenario: "Create Event, Add Teams, Add Scores, View Leaderboard"

**Preconditions:**
- All 4 collections created
- Services set to Appwrite mode
- User logged in

**Step 1: Create Event**
```
POST /api/events (or UI form)
{
  event_name: "Summer Camp 2025",
  theme_color: "#ff6b6b",
  num_teams: 3
}
→ Returns: { success: true, data: { event } }
→ Appwrite: Document created in events collection
```

**Step 2: Add Teams**
```
POST /api/teams (or UI form)
{
  event_id: "<event_id>",
  team_name: "Red Team"
}
→ Returns: { success: true, data: { team } }

// Repeat for "Blue Team", "Yellow Team"
→ Appwrite: 3 documents in teams collection
```

**Step 3: Add Scores**
```
POST /api/scores
{
  event_id: "<event_id>",
  team_id: "<red_team_id>",
  game_number: 1,
  points: 50
}
→ Returns: { success: true, data: { score } }

// Add more scores for all teams across multiple games
→ Appwrite: Multiple documents in scores collection
```

**Step 4: View Leaderboard**
```
GET /api/leaderboard?event_id=<event_id>
→ Queries scores collection
→ Aggregates totals per team
→ Sorts by points DESC
→ Returns:
{
  leaderboard: [
    { team_id, team_name, total_points: 150, rank: 1 },
    { team_id, team_name, total_points: 120, rank: 2 },
    { team_id, team_name, total_points: 100, rank: 3 }
  ]
}
```

**Expected Result:** ✅ Full workflow completes successfully

---

## Debugging Guide

### Common Issues & Solutions

| Issue | Cause | Solution |
|---|---|---|
| "Collection does not exist" | Collection ID mismatch or not created | Verify collection ID in Appwrite Console matches `COLLECTION_ID` in service file |
| "Document not found" | Querying non-existent doc | Check document was created; verify `$id` |
| "Permission denied" | Missing/incorrect document permissions | Verify permissions set to `["user:{userId}"]` at create time |
| "Invalid query" | Index missing for query | Check all required indexes exist in Appwrite (see `APPWRITE_COLLECTIONS_SETUP.md`) |
| Service returns "Success: false" | Network error or validation error | Check browser console for detailed error message |
| Event list shows mock events | `NEXT_PUBLIC_USE_APPWRITE_SERVICES` not set to true | Update `.env.local` and restart dev server |

### Enable Debug Logging

Add to service files temporarily:
```typescript
console.log('[appwriteEvents.getEvents]', { userId, filters, result });
console.log('[appwriteEvents.createEvent]', { userId, eventData, result });
```

Or use browser DevTools:
```javascript
// In browser console
localStorage.debug = '*';  // Enable all debug logs
```

---

## Success Criteria Summary

✅ **All Criteria Must Pass:**

1. **Events Load from Appwrite**
   - Events appear on dashboard when USE_APPWRITE=true
   - Filtered by current user_id
   
2. **CRUD Operations Persist**
   - Create: Document appears in Appwrite Console
   - Update: Changes visible immediately
   - Delete: Document removed
   - Timestamps auto-set correctly
   
3. **Queries Work**
   - Status filter shows correct events
   - Name search works (client-side)
   - Sorting by date works (DESC order)
   
4. **Permissions Enforce**
   - User A cannot see User B's events
   - Document-level permissions: `["user:{userId}"]`
   
5. **Data Model Migrates**
   - Mock schema matches Appwrite collection
   - All fields present and typed correctly
   - All indexes exist

---

## Next Actions

### Immediate (This Session)
1. Create 5 collections in Appwrite Console
2. Set up indexes per guide
3. Set permissions
4. Run manual tests above

### Following Session
1. Update components to use service adapter
2. Pass userId to all service calls
3. Switch `NEXT_PUBLIC_USE_APPWRITE_SERVICES=true`
4. Run end-to-end tests
5. Deploy

---

**Target:** All acceptance criteria pass by end of manual testing phase
