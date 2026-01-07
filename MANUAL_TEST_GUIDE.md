# Production Testing - Manual Guide

## Server Running

✅ **Dev Server:** http://localhost:3000 (Ready in 4.7s)

---

## Manual Test Plan

### 1️⃣ Backend Health Check

**Open in browser:** http://localhost:3000/api/health

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-07T...",
  "uptime": 123.456,
  "responseTime": "5ms",
  "services": {
    "database": "connected",
    "postgresql": "operational"
  },
  "version": "2.0.0",
  "environment": "development"
}
```

**✅ Pass Criteria:**
- Status code: 200
- status: "healthy"
- database: "connected"

---

### 2️⃣ Create Event

**Method:** POST
**URL:** http://localhost:3000/api/events/create
**Body:**
```json
{
  "name": "Manual Test Event",
  "mode": "quick",
  "start_at": "2026-01-08T09:00:00Z",
  "retention_policy": "manual"
}
```

**Using PowerShell:**
```powershell
$body = @{
  name = "Manual Test Event"
  mode = "quick"
  start_at = "2026-01-08T09:00:00Z"
  retention_policy = "manual"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/events/create" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "event_id": "evt_...",
    "admin_url": "http://localhost:3000/admin/tok_...",
    "scorer_url": "http://localhost:3000/score/tok_...",
    "public_url": "http://localhost:3000/events/tok_..."
  }
}
```

**✅ Pass Criteria:**
- Status code: 201
- success: true
- All tokens present (admin_url, scorer_url, public_url)

**📋 Save tokens for next steps!**

---

### 3️⃣ Add Teams (Admin Token)

**Method:** POST
**URL:** http://localhost:3000/api/events/{event_id}/teams
**Headers:**
- Content-Type: application/json
- X-ADMIN-TOKEN: {admin_token}

**Body:**
```json
{
  "name": "Team Alpha",
  "color": "#FF0000"
}
```

**PowerShell:**
```powershell
$eventId = "evt_..."  # From step 2
$adminToken = "tok_..."  # Extract from admin_url

$body = @{
  name = "Team Alpha"
  color = "#FF0000"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/events/$eventId/teams" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-ADMIN-TOKEN"=$adminToken} `
  -Body $body
```

**Repeat for Team Beta:**
```json
{
  "name": "Team Beta",
  "color": "#0000FF"
}
```

**✅ Pass Criteria:**
- Status code: 200/201
- success: true
- Team returned with ID

---

### 4️⃣ Add Scores (Scorer Token)

**Method:** POST
**URL:** http://localhost:3000/api/events/{event_id}/scores
**Headers:**
- Content-Type: application/json
- X-SCORER-TOKEN: {scorer_token}

**Body:**
```json
{
  "team_id": "team_id_from_step_3",
  "day_number": 1,
  "category": "Bible Study",
  "points": 100
}
```

**PowerShell:**
```powershell
$eventId = "evt_..."
$scorerToken = "tok_..."  # Extract from scorer_url
$teamId = "..."  # From step 3

$body = @{
  team_id = $teamId
  day_number = 1
  category = "Bible Study"
  points = 100
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/events/$eventId/scores" `
  -Method POST `
  -ContentType "application/json" `
  -Headers @{"X-SCORER-TOKEN"=$scorerToken} `
  -Body $body
```

**✅ Pass Criteria:**
- Status code: 200/201
- success: true
- Score submitted

---

### 5️⃣ Public Scoreboard (No Auth)

**URL:** http://localhost:3000/events/{public_token}

**Open in browser:** Use public_url from step 2

**✅ Pass Criteria:**
- Page loads without login prompt
- Event name visible
- Teams visible
- Scores visible
- No console errors

---

### 6️⃣ Recap Page (No Auth)

**URL:** http://localhost:3000/recap/{public_token}

**Extract public token from step 2 public_url and navigate to:**
`http://localhost:3000/recap/{public_token}`

**✅ Pass Criteria:**
- Page loads without authentication
- Champion banner displays
- Final standings table visible
- Day-by-day breakdown shown
- No console errors
- Page title includes event name (SEO metadata)

---

### 7️⃣ Test Invalid Token

**URL:** http://localhost:3000/events/invalid_token_12345

**✅ Pass Criteria:**
- Status code: 404
- Error message displayed
- No server crash

---

### 8️⃣ Test Unauthorized Access

Try to add team WITHOUT admin token:

**PowerShell:**
```powershell
$eventId = "evt_..."
$body = @{
  name = "Unauthorized Team"
  color = "#000000"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/events/$eventId/teams" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**✅ Pass Criteria:**
- Status code: 401 or 403
- Error: "Unauthorized" or "Missing token"

---

### 9️⃣ Retention Cleanup

**Create auto-expire event:**
```powershell
$body = @{
  name = "Auto-Expire Test"
  mode = "quick"
  start_at = "2026-01-06T09:00:00Z"
  retention_policy = "auto_expire"
  expires_at = "2026-01-06T09:00:00Z"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/events/create" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Trigger cleanup:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/cron/cleanup" `
  -Headers @{"Authorization"="Bearer your-cron-secret"}
```

**✅ Pass Criteria:**
- Expired event deleted
- Active events remain

---

## Console Tests

Open browser console (F12) and run:

```javascript
// Test 1: Health Check
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)

// Test 2: Create Event
fetch('/api/events/create', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    name: 'Console Test',
    mode: 'quick',
    start_at: '2026-01-08T09:00:00Z',
    retention_policy: 'manual'
  })
})
.then(r => r.json())
.then(console.log)

// Test 3: Invalid Token
fetch('/events/invalid123')
  .then(r => console.log('Status:', r.status))
```

---

## Success Criteria Summary

| Test | Expected | Status |
|------|----------|--------|
| Health Check | 200, database connected | ⬜ |
| Create Event | 201, tokens returned | ⬜ |
| Add Teams | 200/201, admin token works | ⬜ |
| Add Scores | 200/201, scorer token works | ⬜ |
| Public Scoreboard | No auth, data visible | ⬜ |
| Recap Page | No auth, SEO metadata | ⬜ |
| Invalid Token | 404 error | ⬜ |
| Unauthorized | 401/403 rejection | ⬜ |
| Retention | Auto-delete works | ⬜ |

---

## Automated Test (Node.js Issue)

The automated test script (test-production.js) is failing due to Node.js fetch compatibility.

**Workaround:** Run tests manually using PowerShell or browser console above.

**Fix for later:** Install node-fetch or use Playwright for E2E testing.

---

## Next: Test on Render

Once local tests pass, test production:

```bash
node test-production.js https://game-count-system.onrender.com
```

Or follow manual steps above with Render URL.
