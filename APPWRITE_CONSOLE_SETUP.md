# APPWRITE CONSOLE CONFIGURATION GUIDE

**Tasks:** S2.1 + S2.2 Manual Configuration  
**Date:** December 19, 2025  
**Estimated Time:** 10-15 minutes

---

## 🎯 TASK 1: Add `user_id` Attribute to Scores Collection

### Why This is Critical
Your code **actively queries** `user_id` at line 204 in appwriteScores.ts:
```typescript
Query.equal('user_id', userId),  // Will fail without attribute
```

### Step-by-Step Instructions

1. **Navigate to Appwrite Console**
   - Go to https://cloud.appwrite.io/console
   - Login with your credentials
   - Select project: **694164500028df77ada9**

2. **Open Scores Collection**
   - Click **Databases** in left sidebar
   - Click database: **main**
   - Click collection: **scores**

3. **Add user_id Attribute**
   - Click **Attributes** tab
   - Click **Create Attribute** button
   - Select type: **String**
   - Configure:
     ```
     Attribute ID:  user_id
     Size:          255
     Required:      ✅ YES
     Array:         ❌ NO
     Default:       (leave empty)
     ```
   - Click **Create**
   - Wait for attribute to be available (green checkmark)

4. **Add Index (Recommended)**
   - Click **Indexes** tab
   - Click **Create Index** button
   - Configure:
     ```
     Index Key:     idx_scores_user_id
     Type:          Key
     Attributes:    user_id
     Order:         ASC
     ```
   - Click **Create**

✅ **Verification:** Go back to Attributes tab and confirm `user_id` appears in the list

---

## 🎯 TASK 2: Configure Collection Permissions

### Permission Model (CTO Rule)
- **Collection Level:** Create only (`role:users`)
- **Document Level:** Read/Update/Delete (set in code)

### Collections to Configure

#### Collection 1: **events**

1. Click **Databases** → **main** → **events**
2. Click **Settings** tab
3. Scroll to **Permissions** section
4. Click **Update Permissions**
5. Configure:
   ```
   Create:  role:users
   Read:    (empty - leave blank)
   Update:  (empty - leave blank)
   Delete:  (empty - leave blank)
   ```
6. Click **Update**

---

#### Collection 2: **teams**

1. Click **Databases** → **main** → **teams**
2. Click **Settings** tab
3. Scroll to **Permissions** section
4. Click **Update Permissions**
5. Configure:
   ```
   Create:  role:users
   Read:    (empty - leave blank)
   Update:  (empty - leave blank)
   Delete:  (empty - leave blank)
   ```
6. Click **Update**

---

#### Collection 3: **scores**

1. Click **Databases** → **main** → **scores**
2. Click **Settings** tab
3. Scroll to **Permissions** section
4. Click **Update Permissions**
5. Configure:
   ```
   Create:  role:users
   Read:    (empty - leave blank)
   Update:  (empty - leave blank)
   Delete:  (empty - leave blank)
   ```
6. Click **Update**

---

#### Collection 4: **recaps**

1. Click **Databases** → **main** → **recaps**
2. Click **Settings** tab
3. Scroll to **Permissions** section
4. Click **Update Permissions**
5. Configure:
   ```
   Create:  role:users
   Read:    (empty - leave blank)
   Update:  (empty - leave blank)
   Delete:  (empty - leave blank)
   ```
6. Click **Update**

---

#### Collection 5: **share_links** ⚠️ SPECIAL CASE

1. Click **Databases** → **main** → **share_links**
2. Click **Settings** tab
3. Scroll to **Permissions** section
4. Click **Update Permissions**
5. Configure:
   ```
   Create:  role:users
   Read:    role:any        ← PUBLIC READ (for scoreboard access)
   Update:  (empty - leave blank)
   Delete:  (empty - leave blank)
   ```
6. Click **Update**

---

#### Collection 6: **event_admins**

1. Click **Databases** → **main** → **event_admins**
2. Click **Settings** tab
3. Scroll to **Permissions** section
4. Click **Update Permissions**
5. Configure:
   ```
   Create:  role:users
   Read:    (empty - leave blank)
   Update:  (empty - leave blank)
   Delete:  (empty - leave blank)
   ```
6. Click **Update**

---

## ✅ VERIFICATION CHECKLIST

### Task 1: Scores Attribute
- [ ] `user_id` attribute exists in scores collection
- [ ] Attribute type is String, size 255
- [ ] Attribute is marked as Required
- [ ] Index `idx_scores_user_id` created (optional but recommended)

### Task 2: Permissions Configuration
- [ ] **events** → Create: `role:users`, others empty
- [ ] **teams** → Create: `role:users`, others empty
- [ ] **scores** → Create: `role:users`, others empty
- [ ] **recaps** → Create: `role:users`, others empty
- [ ] **share_links** → Create: `role:users`, Read: `role:any`, others empty
- [ ] **event_admins** → Create: `role:users`, others empty

---

## 🧪 POST-CONFIGURATION TESTING

After completing both tasks, test the following:

### Test 1: Create a Score
```bash
# Open browser DevTools Console (F12)
# Navigate to https://localhost:3002 (logged in)

# This should work without errors now
fetch('/api/scores/add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event_id: 'your-event-id',
    team_id: 'your-team-id',
    game_number: 1,
    points: 100
  })
}).then(r => r.json()).then(console.log);
```

Expected: Success response with score data

### Test 2: Query Scores by User
```bash
# This query uses the new user_id attribute
# Should return scores created by current user
fetch('/api/scores/user-stats?days=7')
  .then(r => r.json())
  .then(console.log);
```

Expected: `{ count: N }` where N is score count

### Test 3: Verify Permissions
```bash
# Try to read another user's event (should fail)
# This tests document-level permissions
fetch('/api/events/some-other-users-event-id')
  .then(r => r.json())
  .then(console.log);
```

Expected: 401 Unauthorized or permission denied error

---

## 🚨 TROUBLESHOOTING

### Issue: "Attribute user_id not found"
**Solution:** Wait 30 seconds after creating attribute, Appwrite needs time to sync

### Issue: "Permission denied when creating document"
**Solution:** Check collection Create permission is set to `role:users`

### Issue: "Cannot read documents"
**Solution:** This is correct! Read permission is document-level only. Users can only read their own documents.

### Issue: "Share links not accessible publicly"
**Solution:** Verify share_links collection has Read=`role:any` in Console

---

## 📊 CONFIGURATION SUMMARY

| Collection | user_id Attr | Create Perm | Read Perm | Status |
|------------|--------------|-------------|-----------|--------|
| events | N/A | role:users | Document | ⏳ Pending |
| teams | N/A | role:users | Document | ⏳ Pending |
| **scores** | **REQUIRED** | role:users | Document | ⏳ Pending |
| recaps | N/A | role:users | Document | ⏳ Pending |
| share_links | N/A | role:users | **role:any** | ⏳ Pending |
| event_admins | N/A | role:users | Document | ⏳ Pending |

---

## 🎓 UNDERSTANDING THE PERMISSION MODEL

### Why Collection Create = role:users?
- Allows any authenticated user to create documents
- Fine-grained control happens at document level

### Why Read/Update/Delete are Empty?
- These permissions are set **per document** in code
- Example: `Permission.read('user:abc123')` means only user abc123 can read
- Prevents users from seeing each other's data

### Why share_links Read = role:any?
- Public scoreboards need to read share links without auth
- Token validation happens in application logic
- Only Create/Update/Delete restricted to owner

---

**Configuration Guide Created:** December 19, 2025  
**Estimated Completion Time:** 10-15 minutes  
**After Completion:** Mark tasks 7 and 9 as complete and proceed to testing
