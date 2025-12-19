# S2.3 — VERIFY & CREATE RECAPS COLLECTION

**Status:** 🔍 VERIFICATION GUIDE  
**Date:** December 19, 2025  
**Critical:** Must exist before recap feature can work

---

## 📋 COLLECTION REQUIREMENTS

### Collection ID: `recaps`
**Database:** `main`

### Required Attributes

| Attribute | Type | Size | Required | Purpose |
|-----------|------|------|----------|---------|
| `event_id` | String | 255 | ✅ Yes | Links recap to event |
| `snapshot` | JSON | — | ✅ Yes | Recap data (leaderboard, stats) |
| `generated_at` | DateTime | — | ✅ Yes | When recap was created |

### Indexes Required

| Index ID | Type | Attributes | Purpose |
|----------|------|-----------|---------|
| `idx_recaps_event_id` | Key | event_id | Query recaps by event |
| `idx_recaps_generated_at` | Key | generated_at | Sort by creation date |

### Permissions

| Permission | Value |
|-----------|-------|
| Create | `role:users` |
| Read | (empty - document-level) |
| Update | (empty - document-level) |
| Delete | (empty - document-level) |

---

## 🔍 VERIFICATION CHECKLIST

### Step 1: Check if Recaps Collection Exists

1. Go to Appwrite Console: https://cloud.appwrite.io/console
2. Login with your credentials
3. Select project: **694164500028df77ada9**
4. Click **Databases** in left sidebar
5. Click database: **main**
6. Look for collection: **recaps** in the list

### Result:
- ✅ **Collection exists** → Go to [Verification Step](#verification-step-check-attributes)
- ❌ **Collection missing** → Go to [Creation Instructions](#creation-instructions)

---

## ✅ VERIFICATION STEP: Check Attributes

If collection exists, verify attributes:

1. Click **recaps** collection
2. Click **Attributes** tab
3. Confirm these attributes exist:
   - [ ] `event_id` (String, 255, Required)
   - [ ] `snapshot` (JSON, Required)
   - [ ] `generated_at` (DateTime, Required)

**If any attribute is missing:**
- Follow [Add Missing Attributes](#add-missing-attributes) section

4. Click **Indexes** tab
5. Confirm these indexes exist:
   - [ ] `idx_recaps_event_id`
   - [ ] `idx_recaps_generated_at`

**If any index is missing:**
- Follow [Add Missing Indexes](#add-missing-indexes) section

6. Click **Settings** tab
7. Scroll to **Permissions** section
8. Verify:
   - [ ] Create: `role:users`
   - [ ] Read: (empty)
   - [ ] Update: (empty)
   - [ ] Delete: (empty)

**If permissions incorrect:**
- Follow [Fix Permissions](#fix-permissions) section

---

## 🆕 CREATION INSTRUCTIONS

### If Collection Does NOT Exist

1. Click **Databases** → **main**
2. Click **Create Collection** button
3. Configure:
   ```
   Collection ID:  recaps
   Name:          Recaps
   Encrypt:       ❌ NO
   ```
4. Click **Create**
5. Wait for collection to be created (green checkmark)

### Add Required Attributes

Follow [Add Attributes](#add-required-attributes) section below

---

## ➕ ADD REQUIRED ATTRIBUTES

1. Click **recaps** collection → **Attributes** tab
2. Click **Create Attribute** button

### Attribute 1: event_id

1. Select type: **String**
2. Configure:
   ```
   Attribute ID:  event_id
   Size:          255
   Required:      ✅ YES
   Array:         ❌ NO
   Encrypt:       ❌ NO
   Default:       (leave empty)
   ```
3. Click **Create**
4. Wait for green checkmark

### Attribute 2: snapshot

1. Click **Create Attribute** button
2. Select type: **JSON**
3. Configure:
   ```
   Attribute ID:  snapshot
   Required:      ✅ YES
   Array:         ❌ NO
   Encrypt:       ❌ NO
   Default:       (leave empty)
   ```
4. Click **Create**
5. Wait for green checkmark

### Attribute 3: generated_at

1. Click **Create Attribute** button
2. Select type: **DateTime**
3. Configure:
   ```
   Attribute ID:  generated_at
   Required:      ✅ YES
   Array:         ❌ NO
   Default:       (leave empty)
   ```
4. Click **Create**
5. Wait for green checkmark

✅ **Verification:** All 3 attributes should appear in Attributes list

---

## 🔍 ADD MISSING INDEXES

1. Click **recaps** collection → **Indexes** tab
2. Click **Create Index** button

### Index 1: idx_recaps_event_id

1. Configure:
   ```
   Index Key:     idx_recaps_event_id
   Type:          Key
   Attributes:    event_id
   Order:         ASC
   ```
2. Click **Create**
3. Wait for green checkmark

### Index 2: idx_recaps_generated_at

1. Click **Create Index** button
2. Configure:
   ```
   Index Key:     idx_recaps_generated_at
   Type:          Key
   Attributes:    generated_at
   Order:         DESC
   ```
3. Click **Create**
4. Wait for green checkmark

✅ **Verification:** Both indexes should appear in Indexes list

---

## 🔐 FIX PERMISSIONS

If permissions are incorrect:

1. Click **recaps** collection → **Settings** tab
2. Scroll to **Permissions** section
3. Click **Update Permissions**
4. Configure:
   ```
   Create:  role:users
   Read:    (empty - leave blank)
   Update:  (empty - leave blank)
   Delete:  (empty - leave blank)
   ```
5. Click **Update**

---

## 📝 CODE USAGE SUMMARY

### Why Recaps Collection is Needed

**File:** [lib/services/appwriteRecaps.ts](lib/services/appwriteRecaps.ts)

**Functions that use recaps:**
1. `getSummary()` — Gets latest recap for dashboard
2. `createRecap()` — Creates event recap after completion
3. `getRecap()` — Fetches specific recap
4. `getEventRecaps()` — Lists all recaps for an event
5. `getLatestRecap()` — Gets most recent recap
6. `deleteRecap()` — Removes recap

**Attributes used:**
- ✅ `event_id` — Query: `Query.equal('event_id', eventId)` (3 functions)
- ✅ `generated_at` — Order: `Query.orderDesc('generated_at')` (2 functions)
- ✅ `snapshot` — JSON data storage for recap statistics

---

## 📊 SNAPSHOT DATA STRUCTURE

The `snapshot` attribute stores complex recap data:

```json
{
  "event_id": "abc123",
  "event_name": "Game Night 2025",
  "total_games": 5,
  "total_teams": 3,
  "final_leaderboard": [
    {
      "team_id": "team1",
      "team_name": "Team A",
      "total_points": 150,
      "rank": 1
    },
    {
      "team_id": "team2",
      "team_name": "Team B",
      "total_points": 120,
      "rank": 2
    },
    {
      "team_id": "team3",
      "team_name": "Team C",
      "total_points": 100,
      "rank": 3
    }
  ],
  "top_scorer": {
    "team_id": "team1",
    "team_name": "Team A",
    "total_points": 150
  },
  "winner": {
    "team_id": "team1",
    "team_name": "Team A",
    "total_points": 150
  },
  "highlights": [
    "Team A dominated with 150 points",
    "Closest competition between Team B and C"
  ]
}
```

Appwrite's JSON type handles this automatically ✅

---

## ✅ POST-CREATION TESTING

After creating/verifying collection, test:

### Test 1: Create a Recap
```typescript
// Browser DevTools Console (F12)
const snapshot = {
  event_id: "test-event",
  event_name: "Test Event",
  total_games: 3,
  total_teams: 2,
  final_leaderboard: [
    { team_id: "t1", team_name: "Team A", total_points: 100, rank: 1 },
    { team_id: "t2", team_name: "Team B", total_points: 80, rank: 2 }
  ]
};

fetch('/api/recaps/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: 'test-event', snapshot })
}).then(r => r.json()).then(console.log);
```

Expected: Success with recap document ID

### Test 2: Query Recaps by Event
```typescript
fetch('/api/recaps/event/test-event')
  .then(r => r.json())
  .then(console.log);
```

Expected: Array of recap documents

### Test 3: Get Latest Recap
```typescript
fetch('/api/recaps/latest/test-event')
  .then(r => r.json())
  .then(console.log);
```

Expected: Most recent recap for the event

---

## 🚨 TROUBLESHOOTING

### Issue: "Collection recaps not found"
**Cause:** Collection doesn't exist  
**Solution:** Follow [Creation Instructions](#creation-instructions)

### Issue: "Attribute snapshot not found"
**Cause:** JSON attribute not created  
**Solution:** Follow [Add Required Attributes](#add-required-attributes) section, specifically Attribute 2

### Issue: "Cannot query event_id"
**Cause:** Attribute exists but no index  
**Solution:** Follow [Add Missing Indexes](#add-missing-indexes) section

### Issue: "Permission denied creating recap"
**Cause:** Collection Create permission not set correctly  
**Solution:** Follow [Fix Permissions](#fix-permissions) section

---

## 📋 FINAL CHECKLIST

- [ ] Recaps collection exists in Appwrite Console
- [ ] Attribute `event_id` (String, 255, Required) exists
- [ ] Attribute `snapshot` (JSON, Required) exists
- [ ] Attribute `generated_at` (DateTime, Required) exists
- [ ] Index `idx_recaps_event_id` exists
- [ ] Index `idx_recaps_generated_at` exists
- [ ] Collection permissions: Create=`role:users`, others empty
- [ ] Test 1 (create recap) passes
- [ ] Test 2 (query by event) passes
- [ ] Test 3 (get latest) passes

---

**Verification Guide Created:** December 19, 2025  
**Status:** Ready for manual verification in Appwrite Console  
**Time to Complete:** 5-10 minutes (if collection exists) | 15-20 minutes (if creating new)
