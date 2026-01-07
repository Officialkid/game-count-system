# 🔄 FRONTEND REFACTORING STATUS

**Date:** January 6, 2026  
**Migration:** Appwrite → PostgreSQL + Token-Based Access

---

## ✅ COMPLETED: Core Infrastructure

### Files Successfully Refactored

1. **`lib/api-client.ts`** ✅
   - **Before:** Imported Appwrite Functions SDK
   - **After:** Clean REST API client with custom headers
   - **Features:**
     - `createEvent()` - POST /api/events
     - `addTeam()` - POST /api/events/:id/teams (X-ADMIN-TOKEN)
     - `addScore()` - POST /api/events/:id/scores (X-SCORER-TOKEN)
     - `lockDay()` - POST /api/events/:id/days/:n/lock
     - `getPublicScoreboard()` - GET /events/:public_token

2. **`app/api/health/route.ts`** ✅
   - **Before:** Checked Appwrite database connectivity
   - **After:** PostgreSQL health check using `lib/db-client`
   - **Status:** Production-ready

3. **`lib/hooks/useEventStream.ts`** ✅
   - **Before:** Appwrite Realtime subscription
   - **After:** Polling-based scoreboard updates (5-second intervals)
   - **Future:** Can be upgraded to SSE or WebSockets
   - **API:** Now accepts `publicToken` instead of `eventId`

### Files Deleted (Auth-Only)

- ❌ `app/dashboard/page.tsx` - User dashboard (requires login)
- ❌ `app/debug/appwrite/page.tsx` - Appwrite diagnostics
- ❌ `app/admin/audit-logs/page.tsx` - Admin audit logs (requires auth)
- ❌ `lib/hooks/useAuthDiagnostics.ts` - Auth debugging
- ❌ `scripts/test-appwrite-import.mjs` - Appwrite SDK test
- ❌ `scripts/deploy-appwrite.sh` - Appwrite deployment script

---

## ⚠️ PENDING: Pages Requiring Decisions

These pages **still import Appwrite** and need to be either:
1. **DELETED** (if they require user authentication)
2. **REFACTORED** (if they can work with token-based access)

### 1. `app/events/page.tsx`
**Current State:**
- Imports `@/lib/services/appwriteEvents`
- Uses `useAuth()` hook
- Lists events for logged-in user

**Options:**
- **DELETE** ❌ - Makes no sense without user accounts
- **REFACTOR** ✅ - Show public events list (but we don't have this feature)
- **RECOMMENDATION:** **DELETE** - Events are accessed via tokens, not a user dashboard

### 2. `app/recap/page.tsx`
**Current State:**
- Imports `appwriteEvents`, `appwriteTeams`, `appwriteRecaps`
- Uses `useAuth()` hook
- Generates event recaps with animations
- 680 lines of complex logic

**Options:**
- **DELETE** ❌ - Loses valuable feature
- **REFACTOR** ✅ - Access via public token: `/recap/:public_token`
- **RECOMMENDATION:** **REFACTOR** - Change to `/recap/[token]/page.tsx`

### 3. `app/settings/page.tsx`
**Current State:**
- Imports `appwriteEvents`
- Uses `useAuth()` hook
- Manages user profile and event defaults
- 208 lines

**Options:**
- **DELETE** ✅ - No user profiles exist anymore
- **REFACTOR** ❌ - Would need to be event-specific: `/settings/:admin_token`
- **RECOMMENDATION:** **DELETE** - No user accounts means no global settings

---

## 🎯 RECOMMENDATIONS

### Immediate Actions

#### 1. Delete Settings Page
```bash
Remove-Item "app/settings/page.tsx" -Force
```
**Reason:** No user accounts → no user settings

#### 2. Delete Events List Page
```bash
Remove-Item "app/events/page.tsx" -Force
```
**Reason:** Events are accessed via tokens, not a centralized list

#### 3. Refactor Recap Page
**Keep the feature but make it token-based:**

```bash
# Move file
Move-Item "app/recap/page.tsx" "app/recap/[token]/page.tsx"
```

**Then update to:**
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

export default function RecapPage() {
  const params = useParams();
  const publicToken = params.token as string;
  const [recapData, setRecapData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecap = async () => {
      try {
        const response = await apiClient.getPublicScoreboard(publicToken);
        if (response.success) {
          // Transform data for recap display
          setRecapData(transformForRecap(response.data));
        }
      } catch (err) {
        console.error('Failed to load recap:', err);
      } finally {
        setLoading(false);
      }
    };

    if (publicToken) loadRecap();
  }, [publicToken]);

  // ... rest of recap rendering logic
}
```

---

## 🔍 Files Still Importing Appwrite

After the changes above, these files may still have Appwrite imports:

### Check These Locations:
```bash
# Search for remaining Appwrite imports
Select-String -Path "**/*.ts","**/*.tsx" -Pattern "from.*appwrite" -Exclude "node_modules","*.md",".next"
```

**Known Remaining Issues:**
- `explanation.md` - Documentation file (mentions Appwrite in docs)
- Various component files may import auth context
- Stale import statements in unused components

---

## 📋 Migration Checklist

### Backend (Complete) ✅
- [x] PostgreSQL schema migrated
- [x] Token generation implemented
- [x] All 5 REST endpoints created
- [x] API responses standardized
- [x] Database access layer complete
- [x] Health check endpoint updated

### Core Infrastructure (Complete) ✅
- [x] API client refactored (`lib/api-client.ts`)
- [x] Event stream hook updated (`lib/hooks/useEventStream.ts`)
- [x] Health check using PostgreSQL
- [x] Auth-only pages deleted

### Pages Requiring Attention ⚠️
- [ ] Delete `app/events/page.tsx` (no user dashboard)
- [ ] Delete `app/settings/page.tsx` (no user settings)
- [ ] Refactor `app/recap/page.tsx` → `app/recap/[token]/page.tsx`

### Additional Cleanup 🧹
- [ ] Remove `lib/auth-context.tsx` (if not already deleted)
- [ ] Remove auth components from `components/` directory
- [ ] Update `components/Navbar.tsx` to remove login/logout
- [ ] Clean up any auth guards or protected routes
- [ ] Remove unused Appwrite service imports

---

## 🚀 Testing Strategy

After cleanup, test these flows:

### 1. Create Event Flow
```bash
curl -X POST http://localhost:3000/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event",
    "mode": "quick",
    "start_at": "2026-06-01T09:00:00Z",
    "retention_policy": "manual"
  }'
```
**Expected:** 3 URLs with embedded tokens

### 2. Admin Flow (Add Team)
```bash
curl -X POST http://localhost:3000/api/events/{event_id}/teams \
  -H "X-ADMIN-TOKEN: {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Red Dragons", "color": "#ff0000"}'
```
**Expected:** Team created with UUID

### 3. Scorer Flow (Submit Score)
```bash
curl -X POST http://localhost:3000/api/events/{event_id}/scores \
  -H "X-SCORER-TOKEN: {scorer_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "{team_uuid}",
    "day_number": 1,
    "category": "Game 1",
    "points": 50
  }'
```
**Expected:** Score recorded

### 4. Public Flow (View Scoreboard)
```bash
curl http://localhost:3000/events/{public_token}
```
**Expected:** Event data with teams and scores

---

## 💡 Architecture Decision: No User Dashboard

**Why delete the events list page?**

In the token-based model:
- Events are **not tied to users**
- Anyone can create an event
- Events are accessed via **secret tokens**
- No central "my events" concept

**Alternative Approach:**
If you want users to track their events:
1. Store tokens in browser localStorage
2. Create a "My Events" page that reads from localStorage
3. Display saved tokens with event names
4. Allow users to bookmark/save token URLs

**Example:**
```typescript
// lib/local-events.ts
export function saveEventTokens(eventId: string, tokens: {
  admin_url: string;
  scorer_url: string;
  public_url: string;
}) {
  const saved = JSON.parse(localStorage.getItem('my_events') || '[]');
  saved.push({ eventId, tokens, savedAt: new Date().toISOString() });
  localStorage.setItem('my_events', JSON.stringify(saved));
}

export function getMyEvents() {
  return JSON.parse(localStorage.getItem('my_events') || '[]');
}
```

---

## ✨ Next Steps

1. **Run cleanup script:**
   ```bash
   node check-appwrite-cleanup.js
   ```

2. **Delete recommended pages:**
   ```bash
   Remove-Item "app/events/page.tsx","app/settings/page.tsx" -Force
   ```

3. **Refactor recap page** (if you want to keep it)

4. **Test all flows** with the verification script:
   ```bash
   npm run dev
   node verify-backend.js
   ```

5. **Deploy to Vercel** when ready

---

## 📞 Support

If you encounter issues:
1. Check remaining Appwrite imports: `Select-String -Path "**/*.ts*" -Pattern "appwrite"`
2. Review API contracts: [API_CONTRACTS.md](API_CONTRACTS.md)
3. Check database connection: [MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md)

---

**Status:** Backend is production-ready. Frontend needs final page cleanup.  
**Blocker:** Decide on recap page strategy (keep or delete)  
**ETA:** 30 minutes to complete frontend refactoring
