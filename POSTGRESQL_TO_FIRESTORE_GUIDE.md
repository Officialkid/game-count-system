# 🔄 PostgreSQL to Firestore Conversion Guide

## Complete Migration Reference for Game Count System API Routes

---

## 📋 Table of Contents

1. [Core Differences](#core-differences)
2. [Query Patterns](#query-patterns)
3. [Transaction Patterns](#transaction-patterns)
4. [Error Handling](#error-handling)
5. [Common Pitfalls](#common-pitfalls)
6. [Performance Optimization](#performance-optimization)

---

## 🎯 Core Differences

### Database Structure

**PostgreSQL (Relational)**:
```sql
-- Tables with relationships
events (id, name, token, admin_token, status, mode, ...)
teams (id, event_id, name, total_points, ...)
scores (id, event_id, team_id, day_number, category, points, ...)
```

**Firestore (Document-based)**:
```
events/{eventId}
  ├─ id, name, token, adminToken, status, mode, ...
  └─ teams (subcollection)
      └─ {teamId}
          ├─ id, name, totalPoints, ...
          └─ scores (subcollection)
              └─ {scoreId}
                  └─ dayNumber, category, points, ...
```

### Key Differences Table

| Feature | PostgreSQL | Firestore |
|---------|-----------|-----------|
| **Structure** | Tables with rows | Collections with documents |
| **Relationships** | Foreign keys (JOINs) | Subcollections or references |
| **Queries** | SQL with JOINs | NoSQL with subcollections |
| **Transactions** | ACID with ROLLBACK | Atomic with automatic retry |
| **ID Generation** | SERIAL / UUID | Auto-generated or custom |
| **NULL Values** | Explicit NULL | Field absence or null |
| **Indexing** | CREATE INDEX | Automatic + composite indexes |

---

## 📖 Query Patterns

### 1. SELECT Single Document

**PostgreSQL**:
```typescript
const result = await db.query(
  'SELECT * FROM events WHERE id = $1',
  [eventId]
);
const event = result.rows[0];

if (!event) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
```

**Firestore**:
```typescript
const eventDoc = await db.collection('events').doc(eventId).get();

if (!eventDoc.exists) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

const event = { id: eventDoc.id, ...eventDoc.data() };
```

**Key Points**:
- `.get()` returns DocumentSnapshot
- Check `.exists` instead of checking if null
- Use `{ id: doc.id, ...doc.data() }` to include ID in result

---

### 2. SELECT with WHERE Clause (Single Condition)

**PostgreSQL**:
```typescript
const result = await db.query(
  'SELECT * FROM events WHERE token = $1',
  [token]
);
const event = result.rows[0];
```

**Firestore**:
```typescript
const eventsSnapshot = await db.collection('events')
  .where('token', '==', token)
  .limit(1)
  .get();

if (eventsSnapshot.empty) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

const eventDoc = eventsSnapshot.docs[0];
const event = { id: eventDoc.id, ...eventDoc.data() };
```

**Key Points**:
- `.where()` requires field name, operator, value
- `.limit(1)` for single result (optimization)
- Check `.empty` on QuerySnapshot
- Access first doc with `.docs[0]`

---

### 3. SELECT with Multiple WHERE Conditions

**PostgreSQL**:
```typescript
const result = await db.query(
  'SELECT * FROM events WHERE status = $1 AND mode = $2',
  ['active', 'camp']
);
const events = result.rows;
```

**Firestore**:
```typescript
const eventsSnapshot = await db.collection('events')
  .where('status', '==', 'active')
  .where('mode', '==', 'camp')
  .get();

const events = eventsSnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**Key Points**:
- Chain `.where()` calls for AND conditions
- OR conditions require separate queries + merge
- Composite indexes required for multiple fields (Firebase auto-suggests)

---

### 4. SELECT with ORDER BY and LIMIT

**PostgreSQL**:
```typescript
const result = await db.query(
  'SELECT * FROM teams WHERE event_id = $1 ORDER BY total_points DESC LIMIT 10',
  [eventId]
);
const topTeams = result.rows;
```

**Firestore (Subcollection)**:
```typescript
const teamsSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .orderBy('totalPoints', 'desc')
  .limit(10)
  .get();

const topTeams = teamsSnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**Key Points**:
- Use `.orderBy(field, 'asc'|'desc')`
- `.limit(n)` for pagination
- Field must be indexed for orderBy
- Can't order by multiple fields without composite index

---

### 5. SELECT with JOINs → Subcollections

**PostgreSQL (JOIN)**:
```typescript
const result = await db.query(`
  SELECT t.*, COALESCE(SUM(s.points), 0) as total
  FROM teams t
  LEFT JOIN scores s ON t.id = s.team_id
  WHERE t.event_id = $1
  GROUP BY t.id
  ORDER BY total DESC
`, [eventId]);

const teams = result.rows;
```

**Firestore (Subcollection + Aggregation)**:
```typescript
// Option 1: Use stored totalPoints (recommended)
const teamsSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .orderBy('totalPoints', 'desc')
  .get();

const teams = teamsSnapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

// Option 2: Calculate on-the-fly (slower)
const teamsSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .get();

const teams = await Promise.all(
  teamsSnapshot.docs.map(async (teamDoc) => {
    const scoresSnapshot = await teamDoc.ref
      .collection('scores')
      .get();
    
    const totalPoints = scoresSnapshot.docs.reduce(
      (sum, scoreDoc) => sum + (scoreDoc.data().points || 0),
      0
    );
    
    return {
      id: teamDoc.id,
      ...teamDoc.data(),
      totalPoints
    };
  })
);

teams.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
```

**Key Points**:
- Firestore has no JOINs - use subcollections
- Store aggregated values (totalPoints) for performance
- Calculate on-the-fly only when necessary
- Use Promise.all() for parallel subcollection queries

---

### 6. INSERT Single Document

**PostgreSQL**:
```typescript
const result = await db.query(
  'INSERT INTO events (name, token, admin_token, status) VALUES ($1, $2, $3, $4) RETURNING *',
  [name, token, adminToken, 'active']
);
const newEvent = result.rows[0];
```

**Firestore (Auto ID)**:
```typescript
const eventRef = db.collection('events').doc(); // Auto-generate ID
const eventData = {
  name,
  token,
  adminToken,
  status: 'active',
  createdAt: FieldValue.serverTimestamp()
};

await eventRef.set(eventData);

const newEvent = {
  id: eventRef.id,
  ...eventData,
  createdAt: new Date() // For immediate use
};
```

**Firestore (Custom ID)**:
```typescript
const eventId = generateCustomId(); // Your function
const eventRef = db.collection('events').doc(eventId);

await eventRef.set({
  name,
  token,
  adminToken,
  status: 'active',
  createdAt: FieldValue.serverTimestamp()
});
```

**Key Points**:
- `.doc()` without param = auto-generate ID
- `.doc(customId)` = use custom ID
- `.set()` creates or overwrites
- Use `FieldValue.serverTimestamp()` for server time

---

### 7. UPDATE Document

**PostgreSQL**:
```typescript
const result = await db.query(
  'UPDATE events SET status = $1, finalized_at = $2 WHERE id = $3 RETURNING *',
  ['completed', new Date(), eventId]
);
const updatedEvent = result.rows[0];
```

**Firestore (Full Update)**:
```typescript
const eventRef = db.collection('events').doc(eventId);

await eventRef.update({
  status: 'completed',
  finalizedAt: FieldValue.serverTimestamp()
});

// Get updated document
const updatedDoc = await eventRef.get();
const updatedEvent = { id: updatedDoc.id, ...updatedDoc.data() };
```

**Firestore (Partial Update)**:
```typescript
// Only updates specified fields
await eventRef.update({
  status: 'completed'
});
```

**Firestore (Set with Merge)**:
```typescript
// Creates if doesn't exist, merges if exists
await eventRef.set({
  status: 'completed',
  finalizedAt: FieldValue.serverTimestamp()
}, { merge: true });
```

**Key Points**:
- `.update()` fails if document doesn't exist
- `.set({ merge: true })` creates if missing
- Use `FieldValue.serverTimestamp()` for timestamps
- Need separate `.get()` to retrieve updated data

---

### 8. DELETE Document

**PostgreSQL**:
```typescript
await db.query('DELETE FROM scores WHERE team_id = $1', [teamId]);
await db.query('DELETE FROM teams WHERE id = $1', [teamId]);
```

**Firestore (Single)**:
```typescript
await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .doc(teamId)
  .delete();
```

**Firestore (Batch Delete)**:
```typescript
// Delete all scores in a team
const scoresSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .doc(teamId)
  .collection('scores')
  .get();

// Batch delete (max 500 per batch)
const batch = db.batch();
scoresSnapshot.docs.forEach(doc => {
  batch.delete(doc.ref);
});
await batch.commit();

// Then delete team
await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .doc(teamId)
  .delete();
```

**Key Points**:
- `.delete()` for single document
- Use batch for multiple deletes (max 500)
- Deleting document doesn't delete subcollections (must delete manually)

---

### 9. COUNT and Aggregations

**PostgreSQL**:
```typescript
const result = await db.query(
  'SELECT COUNT(*) as count FROM teams WHERE event_id = $1',
  [eventId]
);
const count = parseInt(result.rows[0].count);
```

**Firestore (Get All - Small Collections)**:
```typescript
const teamsSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .get();

const count = teamsSnapshot.size;
```

**Firestore (Count Aggregation - Firebase 9.17+)**:
```typescript
import { getCountFromServer } from 'firebase/firestore';

const snapshot = await getCountFromServer(
  db.collection('events')
    .doc(eventId)
    .collection('teams')
);

const count = snapshot.data().count;
```

**Key Points**:
- For small collections, use `.size` on snapshot
- For large collections, use `getCountFromServer()` (Firebase 9.17+)
- Store counts as fields for real-time display (update via transactions)

---

## 🔄 Transaction Patterns

### PostgreSQL Transaction

**PostgreSQL**:
```typescript
const client = await db.connect();

try {
  await client.query('BEGIN');
  
  // Update team points
  await client.query(
    'UPDATE teams SET total_points = total_points + $1 WHERE id = $2',
    [points, teamId]
  );
  
  // Insert score
  await client.query(
    'INSERT INTO scores (team_id, points, category) VALUES ($1, $2, $3)',
    [teamId, points, category]
  );
  
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Firestore Transaction

**Firestore**:
```typescript
await db.runTransaction(async (transaction) => {
  // 1. Read phase (all reads first)
  const teamRef = db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId);
  
  const teamDoc = await transaction.get(teamRef);
  
  if (!teamDoc.exists) {
    throw new Error('Team not found');
  }
  
  const currentPoints = teamDoc.data().totalPoints || 0;
  
  // 2. Write phase (all writes after reads)
  const scoreRef = teamRef.collection('scores').doc();
  
  transaction.update(teamRef, {
    totalPoints: currentPoints + points,
    updatedAt: FieldValue.serverTimestamp()
  });
  
  transaction.set(scoreRef, {
    points,
    category,
    dayNumber,
    createdAt: FieldValue.serverTimestamp()
  });
  
  // Transaction automatically commits or retries on conflict
});
```

**Key Points**:
- **All reads before writes** - Firestore requirement
- Automatic retry on conflicts
- Max 500 operations per transaction
- Transaction timeout: 270 seconds
- No explicit COMMIT/ROLLBACK needed

---

### Batch Operations (Non-Transactional)

**Use for**: Multiple writes that don't need to be read first

```typescript
const batch = db.batch();

// Add multiple operations
const team1Ref = db.collection('events').doc(eventId).collection('teams').doc(team1Id);
const team2Ref = db.collection('events').doc(eventId).collection('teams').doc(team2Id);

batch.update(team1Ref, { totalPoints: 100 });
batch.update(team2Ref, { totalPoints: 200 });

// Commit all at once (atomic)
await batch.commit();
```

**Key Points**:
- Use batch for write-only operations
- Max 500 operations per batch
- Faster than individual writes
- All succeed or all fail (atomic)

---

## ❌ Error Handling

### PostgreSQL Error Handling

```typescript
try {
  const result = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
  
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  
  // Handle result
} catch (error) {
  console.error('Database error:', error);
  
  if (error.code === '23505') {
    return NextResponse.json({ error: 'Duplicate entry' }, { status: 409 });
  }
  
  return NextResponse.json({ error: 'Database error' }, { status: 500 });
}
```

### Firestore Error Handling

```typescript
try {
  const eventDoc = await db.collection('events').doc(eventId).get();
  
  if (!eventDoc.exists) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }
  
  // Handle document
} catch (error: any) {
  console.error('Firestore error:', error);
  
  // Check Firebase error codes
  if (error.code === 'permission-denied') {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
  }
  
  if (error.code === 'not-found') {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }
  
  if (error.code === 'already-exists') {
    return NextResponse.json({ error: 'Document already exists' }, { status: 409 });
  }
  
  if (error.code === 'deadline-exceeded') {
    return NextResponse.json({ error: 'Request timeout' }, { status: 504 });
  }
  
  return NextResponse.json({ 
    error: 'Database error',
    details: error.message 
  }, { status: 500 });
}
```

### Common Firebase Error Codes

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `permission-denied` | Firestore rules blocked request | 403 |
| `not-found` | Document doesn't exist | 404 |
| `already-exists` | Document already exists | 409 |
| `invalid-argument` | Invalid data format | 400 |
| `deadline-exceeded` | Request timeout | 504 |
| `resource-exhausted` | Quota exceeded | 429 |
| `unauthenticated` | Missing auth | 401 |
| `unavailable` | Service unavailable | 503 |

---

## ⚠️ Common Pitfalls

### 1. Forgetting Document ID

❌ **Wrong**:
```typescript
const eventDoc = await db.collection('events').doc(eventId).get();
const event = eventDoc.data(); // Missing ID!
```

✅ **Correct**:
```typescript
const eventDoc = await db.collection('events').doc(eventId).get();
const event = { id: eventDoc.id, ...eventDoc.data() };
```

---

### 2. Not Checking .exists

❌ **Wrong**:
```typescript
const eventDoc = await db.collection('events').doc(eventId).get();
const event = eventDoc.data(); // Can be undefined!
```

✅ **Correct**:
```typescript
const eventDoc = await db.collection('events').doc(eventId).get();

if (!eventDoc.exists) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

const event = { id: eventDoc.id, ...eventDoc.data() };
```

---

### 3. Using .get() in Transactions (Wrong Order)

❌ **Wrong**:
```typescript
await db.runTransaction(async (transaction) => {
  const teamRef = db.collection('teams').doc(teamId);
  
  transaction.update(teamRef, { totalPoints: 100 }); // Write first
  const teamDoc = await transaction.get(teamRef); // Read after - ERROR!
});
```

✅ **Correct**:
```typescript
await db.runTransaction(async (transaction) => {
  const teamRef = db.collection('teams').doc(teamId);
  
  const teamDoc = await transaction.get(teamRef); // Read first
  transaction.update(teamRef, { totalPoints: 100 }); // Write after - OK!
});
```

---

### 4. Forgetting to Convert Timestamps

❌ **Wrong**:
```typescript
const event = eventDoc.data();
console.log(event.createdAt); // Firestore Timestamp object
```

✅ **Correct**:
```typescript
const event = {
  id: eventDoc.id,
  ...eventDoc.data(),
  createdAt: eventDoc.data().createdAt?.toDate() || null
};
```

---

### 5. Not Deleting Subcollections

❌ **Wrong**:
```typescript
// Only deletes team document, scores remain orphaned!
await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .doc(teamId)
  .delete();
```

✅ **Correct**:
```typescript
// Delete all scores first
const scoresSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .doc(teamId)
  .collection('scores')
  .get();

const batch = db.batch();
scoresSnapshot.docs.forEach(doc => batch.delete(doc.ref));
await batch.commit();

// Then delete team
await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .doc(teamId)
  .delete();
```

---

## 🚀 Performance Optimization

### 1. Use Subcollections for Hierarchical Data

✅ **Good Structure**:
```
events/{eventId}/teams/{teamId}/scores/{scoreId}
```

❌ **Bad Structure**:
```
scores/{scoreId} with eventId and teamId fields
```

**Why**: Subcollections are automatically scoped, reducing query complexity and improving security.

---

### 2. Store Aggregated Values

✅ **Store Total**:
```typescript
// Update team's totalPoints when adding score
await db.runTransaction(async (transaction) => {
  const teamRef = db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc(teamId);
  
  const teamDoc = await transaction.get(teamRef);
  const currentTotal = teamDoc.data().totalPoints || 0;
  
  transaction.update(teamRef, {
    totalPoints: currentTotal + points
  });
});
```

❌ **Calculate Every Time**:
```typescript
// Slow - queries all scores every request
const scoresSnapshot = await db.collection('scores')
  .where('teamId', '==', teamId)
  .get();

const total = scoresSnapshot.docs.reduce(
  (sum, doc) => sum + doc.data().points,
  0
);
```

---

### 3. Use .limit() for Single Results

✅ **With Limit**:
```typescript
const snapshot = await db.collection('events')
  .where('token', '==', token)
  .limit(1)
  .get();
```

❌ **Without Limit**:
```typescript
const snapshot = await db.collection('events')
  .where('token', '==', token)
  .get(); // Might scan thousands of documents
```

---

### 4. Batch Operations When Possible

✅ **Batch**:
```typescript
const batch = db.batch();

teams.forEach(team => {
  const teamRef = db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc();
  batch.set(teamRef, team);
});

await batch.commit(); // Single network call
```

❌ **Individual**:
```typescript
for (const team of teams) {
  await db.collection('events')
    .doc(eventId)
    .collection('teams')
    .doc()
    .set(team); // Multiple network calls
}
```

---

### 5. Parallel Queries with Promise.all()

✅ **Parallel**:
```typescript
const [teamsSnapshot, scoresSnapshot] = await Promise.all([
  db.collection('events').doc(eventId).collection('teams').get(),
  db.collection('events').doc(eventId).collection('scores').get()
]);
```

❌ **Sequential**:
```typescript
const teamsSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('teams')
  .get();

const scoresSnapshot = await db.collection('events')
  .doc(eventId)
  .collection('scores')
  .get();
```

---

## 📊 Query Complexity Comparison

| Operation | PostgreSQL | Firestore | Notes |
|-----------|-----------|-----------|-------|
| Get by ID | O(1) | O(1) | Equal performance |
| WHERE single field | O(n) | O(log n) | Firestore faster with index |
| WHERE multiple fields | O(n) | O(log n) | Requires composite index |
| JOIN 2 tables | O(n×m) | N/A | Use subcollections instead |
| ORDER BY + LIMIT | O(n log n) | O(log n) | Firestore much faster |
| COUNT | O(n) | O(1) | With stored count |
| Aggregations (SUM) | O(n) | O(n) | Store aggregates when possible |

---

## 🎯 Migration Checklist

For each route:

- [ ] Identify all PostgreSQL queries
- [ ] Map table relationships to subcollections
- [ ] Convert SELECT queries to .get()
- [ ] Convert WHERE clauses to .where()
- [ ] Convert INSERT to .set() or .add()
- [ ] Convert UPDATE to .update()
- [ ] Convert DELETE to .delete()
- [ ] Handle JOINs with subcollections or parallel queries
- [ ] Replace transactions with db.runTransaction()
- [ ] Update error handling for Firebase error codes
- [ ] Add .exists checks for all .get() calls
- [ ] Include document IDs in results
- [ ] Test with actual data
- [ ] Verify security rules allow operation

---

## 📚 Quick Reference

### Import Statement
```typescript
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
```

### Common Patterns Cheat Sheet

```typescript
// Get single document
const doc = await db.collection('events').doc(id).get();
const data = { id: doc.id, ...doc.data() };

// Query with filter
const snapshot = await db.collection('events')
  .where('status', '==', 'active')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();
const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// Create document
const ref = db.collection('events').doc();
await ref.set({ name: 'Test', createdAt: FieldValue.serverTimestamp() });

// Update document
await db.collection('events').doc(id).update({ status: 'completed' });

// Delete document
await db.collection('events').doc(id).delete();

// Transaction
await db.runTransaction(async (transaction) => {
  const doc = await transaction.get(ref);
  transaction.update(ref, { count: (doc.data().count || 0) + 1 });
});

// Batch
const batch = db.batch();
batch.set(ref1, data1);
batch.update(ref2, data2);
await batch.commit();
```

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete Reference Guide
