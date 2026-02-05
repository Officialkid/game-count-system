# Database Migration: PostgreSQL → Firebase
**Complete Guide: Schema, Migration, and Setup**

---

## 📋 TABLE OF CONTENTS

1. [Migration Overview](#migration-overview)
2. [Firebase Setup](#firebase-setup)
3. [Schema Design](#schema-design)
4. [Migration Scripts](#migration-scripts)
5. [Quick Migration Steps](#quick-migration-steps)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 MIGRATION OVERVIEW

### What Changed
- **From**: PostgreSQL with Prisma ORM
- **To**: Firebase Firestore NoSQL database
- **Reason**: Better real-time capabilities, simpler deployment, lower cost

### Migration Results
- ✅ All data preserved (events, teams, scores, games)
- ✅ Real-time updates enabled
- ✅ Token authentication migrated
- ✅ Event lifecycle maintained
- ✅ Zero downtime migration possible

---

## 🔥 FIREBASE SETUP

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Name: "game-count-system"
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Get Configuration
1. In Firebase Console, click ⚙️ Settings → Project Settings
2. Scroll to "Your apps" → Click Web icon (</>) 
3. Register app: "Game Count Web"
4. Copy the `firebaseConfig` object

### Step 3: Generate Service Account
1. In Firebase Console: ⚙️ Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as `firebase-service-account.json` in project root
4. **IMPORTANT**: Add to `.gitignore` (never commit this!)

### Step 4: Environment Variables
Create `.env.local`:
```env
# Firebase Configuration (from Web App config)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=game-count-system.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=game-count-system
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=game-count-system.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456:web:abc123

# Firebase Admin SDK (from Service Account JSON)
FIREBASE_PROJECT_ID=game-count-system
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@game-count-system.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Note**: Replace `\n` in private key with actual newlines or keep as `\n` (both work)

### Step 5: Firestore Rules
Create `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for scoreboard (viewer_token validated in code)
    match /events/{eventId} {
      allow read: if true;
      allow write: if false; // Admin operations via server
    }
    
    match /teams/{teamId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /scores/{scoreId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /games/{gameId} {
      allow read: if true;
      allow write: if false;
    }
    
    match /event_days/{dayId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## 📊 SCHEMA DESIGN

### Collection: `events`
```typescript
{
  id: string;                    // Auto-generated document ID
  name: string;                  // Event name (3-100 chars)
  description?: string;          // Optional description
  number_of_days: number;        // 1, 2, or 3 days
  created_at: Timestamp;         // Firestore Timestamp
  updated_at: Timestamp;
  
  // CRITICAL FIX #2: Event Mode Architecture
  event_mode: 'quick' | 'custom'; // Quick (temporary) or Custom (permanent)
  
  // CRITICAL FIX #3: Token System
  admin_token: string;           // 32-char hex (admin access)
  scorer_token: string;          // 32-char hex (scoring access)
  viewer_token: string;          // 32-char hex (view-only access)
  
  // CRITICAL FIX #4: Event Lifecycle
  event_status: 'draft' | 'active' | 'completed' | 'archived';
  start_date?: Timestamp;        // Event start time
  end_date?: Timestamp;          // Event end time
  completion_date?: Timestamp;   // When status changed to completed
  
  // CRITICAL FIX #2: Auto-Cleanup
  auto_cleanup_date?: Timestamp; // For quick events (7 days after creation)
}
```

### Collection: `teams`
```typescript
{
  id: string;
  name: string;                  // Team name (2-50 chars)
  color: string;                 // Hex color (#RRGGBB)
  event_id: string;              // Reference to parent event
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Collection: `scores`
```typescript
{
  id: string;
  event_id: string;              // Reference to event
  team_id: string;               // Reference to team
  game_id?: string;              // Optional reference to game
  day?: number;                  // Day number (1, 2, or 3)
  points: number;                // Raw points scored
  penalty: number;               // Penalty points (0 or negative)
  final_score: number;           // points + penalty (can be negative)
  notes?: string;                // Optional notes
  created_at: Timestamp;
  updated_at: Timestamp;
  
  // CRITICAL FIX #5: Day Locking
  submitted_by: 'admin' | 'scorer'; // Who submitted the score
}
```

### Collection: `games`
```typescript
{
  id: string;
  name: string;                  // Game name
  event_id?: string;             // Optional: link to specific event
  is_global: boolean;            // true = available to all events
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Collection: `event_days`
```typescript
{
  id: string;
  event_id: string;
  day_number: number;            // 1, 2, or 3
  is_locked: boolean;            // CRITICAL FIX #5: Day locking
  locked_at?: Timestamp;
  locked_by?: string;            // admin_token who locked it
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Indexes Required
```
Collection: scores
- Composite: event_id ASC, created_at DESC
- Composite: event_id ASC, team_id ASC
- Composite: event_id ASC, day ASC
- Composite: team_id ASC, created_at DESC

Collection: teams
- Composite: event_id ASC, created_at ASC

Collection: event_days
- Composite: event_id ASC, day_number ASC
```

---

## 🚀 MIGRATION SCRIPTS

### Script 1: Full Migration
**File**: `migrate-pg-to-firebase.js`

Migrates all data from PostgreSQL to Firebase.

```bash
node migrate-pg-to-firebase.js
```

**What it does**:
1. Connects to PostgreSQL
2. Fetches all events, teams, scores, games
3. Creates Firebase collections
4. Copies data with schema transformation
5. Preserves relationships (event_id, team_id references)

### Script 2: Add Event Modes
**File**: `migrate-add-event-modes.js`

Adds `event_mode` field to existing events.

```bash
node migrate-add-event-modes.js
```

**What it does**:
1. Scans all events in Firestore
2. Adds `event_mode: 'custom'` (default for existing events)
3. Adds `auto_cleanup_date: null`

---

## ⚡ QUICK MIGRATION STEPS

### For New Project (No Existing Data)
```bash
# 1. Install dependencies
npm install firebase firebase-admin

# 2. Setup Firebase project (see Firebase Setup section)

# 3. Create .env.local with Firebase credentials

# 4. Test connection
node test-firebase-connection.js

# 5. Deploy Firestore rules
firebase deploy --only firestore:rules

# 6. Done! Start development
npm run dev
```

### For Existing PostgreSQL Database
```bash
# 1. Backup PostgreSQL database
pg_dump your_database > backup.sql

# 2. Setup Firebase project (see Firebase Setup section)

# 3. Run migration script
node migrate-pg-to-firebase.js

# 4. Verify migration
# - Check Firestore console for data
# - Test all API routes
# - Verify real-time updates work

# 5. Add event modes (if migrating old events)
node migrate-add-event-modes.js

# 6. Test thoroughly before switching production

# 7. Update environment variables in production (Vercel/Render)

# 8. Deploy
npm run build
vercel --prod
```

---

## 🐛 TROUBLESHOOTING

### Error: "Failed to parse private key"
**Problem**: `FIREBASE_PRIVATE_KEY` not formatted correctly

**Solution**: Ensure newlines are preserved
```env
# Option 1: Use actual newlines (not \n)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhki...
-----END PRIVATE KEY-----"

# Option 2: Use \n escape sequences
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhki...\n-----END PRIVATE KEY-----\n"
```

### Error: "Permission denied" in Firestore
**Problem**: Firestore rules too restrictive

**Solution**: Update `firestore.rules` to allow public read:
```javascript
match /events/{eventId} {
  allow read: if true; // Allow public read
  allow write: if false; // Server-side writes only
}
```

### Error: "Collection not found"
**Problem**: Trying to query empty collection

**Solution**: Firestore creates collections on first write. Insert test data:
```javascript
await db.collection('events').add({
  name: 'Test Event',
  number_of_days: 1,
  created_at: new Date()
});
```

### Slow Queries
**Problem**: Missing Firestore indexes

**Solution**: Check console for index creation links. Common indexes needed:
```
scores: event_id ASC, created_at DESC
teams: event_id ASC, name ASC
```

### Migration Script Hangs
**Problem**: Large dataset causing timeout

**Solution**: Batch the migration:
```javascript
// Process in batches of 500
const batchSize = 500;
for (let i = 0; i < totalRecords; i += batchSize) {
  const batch = records.slice(i, i + batchSize);
  await Promise.all(batch.map(record => migrateRecord(record)));
  console.log(`Migrated ${i + batchSize}/${totalRecords}`);
}
```

### Data Not Appearing in Real-Time
**Problem**: Not using `onSnapshot()` for subscriptions

**Solution**: Use real-time listeners:
```typescript
import { onSnapshot, collection, query, where } from 'firebase/firestore';

const q = query(collection(db, 'scores'), where('event_id', '==', eventId));
const unsubscribe = onSnapshot(q, (snapshot) => {
  const scores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setScores(scores);
});

// Cleanup on unmount
return () => unsubscribe();
```

---

## 📚 Related Documentation

- **Real-Time Updates**: See `00-CRITICAL-FIX-7-REALTIME.md`
- **Event Lifecycle**: See `00-CRITICAL-FIX-4-LIFECYCLE-COMPLETE.md`
- **Quick Create**: See `00-CRITICAL-FIX-6-QUICK-CREATE-COMPLETE.md`
- **Day Locking**: See `00-CRITICAL-FIX-5-DAY-LOCKING-COMPLETE.md`

---

**Migration Complete!** 🎉

Your Game Count System is now running on Firebase with real-time capabilities.
