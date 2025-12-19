# 🎯 IMMEDIATE ACTION PLAN

**Phase:** S2 — Database Schema & Permissions  
**Status:** Code Review Complete | Manual Configuration Pending  
**Date:** December 19, 2025  
**Owner:** You (manual Appwrite Console tasks)

---

## ⚡ PRIORITY 1: CRITICAL FIX (Do First!)

### 🔴 Add `user_id` to Scores Collection

**Why:** Your code queries this field — will crash without it  
**Location in Code:** [lib/services/appwriteScores.ts](lib/services/appwriteScores.ts) line 204

**Quick Action:**
1. Open Appwrite Console: https://cloud.appwrite.io/console
2. Navigate: Databases → main → scores → Attributes
3. Click **Create Attribute**
4. Fill in:
   - Attribute ID: `user_id`
   - Type: String
   - Size: 255
   - Required: ✅ YES
5. Click **Create**
6. Wait for green checkmark ✅

**Time:** 2-3 minutes

**Verify:** Look for `user_id` in the Attributes list

---

## 🔐 PRIORITY 2: CONFIGURE PERMISSIONS

**Why:** Secures data so users can't see each other's records  
**Model:** Collection Create=open | Document Read/Update/Delete=owner only

**Quick Reference Table:**

```
Collection          Create      Read        Update      Delete
─────────────────────────────────────────────────────────────────
events              role:users  (empty)     (empty)     (empty)
teams               role:users  (empty)     (empty)     (empty)
scores              role:users  (empty)     (empty)     (empty)
recaps              role:users  (empty)     (empty)     (empty)
share_links         role:users  role:any    (empty)     (empty)  ← PUBLIC
event_admins        role:users  (empty)     (empty)     (empty)
```

**Quick Action (Repeat for each collection):**

1. Open: Databases → main → **[COLLECTION_NAME]** → Settings
2. Find: Permissions section
3. Click: **Update Permissions**
4. Set values from table above (leave blank = empty)
5. Click: **Update**
6. Wait: Green checkmark ✅

**Collections to Configure:** 6  
**Time per Collection:** 1-2 minutes  
**Total Time:** 10-15 minutes

---

## ✅ PRIORITY 3: VERIFY RECAPS COLLECTION

**Why:** Ensures recap feature will work  
**Check:** Does collection exist with correct attributes?

**Quick Action:**

1. Open: Databases → main → recaps
2. Verify attributes exist:
   - [ ] `event_id` (String, 255)
   - [ ] `snapshot` (JSON)
   - [ ] `generated_at` (DateTime)
3. Verify indexes exist:
   - [ ] `idx_recaps_event_id`
   - [ ] `idx_recaps_generated_at`
4. If collection missing or incomplete, follow: [S2_3_RECAPS_VERIFICATION.md](S2_3_RECAPS_VERIFICATION.md)

**Time:** 5 minutes (verification) | 15 minutes (if creating)

---

## 📋 STEP-BY-STEP CHECKLIST

### Step 1: Add scores.user_id
- [ ] Navigate to scores collection
- [ ] Create attribute `user_id` (String, 255, Required)
- [ ] Verify attribute appears in list ✅

**Estimated Time:** 3 min  
**Status:** ⏳ NOT STARTED

### Step 2: Configure events Permissions
- [ ] Navigate to events collection Settings
- [ ] Set Create=`role:users`
- [ ] Leave Read/Update/Delete empty
- [ ] Click Update
- [ ] See green checkmark ✅

**Estimated Time:** 2 min  
**Status:** ⏳ NOT STARTED

### Step 3: Configure teams Permissions
- [ ] Navigate to teams collection Settings
- [ ] Set Create=`role:users`
- [ ] Leave Read/Update/Delete empty
- [ ] Click Update ✅

**Estimated Time:** 2 min  
**Status:** ⏳ NOT STARTED

### Step 4: Configure scores Permissions
- [ ] Navigate to scores collection Settings
- [ ] Set Create=`role:users`
- [ ] Leave Read/Update/Delete empty
- [ ] Click Update ✅

**Estimated Time:** 2 min  
**Status:** ⏳ NOT STARTED

### Step 5: Configure recaps Permissions
- [ ] Navigate to recaps collection Settings
- [ ] Set Create=`role:users`
- [ ] Leave Read/Update/Delete empty
- [ ] Click Update ✅

**Estimated Time:** 2 min  
**Status:** ⏳ NOT STARTED

### Step 6: Configure share_links Permissions (SPECIAL!)
- [ ] Navigate to share_links collection Settings
- [ ] Set Create=`role:users`
- [ ] Set Read=`role:any` ← PUBLIC
- [ ] Leave Update/Delete empty
- [ ] Click Update ✅

**Estimated Time:** 2 min  
**Status:** ⏳ NOT STARTED

### Step 7: Configure event_admins Permissions
- [ ] Navigate to event_admins collection Settings
- [ ] Set Create=`role:users`
- [ ] Leave Read/Update/Delete empty
- [ ] Click Update ✅

**Estimated Time:** 2 min  
**Status:** ⏳ NOT STARTED

### Step 8: Verify Recaps Collection
- [ ] Collection exists: recaps
- [ ] Attributes present:
  - [ ] `event_id`
  - [ ] `snapshot`
  - [ ] `generated_at`
- [ ] Indexes present:
  - [ ] `idx_recaps_event_id`
  - [ ] `idx_recaps_generated_at`
- [ ] Permissions set:
  - [ ] Create=`role:users`
  - [ ] Others empty

**Estimated Time:** 5 min  
**Status:** ⏳ NOT STARTED

### Step 9: Test After Configuration
- [ ] Try creating a score in app
- [ ] Check browser console for errors
- [ ] Verify permissions work (can't see other users' data)

**Estimated Time:** 5 min  
**Status:** ⏳ NOT STARTED

---

## 🎯 TOTAL ESTIMATED TIME: 30-40 minutes

```
Step 1: Add user_id attribute        3 min
Step 2-7: Configure 6 collections   14 min (2 min × 7)
Step 8: Verify recaps collection     5 min
Step 9: Testing                      5 min
─────────────────────────────────────────
TOTAL:                              27 min
```

---

## 🔗 DOCUMENTATION LINKS

**Detailed Guides:**
- [APPWRITE_CONSOLE_SETUP.md](APPWRITE_CONSOLE_SETUP.md) — Step-by-step screenshots for Tasks 1 & 2
- [S2_1_SCHEMA_AUDIT.md](S2_1_SCHEMA_AUDIT.md) — Why user_id is critical
- [S2_2_PERMISSIONS_CONFIG.md](S2_2_PERMISSIONS_CONFIG.md) — Permission philosophy
- [S2_3_RECAPS_VERIFICATION.md](S2_3_RECAPS_VERIFICATION.md) — Recaps collection guide
- [PHASE_S2_SUMMARY.md](PHASE_S2_SUMMARY.md) — Complete phase summary

---

## ✅ SUCCESS CRITERIA

After completing all steps, verify:

1. ✅ `user_id` exists in scores collection
2. ✅ All 6 collections have Create=`role:users`
3. ✅ share_links has public Read permission
4. ✅ Recaps collection exists with all attributes
5. ✅ App can create events/teams/scores without errors
6. ✅ Users can only see their own records
7. ✅ Public scoreboards work via share_links

---

## 🆘 NEED HELP?

### If you see errors:

**"Attribute user_id not found"**
→ Complete Step 1 above

**"Permission denied creating document"**
→ Check Create permission is set to `role:users` in Steps 2-7

**"Cannot see recaps"**
→ Follow Step 8 verification

**"Cannot read other users' events"**
→ This is CORRECT! Permissions working as designed.

---

## 🚀 AFTER COMPLETION

Once all manual tasks are done:
1. Let me know in chat
2. We proceed to Phase S3 — Testing
3. Full end-to-end auth + database testing

---

**Action Plan Created:** December 19, 2025  
**Ready to Start:** Anytime  
**Next Review:** After you complete manual tasks

**You've got this! 💪** The code is 100% ready, just needs console configuration.
