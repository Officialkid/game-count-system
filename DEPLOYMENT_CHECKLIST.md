# ✅ Pre-Deployment Checklist

## Before You Deploy to Render

### 1. Code Readiness

- [x] **No Appwrite imports** - Verified clean
- [x] **No authentication code** - Token-based only
- [x] **package.json scripts** - `build` and `start` present
- [x] **TypeScript compiles** - Run `npm run build` locally
- [x] **Health check works** - `/api/health` returns 200

### 2. Database Verification

```bash
# Test PostgreSQL connection locally
node -e "require('./lib/db-client').query('SELECT NOW()').then(r => console.log('✅ Connected:', r.rows[0]))"
```

Expected output:
```
✅ Connected: { now: 2026-01-07T... }
```

### 3. Environment Variables

**Required Variables (Render Dashboard):**
```env
✅ DATABASE_URL       - PostgreSQL connection string
✅ POSTGRES_URL       - Same as DATABASE_URL
✅ NEXT_PUBLIC_APP_URL - Your Render service URL
✅ NODE_ENV           - production
✅ CRON_SECRET        - Random 32+ character string
```

**Generate CRON_SECRET:**
```bash
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Bash/WSL
openssl rand -base64 32
```

### 4. API Endpoints Test

**Locally test all endpoints:**
```bash
# Health check
curl http://localhost:3000/api/health

# Create event
curl -X POST http://localhost:3000/api/events/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","mode":"quick","start_at":"2026-01-08T09:00:00Z","retention_policy":"manual"}'

# Add team (use admin_token from previous response)
curl -X POST http://localhost:3000/api/events/{event_id}/teams \
  -H "X-ADMIN-TOKEN: {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Team","color":"#ff0000"}'

# Submit score (use scorer_token)
curl -X POST http://localhost:3000/api/events/{event_id}/scores \
  -H "X-SCORER-TOKEN: {scorer_token}" \
  -H "Content-Type: application/json" \
  -d '{"team_id":"{team_id}","day_number":1,"category":"Test","points":100}'

# Public scoreboard (use public_token)
curl http://localhost:3000/events/{public_token}

# Game results
curl http://localhost:3000/recap/{public_token}
```

**Expected: All return 200 with success:true**

### 5. Build Test

```bash
# Clean build
rm -rf .next
npm run build
```

**Expected output:**
```
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages (5/5)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /api/health                          0 B            0 B
├ ○ /api/events/create                   0 B            0 B
└ ○ /events/[token]                      0 B            0 B
```

### 6. Git Repository

```bash
# Commit all changes
git add .
git commit -m "Production deployment ready"
git push origin main

# Verify remote
git remote -v
# Should show: github.com/Officialkid/game-count-system
```

### 7. Render Account Setup

- [x] **Render account created** - https://render.com
- [x] **GitHub connected** - Repository access granted
- [x] **PostgreSQL database exists** - Credentials available
- [ ] **Payment method added** - Optional (free tier works)

---

## 🚀 Ready to Deploy!

Once all checkboxes above are complete:

1. **Go to Render Dashboard:** https://dashboard.render.com
2. **New Web Service** → Connect `Officialkid/game-count-system`
3. **Configure environment variables** (see `.env.production.example`)
4. **Deploy!**

---

## Post-Deployment Verification

After deployment completes (~3-5 minutes):

### 1. Health Check
```bash
curl https://your-service.onrender.com/api/health
```

**Expected:**
```json
{
  "status": "healthy",
  "services": {
    "database": "connected"
  }
}
```

### 2. Create Test Event
```bash
curl -X POST https://your-service.onrender.com/api/events/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Prod Test","mode":"quick","start_at":"2026-01-08T09:00:00Z","retention_policy":"manual"}'
```

**Expected: Returns tokens (admin, scorer, public)**

### 3. View Public Scoreboard
```bash
curl https://your-service.onrender.com/events/{public_token}
```

**Expected: Returns event data**

---

## 🔧 If Deployment Fails

### Build Errors
```bash
# Check logs for:
- TypeScript errors → Fix locally, commit, push
- Missing dependencies → npm install, commit package-lock.json
- Environment variables → Check Render Dashboard
```

### Runtime Errors
```bash
# Check Render logs for:
- Database connection failed → Verify DATABASE_URL
- Port binding error → Render handles this automatically
- Module not found → npm install, rebuild
```

### Health Check Fails
```bash
# Troubleshoot:
1. Check DATABASE_URL is set correctly
2. Verify database is running (Render Dashboard → Databases)
3. Use Internal Database URL (faster)
4. Check logs for connection errors
```

---

## 📞 Support Resources

**If stuck:**
1. **Render Docs:** https://render.com/docs
2. **Render Community:** https://community.render.com
3. **GitHub Issues:** Create issue in your repository
4. **Review logs:** Render Dashboard → Your Service → Logs

---

## ✅ Success Criteria

All of these should be true after deployment:

- ✅ Build completes without errors
- ✅ Service status shows "Live" (green dot)
- ✅ Health check returns 200 OK
- ✅ Database connection successful
- ✅ API endpoints respond via HTTPS
- ✅ Tokens can be generated
- ✅ Events can be created
- ✅ Public scoreboard accessible

**When all green → Your backend is LIVE! 🎉**
