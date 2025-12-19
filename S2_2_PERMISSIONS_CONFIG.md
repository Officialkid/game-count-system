# S2.2 — COLLECTION PERMISSIONS CONFIGURATION

**Status:** ✅ CODE COMPLETE | ⏳ CONSOLE PENDING  
**Date:** December 19, 2025  
**CTO Rule:** Collection permissions = coarse | Document permissions = ownership

---

## 🎯 PERMISSION STRATEGY

### Coarse-Grained (Collection Level)
- **Create:** Any authenticated user can create documents
- **Read/Update/Delete:** Controlled at **document level** (not collection level)

### Fine-Grained (Document Level)
- Each document has explicit permissions for its owner
- Owner gets: Read, Update, Delete access via `user:{USER_ID}`

---

## 📋 COLLECTIONS TO CONFIGURE

### 1. **events** Collection

**Collection-Level Permissions:**
- ✅ Create: `role:users` (any authenticated user)
- ❌ Read: None (document-level only)
- ❌ Update: None (document-level only)
- ❌ Delete: None (document-level only)

**Document-Level Permissions** (set on creation):
```typescript
const permissions = [
  Permission.read(`user:${userId}`),
  Permission.update(`user:${userId}`),
  Permission.delete(`user:${userId}`),
];
```

**Verification:**
- [x] Code location: [lib/services/appwriteEvents.ts](lib/services/appwriteEvents.ts) line 94-98
- [x] Already implemented ✅

---

### 2. **teams** Collection

**Collection-Level Permissions:**
- ✅ Create: `role:users`
- ❌ Read: None (document-level only)
- ❌ Update: None (document-level only)
- ❌ Delete: None (document-level only)

**Document-Level Permissions** (set on creation):
```typescript
const permissions = [
  Permission.read(`user:${userId}`),
  Permission.update(`user:${userId}`),
  Permission.delete(`user:${userId}`),
];
```

**Verification:**
- [x] Code location: [lib/services/appwriteTeams.ts](lib/services/appwriteTeams.ts) line 61-65
- [x] Already implemented ✅

---

### 3. **scores** Collection ⚠️

**Collection-Level Permissions:**
- ✅ Create: `role:users`
- ❌ Read: None (document-level only)
- ❌ Update: None (document-level only)
- ❌ Delete: None (document-level only)

**Document-Level Permissions** (set on creation):
```typescript
const permissions = [
  Permission.read(`user:${userId}`),
  Permission.update(`user:${userId}`),
  Permission.delete(`user:${userId}`),
];
```

**Verification:**
- [x] Code location: [lib/services/appwriteScores.ts](lib/services/appwriteScores.ts) line 90-94
- [x] Already implemented ✅

---

### 4. **recaps** Collection

**Collection-Level Permissions:**
- ✅ Create: `role:users`
- ❌ Read: None (document-level only)
- ❌ Update: None (document-level only)
- ❌ Delete: None (document-level only)

**Document-Level Permissions** (set on creation):
```typescript
const permissions = [
  Permission.read(`user:${userId}`),
  Permission.update(`user:${userId}`),
  Permission.delete(`user:${userId}`),
];
```

**Verification:**
- [ ] Code location: [lib/services/appwriteRecaps.ts](lib/services/appwriteRecaps.ts) — **NEEDS CHECK**

---

### 5. **share_links** Collection (Special Case)

**Collection-Level Permissions:**
- ✅ Create: `role:users`
- ✅ Read: `role:any` (public read for share token validation)
- ❌ Update: None (document-level only)
- ❌ Delete: None (document-level only)

**Document-Level Permissions** (set on creation):
```typescript
const permissions = [
  Permission.read(Role.any()),  // Public read
  Permission.update(`user:${userId}`),
  Permission.delete(`user:${userId}`),
];
```

**Verification:**
- [ ] Code location: [lib/services/appwriteShareLinks.ts](lib/services/appwriteShareLinks.ts) — **NEEDS CHECK**

---

### 6. **event_admins** Collection (Special Case)

**Collection-Level Permissions:**
- ✅ Create: `role:users`
- ❌ Read: None (document-level only)
- ❌ Update: None (document-level only)
- ❌ Delete: None (document-level only)

**Document-Level Permissions** (set on creation):
```typescript
// Event owner permissions
const permissions = [
  Permission.read(`user:${eventOwnerId}`),
  Permission.update(`user:${eventOwnerId}`),
  Permission.delete(`user:${eventOwnerId}`),
];
```

**Verification:**
- [ ] Code location: [lib/services/appwriteAdmins.ts](lib/services/appwriteAdmins.ts) — **NEEDS CHECK**

---

## 🔍 CODE AUDIT RESULTS

### ✅ Correctly Configured Collections

1. **events** — Permissions set at lines 94-98 ✅
   ```typescript
   Permission.read(Role.user(userId)),
   Permission.update(Role.user(userId)),
   Permission.delete(Role.user(userId)),
   ```

2. **teams** — Permissions set at lines 61-65 ✅
   ```typescript
   Permission.read(Role.user(userId)),
   Permission.update(Role.user(userId)),
   Permission.delete(Role.user(userId)),
   ```

3. **scores** — Permissions set at lines 90-94 ✅
   ```typescript
   Permission.read(`user:${userId}`),
   Permission.update(`user:${userId}`),
   Permission.delete(`user:${userId}`),
   ```

4. **recaps** — Permissions set at lines 88-92 ✅
   ```typescript
   Permission.read(`user:${userId}`),
   Permission.update(`user:${userId}`),
   Permission.delete(`user:${userId}`),
   ```

5. **share_links** — Permissions set at lines 86-90 ✅ (PUBLIC READ)
   ```typescript
   Permission.read(Role.any()), // Public scoreboard access
   Permission.update(Role.user(userId)),
   Permission.delete(Role.user(userId)),
   ```

### ⚠️ Collections Needing Attention

1. **event_admins** — No `createDocument()` function found
   - Service only has `getAdmins()` and `removeAdmin()`
   - Missing: `addAdmin()` or `createAdmin()` function
   - **Action:** Will need to add create function with proper permissions when implementing

---

## 📝 APPWRITE CONSOLE CONFIGURATION

### Step-by-Step Instructions

For **events**, **teams**, **scores**, **recaps** collections:

1. Navigate to Appwrite Console → Databases → **main**
2. Click on collection (e.g., **events**)
3. Go to **Settings** tab
4. Scroll to **Permissions** section
5. Click **Update Permissions**
6. Configure as follows:

**Collection Permissions:**
- Create: Add `role:users`
- Read: **Leave empty** (document-level only)
- Update: **Leave empty** (document-level only)
- Delete: **Leave empty** (document-level only)

7. Click **Update**

For **share_links** collection:
- Create: `role:users`
- Read: `role:any` (public read)
- Update: **Leave empty**
- Delete: **Leave empty**

---

## 🧪 VERIFICATION CHECKLIST

### Code Verification
- [x] Events service sets document permissions ✅ (line 94-98)
- [x] Teams service sets document permissions ✅ (line 61-65)
- [x] Scores service sets document permissions ✅ (line 90-94)
- [x] Recaps service sets document permissions ✅ (line 88-92)
- [x] Share links service sets PUBLIC READ permissions ✅ (line 86-90)
- [x] Event admins service — No create function yet (only read/delete)

**Permission Code Compliance:** 100% (5/5 active services)

### Appwrite Console Verification
- [ ] **events** collection: Set Create=`role:users`, Read/Update/Delete=empty
- [ ] **teams** collection: Set Create=`role:users`, Read/Update/Delete=empty
- [ ] **scores** collection: Set Create=`role:users`, Read/Update/Delete=empty
- [ ] **recaps** collection: Set Create=`role:users`, Read/Update/Delete=empty
- [ ] **share_links** collection: Set Create=`role:users`, Read=`role:any`, Update/Delete=empty
- [ ] **event_admins** collection: Set Create=`role:users`, Read/Update/Delete=empty

**Console Configuration Status:** ⏳ Pending manual configuration

---

## ✅ PERMISSION SUMMARY

| Collection | Create | Read | Update | Delete | Status |
|------------|--------|------|--------|--------|--------|
| events | `role:users` | Document-level | Document-level | Document-level | ✅ Code ready |
| teams | `role:users` | Document-level | Document-level | Document-level | ✅ Code ready |
| scores | `role:users` | Document-level | Document-level | Document-level | ✅ Code ready |
| recaps | `role:users` | Document-level | Document-level | Document-level | ✅ Code ready |
| share_links | `role:users` | **`role:any`** | Document-level | Document-level | ✅ Code ready |
| event_admins | `role:users` | Document-level | Document-level | Document-level | ⚠️ No create function |

---

## 🎯 KEY FINDINGS

1. **All 5 active services properly implement document-level permissions** ✅
2. **share_links** correctly uses `Role.any()` for public read access ✅
3. **event_admins** service incomplete — missing create function (future work)
4. **Code follows CTO permission model exactly:**
   - Collection = coarse (create only)
   - Document = fine-grained ownership

---

## 🚀 NEXT STEPS

1. ✅ Code audit complete — All services properly implement permissions
2. ⏳ **Manual task:** Configure collection permissions in Appwrite Console:
   - Navigate to each collection settings
   - Set Create=`role:users`
   - Leave Read/Update/Delete empty (document-level control)
   - Exception: share_links Read=`role:any`
3. ⏳ Test CRUD operations after console configuration
4. ⏳ Verify document-level permissions work correctly
5. ⏳ Document any permission edge cases or issues

---

**Configuration Started:** December 19, 2025  
**Code Status:** ✅ 100% Compliant (5/5 services)  
**Console Status:** ⏳ Awaiting manual configuration
