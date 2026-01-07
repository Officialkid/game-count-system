# 🧪 Testing Instructions

## ✅ Global Search Results

All searches completed successfully:

### 1️⃣ Search: `appwrite`
**Results:** ✅ Only in documentation (.md files) and build artifacts (tsconfig.tsbuildinfo, node_modules)
- No active code imports found
- All references are in migration documentation

### 2️⃣ Search: `Auth` / `useAuth`
**Results:** ✅ 4 files deleted
- ❌ Deleted: `hooks/useRequireAuth.ts`
- ❌ Deleted: `components/LogoUpload.tsx`
- ❌ Deleted: `components/Navbar.tsx`
- ❌ Deleted: `components/onboarding/OnboardingTutorial.tsx`

### 3️⃣ Search: `account.`
**Results:** ✅ Only in documentation files
- Found in `explanation.md` (historical reference)
- Found in `PRODUCTION_MIGRATION.md` (migration guide)

### 4️⃣ Search: `session`
**Results:** ✅ Only in documentation and test files
- No active session management code found

---

## 🚀 Server Status

**Dev Server:** ✅ **RUNNING**
```
▲ Next.js 14.2.33
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 5.6s
```

---

## 🔍 Manual Testing Checklist

### Test 1: Health Check
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-07T...",
  "services": {
    "database": "connected"
  }
}
```

---

### Test 2: Create Event

**Browser:** Open http://localhost:3000

**Or cURL:**
```bash
curl -X POST http://localhost:3000/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event 2026",
    "mode": "quick",
    "start_at": "2026-01-08T09:00:00Z",
    "retention_policy": "manual"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "event_id": "uuid-here",
    "name": "Test Event 2026",
    "mode": "quick",
    "admin_token": "admin_xxx",
    "scorer_token": "scorer_xxx",
    "public_token": "public_xxx",
    "admin_url": "http://localhost:3000/admin/admin_xxx",
    "scorer_url": "http://localhost:3000/score/scorer_xxx",
    "public_url": "http://localhost:3000/events/public_xxx"
  }
}
```

**💾 Save these tokens for next tests!**

---

### Test 3: Add Team

**Replace `{event_id}` and `{admin_token}` with values from Test 2:**

```bash
curl -X POST http://localhost:3000/api/events/{event_id}/teams \
  -H "X-ADMIN-TOKEN: {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Red Dragons",
    "color": "#ff0000"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "team_id": "uuid-here",
    "name": "Red Dragons",
    "color": "#ff0000",
    "total_points": 0
  }
}
```

**💾 Save `team_id` for next test!**

---

### Test 4: Submit Score

**Replace tokens and IDs with your values:**

```bash
curl -X POST http://localhost:3000/api/events/{event_id}/scores \
  -H "X-SCORER-TOKEN: {scorer_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "team_id": "{team_id}",
    "day_number": 1,
    "category": "Swimming",
    "points": 50
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "score_id": "uuid-here",
    "team_id": "uuid-here",
    "day_number": 1,
    "category": "Swimming",
    "points": 50,
    "submitted_at": "2026-01-07T..."
  }
}
```

---

### Test 5: View Public Scoreboard

**Browser:** Open in browser (replace `{public_token}`)
```
http://localhost:3000/events/{public_token}
```

**Or cURL:**
```bash
curl http://localhost:3000/events/{public_token}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "name": "Test Event 2026",
      "mode": "quick",
      "status": "active"
    },
    "teams": [
      {
        "team_id": "uuid",
        "name": "Red Dragons",
        "color": "#ff0000",
        "total_points": 50
      }
    ],
    "scores": [
      {
        "score_id": "uuid",
        "team_name": "Red Dragons",
        "category": "Swimming",
        "points": 50,
        "day_number": 1
      }
    ]
  }
}
```

---

## 🎯 Backend Verification Script

Once you complete the manual tests above, run the automated test suite:

```bash
node verify-backend.js
```

This will run 6 comprehensive tests:
1. ✅ Create Event
2. ✅ Add Team  
3. ✅ Submit Score
4. ✅ Lock Day (camp mode)
5. ✅ Public Scoreboard
6. ✅ Token Validation

---

## ✅ Success Criteria

**All of these should be true:**

- [x] **No Appwrite imports** in active code (only in docs/node_modules)
- [x] **No auth/session code** in active codebase
- [x] **Dev server running** without errors
- [x] **Health check returns 200** with "database: connected"
- [ ] **Create event** returns tokens
- [ ] **Add team** works with X-ADMIN-TOKEN header
- [ ] **Submit score** works with X-SCORER-TOKEN header
- [ ] **Public scoreboard** accessible without authentication
- [ ] **verify-backend.js** passes all 6 tests

---

## 🔄 If Tests Fail

### Database Connection Error
```bash
# Check PostgreSQL connection
node -e "require('./lib/db-client').query('SELECT NOW()').then(r => console.log('✅ Connected:', r.rows[0]))"
```

### Port Already in Use
```bash
# Kill process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Restart server
npm run dev
```

### Missing Environment Variables
```bash
# Check .env.local exists
Get-Content .env.local
```

Should contain:
```env
DATABASE_URL=postgresql://gamescore_user:...@dpg-d5el72juibrs738qii2g-a.oregon-postgres.render.com/gamescore_db
POSTGRES_URL=postgresql://gamescore_user:...@dpg-d5el72juibrs738qii2g-a.oregon-postgres.render.com/gamescore_db
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 📸 Screenshot Checklist

Take screenshots of:
1. ✅ Health check response (`/api/health`)
2. ✅ Create event response (with tokens)
3. ✅ Public scoreboard in browser (showing team + scores)
4. ✅ verify-backend.js output (all tests passing)

---

## 🎉 When All Tests Pass

You have successfully:
- ✅ Removed all Appwrite dependencies
- ✅ Migrated to PostgreSQL backend
- ✅ Implemented token-based access
- ✅ Created working REST API
- ✅ Verified end-to-end functionality

**Next Steps:**
1. Build frontend pages (admin dashboard, scorer interface)
2. Deploy to Vercel
3. Connect production database
4. Share event URLs with users!

---

**Happy Testing! 🚀**
