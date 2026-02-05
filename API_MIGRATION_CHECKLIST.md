# 🔄 API Route Migration Checklist
## PostgreSQL → Firebase Firestore Migration

---

## ✅ Completed Routes (3/12)

### 1. ✅ app/api/event-by-token/[token]/route.ts
**Type**: Simple single document query  
**Complexity**: ⭐ Low  
**Status**: ✅ Complete  
**Pattern**: Token-based event lookup with field-specific queries

**Changes Made**:
- Replaced `getEventByToken()` with Firestore `.where()` queries
- Added helper function for token field lookups
- Updated field names (snake_case → camelCase)
- Added proper error handling

**Key Pattern**:
```typescript
const eventsSnapshot = await db.collection('events')
  .where('adminToken', '==', token)
  .limit(1)
  .get();
```

---

### 2. ✅ app/api/public/[token]/route.ts
**Type**: Complex aggregation with subcollections  
**Complexity**: ⭐⭐⭐ High  
**Status**: ✅ Complete  
**Pattern**: Event + teams + scores with grouping by day

**Changes Made**:
- Replaced JOIN queries with subcollection traversal
- Added parallel score fetching with `Promise.all()`
- Computed day labels from event metadata
- Aggregated scores by day in application code
- Updated all field names to camelCase

**Key Pattern**:
```typescript
// Get teams
const teamsSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .orderBy('totalPoints', 'desc')
  .get();

// Get all scores from all teams
const scoresPromises = teamsSnapshot.docs.map(async (teamDoc) => {
  const scoresSnapshot = await teamDoc.ref
    .collection('scores')
    .get();
  return scoresSnapshot.docs.map(scoreDoc => ({
    ...scoreDoc.data(),
    teamId: teamDoc.id
  }));
});

const scores = (await Promise.all(scoresPromises)).flat();
```

---

### 3. ✅ app/api/events/[event_id]/finalize/route.ts
**Type**: Transaction with multiple updates  
**Complexity**: ⭐⭐⭐ High  
**Status**: ✅ Complete  
**Pattern**: Transaction with validation and team point recalculation

**Changes Made**:
- Replaced PostgreSQL transaction with `db.runTransaction()`
- Added admin token validation helper
- Recalculate all team points during finalization
- Update multiple teams in single transaction
- Proper read-then-write pattern

**Key Pattern**:
```typescript
await db.runTransaction(async (transaction) => {
  // 1. READ PHASE
  const eventRef = db.collection('events').doc(eventId);
  const eventSnapshot = await transaction.get(eventRef);
  
  // 2. WRITE PHASE
  transaction.update(eventRef, {
    isFinalized: true,
    finalizedAt: FieldValue.serverTimestamp()
  });
  
  // Update teams
  const teamsSnapshot = await eventRef.collection('teams').get();
  for (const teamDoc of teamsSnapshot.docs) {
    transaction.update(teamDoc.ref, { totalPoints: calculatedTotal });
  }
});
```

---

## 🔄 Remaining Routes (9/12)

### 4. ⏳ app/api/cron/cleanup/route.ts
**Type**: Bulk operations (delete expired events)  
**Complexity**: ⭐⭐ Medium  
**Migration Steps**:
1. Replace `query()` with Firestore `.where()` for date comparison
2. Use batch operations for deleting multiple events
3. Delete subcollections (teams, scores) before deleting events
4. Verify cron secret authentication

**Conversion Pattern**:
```typescript
// FROM: query('SELECT * FROM events WHERE status = $1 AND expires_at < NOW()')
// TO:
const snapshot = await db.collection('events')
  .where('status', '==', 'expired')
  .where('expiresAt', '<', new Date())
  .get();

// Delete with subcollections
for (const eventDoc of snapshot.docs) {
  await deleteDocumentWithSubcollections('events', eventDoc.id, ['teams']);
}
```

---

### 5. ⏳ app/api/events/[event_id]/export-csv/route.ts
**Type**: Complex export with day-by-day breakdown  
**Complexity**: ⭐⭐⭐ High  
**Migration Steps**:
1. Get event document
2. Get all teams from subcollection
3. Get all scores from each team's subcollection
4. Group scores by day (already has TypeScript types fixed)
5. Generate CSV rows

**Conversion Pattern**:
```typescript
// Get event
const eventDoc = await db.collection('events').doc(eventId).get();

// Get teams
const teamsSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .get();

// Get scores for each team
const scoresPromises = teamsSnapshot.docs.map(teamDoc => 
  teamDoc.ref.collection('scores').get()
);
const scoresSnapshots = await Promise.all(scoresPromises);
```

---

### 6. ⏳ app/api/events/[event_id]/history/route.ts
**Type**: Score history with team names  
**Complexity**: ⭐⭐ Medium  
**Migration Steps**:
1. Validate admin token
2. Get all teams for event
3. Get all scores with team info
4. Order by timestamp descending

**Conversion Pattern**:
```typescript
const teamsSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .get();

const scoresPromises = teamsSnapshot.docs.map(async (teamDoc) => {
  const scoresSnapshot = await teamDoc.ref
    .collection('scores')
    .orderBy('createdAt', 'desc')
    .get();
  
  return scoresSnapshot.docs.map(scoreDoc => ({
    ...scoreDoc.data(),
    teamName: teamDoc.data().name
  }));
});

const allScores = (await Promise.all(scoresPromises)).flat();
```

---

### 7. ⏳ app/api/events/[event_id]/teams/route.ts
**Type**: CRUD operations for teams  
**Complexity**: ⭐⭐ Medium  
**Migration Steps**:
1. **GET**: List all teams with totalPoints
2. **POST**: Create new team
3. **PUT**: Update team name
4. **DELETE**: Delete team and all its scores

**Conversion Pattern**:
```typescript
// GET
const teamsSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .orderBy('name', 'asc')
  .get();

// POST
const teamRef = db.collection('events')
  .doc(eventId)
  .collection('teams')
  .doc();

await teamRef.set({
  name,
  totalPoints: 0,
  createdAt: FieldValue.serverTimestamp()
});

// DELETE (with scores)
await deleteDocumentWithSubcollections(
  `events/${eventId}/teams`,
  teamId,
  ['scores']
);
```

---

### 8. ⏳ app/api/events/past/route.ts
**Type**: Query for completed/archived events  
**Complexity**: ⭐ Low  
**Migration Steps**:
1. Query events with status = 'completed' OR 'archived'
2. Order by finalizedAt or endDate descending
3. Limit results for pagination

**Conversion Pattern**:
```typescript
// Note: Firestore requires separate queries for OR conditions
const completedSnapshot = await db.collection('events')
  .where('status', '==', 'completed')
  .orderBy('endDate', 'desc')
  .limit(50)
  .get();

const archivedSnapshot = await db.collection('events')
  .where('status', '==', 'archived')
  .orderBy('endDate', 'desc')
  .limit(50)
  .get();

// Merge and sort
const allEvents = [
  ...completedSnapshot.docs,
  ...archivedSnapshot.docs
].map(doc => ({ id: doc.id, ...doc.data() }))
  .sort((a, b) => b.endDate - a.endDate)
  .slice(0, 50);
```

---

### 9. ⏳ app/api/public/by-event/[eventId]/route.ts
**Type**: Public scoreboard by event ID  
**Complexity**: ⭐⭐ Medium  
**Migration Steps**:
1. Get event by ID (not token)
2. Get teams and scores (similar to public/[token])
3. Return formatted response

**Conversion Pattern**:
```typescript
const eventDoc = await db.collection('events').doc(eventId).get();

if (!eventDoc.exists) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// Same logic as public/[token]/route.ts
```

---

### 10. ⏳ app/api/scores/bulk/route.ts
**Type**: Bulk score creation  
**Complexity**: ⭐⭐⭐ High  
**Migration Steps**:
1. Validate admin/scorer token
2. Check day locking
3. Create multiple scores in batch
4. Update team totalPoints for each team in transaction

**Conversion Pattern**:
```typescript
// Use batch for scores
const batch = db.batch();

for (const score of scores) {
  const scoreRef = db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(score.teamId)
    .collection('scores')
    .doc();
  
  batch.set(scoreRef, {
    points: score.points,
    category: score.category,
    dayNumber: score.dayNumber,
    createdAt: FieldValue.serverTimestamp()
  });
}

await batch.commit();

// Update team points in separate transaction
await updateTeamPointsTransaction(eventId, teamId, totalPointsAdded);
```

---

### 11. ⏳ app/api/scores/update/route.ts
**Type**: Update/delete individual score  
**Complexity**: ⭐⭐ Medium  
**Migration Steps**:
1. Validate token
2. Check day locking
3. Get old score value
4. Update score
5. Update team totalPoints in transaction

**Conversion Pattern**:
```typescript
await db.runTransaction(async (transaction) => {
  const scoreRef = db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId)
    .collection('scores')
    .doc(scoreId);
  
  const scoreDoc = await transaction.get(scoreRef);
  const oldPoints = scoreDoc.data()?.points || 0;
  const pointsDelta = newPoints - oldPoints;
  
  // Update score
  transaction.update(scoreRef, { points: newPoints });
  
  // Update team total
  const teamRef = db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId);
  
  const teamDoc = await transaction.get(teamRef);
  const currentTotal = teamDoc.data()?.totalPoints || 0;
  
  transaction.update(teamRef, {
    totalPoints: currentTotal + pointsDelta
  });
});
```

---

### 12. ⏳ app/api/teams/bulk/route.ts
**Type**: Bulk team creation  
**Complexity**: ⭐⭐ Medium  
**Migration Steps**:
1. Validate admin token
2. Create multiple teams in batch
3. Return created teams with IDs

**Conversion Pattern**:
```typescript
const batch = db.batch();
const teamRefs: any[] = [];

for (const teamName of teamNames) {
  const teamRef = db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc();
  
  batch.set(teamRef, {
    name: teamName,
    totalPoints: 0,
    createdAt: FieldValue.serverTimestamp()
  });
  
  teamRefs.push({ id: teamRef.id, name: teamName });
}

await batch.commit();

return NextResponse.json({
  success: true,
  data: { teams: teamRefs }
});
```

---

### 13. ⏳ app/api/waitlist/signup/route.ts
**Type**: Simple document creation  
**Complexity**: ⭐ Low  
**Migration Steps**:
1. Create waitlist entry
2. Return success

**Conversion Pattern**:
```typescript
const waitlistRef = db.collection('waitlist').doc();

await waitlistRef.set({
  email,
  name,
  createdAt: FieldValue.serverTimestamp()
});

return NextResponse.json({
  success: true,
  data: { id: waitlistRef.id }
});
```

---

## 🎯 Migration Strategy

### Phase 1: Simple Routes (Priority: HIGH)
- [ ] waitlist/signup (simplest)
- [ ] events/past (query only)
- [ ] public/by-event (similar to completed route)

### Phase 2: Medium Complexity (Priority: MEDIUM)
- [ ] events/[event_id]/teams
- [ ] events/[event_id]/history
- [ ] teams/bulk
- [ ] scores/update

### Phase 3: Complex Routes (Priority: HIGH - CRITICAL)
- [ ] scores/bulk (scoring system)
- [ ] events/[event_id]/export-csv
- [ ] cron/cleanup

---

## 📝 Migration Process for Each Route

### Step 1: Read Current Code
```bash
# Review the route
code app/api/[route-path]/route.ts
```

### Step 2: Identify PostgreSQL Patterns
- [ ] `query()` or `db.query()` calls
- [ ] SQL JOINs
- [ ] `BEGIN/COMMIT/ROLLBACK` transactions
- [ ] `RETURNING *` clauses

### Step 3: Map to Firestore Patterns
- [ ] Single document → `.doc().get()`
- [ ] Query with filter → `.where().get()`
- [ ] JOIN → subcollection traversal
- [ ] Transaction → `db.runTransaction()`
- [ ] Batch insert → `batch.set()` + `batch.commit()`

### Step 4: Update Imports
```typescript
// Remove
import { query } from '@/lib/db-client';
import { getEventByToken } from '@/lib/db-access';

// Add
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { validateAdminToken, prepareEventForResponse } from '@/lib/firebase-helpers';
```

### Step 5: Convert Queries
- Replace SQL with Firestore API calls
- Update field names (snake_case → camelCase)
- Add `.exists` checks
- Include document IDs in results

### Step 6: Update Error Handling
```typescript
// Use try-catch with Firebase error codes
catch (error: any) {
  if (error.code === 'permission-denied') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... other error codes
}
```

### Step 7: Test the Route
```powershell
# Test with curl or Postman
curl -X GET "http://localhost:3000/api/[route]" \
  -H "x-admin-token: YOUR_TOKEN"
```

### Step 8: Verify TypeScript Compilation
```bash
npx tsc --noEmit
```

---

## 🔧 Helper Functions Available

### Query Helpers
- `getDocument(collection, docId)` - Get single document
- `getSubDocument(parent, parentId, sub, docId)` - Get from subcollection
- `queryDocuments(collection, field, operator, value)` - Simple query
- `getSubCollection(parent, parentId, sub, options)` - Get subcollection with filters

### Create Helpers
- `createDocument(collection, data)` - Create with auto ID
- `createSubDocument(parent, parentId, sub, data)` - Create in subcollection
- `batchCreateDocuments(collection, documents)` - Batch create

### Update Helpers
- `updateDocument(collection, docId, data)` - Update document
- `updateSubDocument(parent, parentId, sub, docId, data)` - Update subcollection doc

### Delete Helpers
- `deleteDocument(collection, docId)` - Delete single
- `deleteDocumentWithSubcollections(collection, docId, subs)` - Delete with subcollections
- `deleteSubCollection(parent, parentId, sub)` - Delete entire subcollection

### Transaction Helpers
- `updateTeamPointsTransaction(eventId, teamId, pointsDelta)` - Update team points safely
- `recalculateTeamPoints(eventId, teamId)` - Recalculate from all scores

### Validation Helpers
- `validateAdminToken(eventId, token)` - Check admin access
- `validatePublicToken(token)` - Get event by token
- `isEventActive(event)` - Check if active
- `isEventFinalized(event)` - Check if finalized
- `isDayLocked(event, dayNumber)` - Check if day is locked

### Response Helpers
- `prepareEventForResponse(event)` - Convert timestamps to ISO strings
- `prepareTeamForResponse(team)` - Format team data
- `prepareScoreForResponse(score)` - Format score data
- `getFirestoreErrorStatus(error)` - Get HTTP status from Firebase error
- `getFirestoreErrorMessage(error)` - Get user-friendly message

---

## ✅ Verification Checklist

After migrating each route:

### Code Quality
- [ ] All PostgreSQL imports removed
- [ ] Firebase imports added
- [ ] Field names updated to camelCase
- [ ] Type assertions added where needed
- [ ] Error handling uses Firebase error codes

### Functionality
- [ ] GET requests return correct data
- [ ] POST requests create documents
- [ ] PUT/PATCH requests update correctly
- [ ] DELETE requests remove documents and subcollections
- [ ] Transactions maintain data consistency

### Performance
- [ ] Queries use `.limit()` where appropriate
- [ ] Parallel queries use `Promise.all()`
- [ ] Batch operations used for multiple writes
- [ ] Indexes created for complex queries

### Security
- [ ] Admin tokens validated
- [ ] Public endpoints accessible without auth
- [ ] Firestore rules prevent unauthorized access

### TypeScript
- [ ] No compilation errors
- [ ] Proper types for all functions
- [ ] No `any` types without justification

---

## 📚 Reference Documents

- **Conversion Guide**: [POSTGRESQL_TO_FIRESTORE_GUIDE.md](POSTGRESQL_TO_FIRESTORE_GUIDE.md)
- **Helper Functions**: [lib/firebase-helpers.ts](lib/firebase-helpers.ts)
- **Example Routes**:
  - Simple: [app/api/event-by-token/[token]/route.ts](app/api/event-by-token/[token]/route.ts)
  - Complex: [app/api/public/[token]/route.ts](app/api/public/[token]/route.ts)
  - Transaction: [app/api/events/[event_id]/finalize/route.ts](app/api/events/[event_id]/finalize/route.ts)

---

## 📈 Progress Tracking

**Total Routes**: 12  
**Completed**: 3 (25%)  
**In Progress**: 0 (0%)  
**Remaining**: 9 (75%)

**Estimated Time**:
- Simple routes (3): 1-2 hours each = 3-6 hours
- Medium routes (4): 2-4 hours each = 8-16 hours
- Complex routes (2): 4-6 hours each = 8-12 hours

**Total**: 19-34 hours

---

**Last Updated**: February 2026  
**Status**: 3 example routes completed, 9 remaining  
**Next Priority**: Scores/bulk route (critical for scoring system)
