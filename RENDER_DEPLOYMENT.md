# 🚀 Render Production Deployment Guide

## ✅ Prerequisites

- [x] GitHub repository with GameScore code
- [x] Render account (free tier works: https://render.com)
- [x] PostgreSQL database on Render (already created)
- [x] Database credentials available

---

## 📋 Deployment Checklist

### Phase 1: Prepare Repository

- [x] **package.json scripts verified:**
  ```json
  {
    "scripts": {
      "build": "next build",
      "start": "next start"
    }
  }
  ```

- [x] **render.yaml created** - Infrastructure as code
- [x] **No Appwrite dependencies** - Clean codebase
- [x] **Health check endpoint** - `/api/health`

### Phase 2: Deploy to Render

#### Step 1: Create Web Service

1. **Go to Render Dashboard:**
   - Navigate to https://dashboard.render.com

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Officialkid/game-count-system`
   - Render will detect `render.yaml` and offer to use it

3. **Service Configuration:**
   ```
   Name: gamescore-backend
   Region: Oregon (same as PostgreSQL)
   Branch: main
   Runtime: Node
   Build Command: npm install && npm run build
   Start Command: npm run start
   Plan: Starter (Free)
   ```

#### Step 2: Configure Environment Variables

**In Render Dashboard → Environment:**

```env
# Database Connection (CRITICAL)
DATABASE_URL=postgresql://gamescore_db_user:TiyXzFwjLnBldlu4udBbGypsADDvRzJV@dpg-d5el72juibrs738qii2g-a.oregon-postgres.render.com/gamescore_db

POSTGRES_URL=postgresql://gamescore_db_user:TiyXzFwjLnBldlu4udBbGypsADDvRzJV@dpg-d5el72juibrs738qii2g-a.oregon-postgres.render.com/gamescore_db

# Application URL (Update after service is created)
NEXT_PUBLIC_APP_URL=https://gamescore-backend.onrender.com

# Node Environment
NODE_ENV=production

# Cron Security (Generate random secret)
CRON_SECRET=<generate-random-32-char-string>
```

**To generate CRON_SECRET:**
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

#### Step 3: Get Internal Database URL (Recommended)

**Why Internal URL?**
- Faster (no external network)
- Free bandwidth within Render network
- More secure (internal-only access)

**How to get it:**
1. Go to Render Dashboard → Databases
2. Click your PostgreSQL database: `gamescore_db`
3. Copy **"Internal Database URL"** (starts with `postgresql://...render.internal`)
4. Replace `DATABASE_URL` and `POSTGRES_URL` in environment variables

**External vs Internal:**
```
External: postgresql://...oregon-postgres.render.com/...
Internal:  postgresql://...oregon-postgres.render.internal/...
                                              ^^^^^^^^
```

#### Step 4: Deploy

1. **Save environment variables**
2. **Click "Create Web Service"**
3. **Wait for build** (~2-5 minutes)

**Build logs will show:**
```
Running build command 'npm install && npm run build'...
> next build
✓ Creating an optimized production build
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization

Build complete!
```

#### Step 5: Verify Deployment

**1. Check Health Endpoint:**
```bash
curl https://gamescore-backend.onrender.com/api/health
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

**2. Test Event Creation:**
```bash
curl -X POST https://gamescore-backend.onrender.com/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Test Event",
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
    "event_id": "uuid",
    "name": "Production Test Event",
    "admin_token": "admin_xxx",
    "scorer_token": "scorer_xxx",
    "public_token": "public_xxx",
    "admin_url": "https://gamescore-backend.onrender.com/admin/admin_xxx",
    "scorer_url": "https://gamescore-backend.onrender.com/score/scorer_xxx",
    "public_url": "https://gamescore-backend.onrender.com/events/public_xxx"
  }
}
```

**3. Test Public Scoreboard:**
```bash
# Use public_token from previous response
curl https://gamescore-backend.onrender.com/events/{public_token}
```

---

## 🔧 Post-Deployment Configuration

### Configure Automatic Cleanup (Optional)

**Option A: Render Cron Job**

1. **Render Dashboard → Cron Jobs → New Cron Job**
2. **Configuration:**
   ```
   Name: cleanup-expired-events
   Command: curl -X POST https://gamescore-backend.onrender.com/api/cron/cleanup -H "Authorization: Bearer $CRON_SECRET"
   Schedule: 0 2 * * * (Daily at 2 AM UTC)
   ```

**Option B: External Cron Service**

Use services like:
- **cron-job.org** (free, reliable)
- **EasyCron**
- **GitHub Actions** (scheduled workflow)

**GitHub Actions Example:**
```yaml
# .github/workflows/cleanup.yml
name: Daily Cleanup
on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cleanup
        run: |
          curl -X POST https://gamescore-backend.onrender.com/api/cron/cleanup \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## 🔍 Monitoring & Logs

### View Logs

**Render Dashboard → Your Service → Logs**

**Healthy logs look like:**
```
Server running on port 10000
✓ Database connected
✓ Health check passed
```

**Common errors:**
```
Error: connect ECONNREFUSED
Solution: Check DATABASE_URL is correct

Error: getaddrinfo ENOTFOUND
Solution: Use Internal Database URL

Error: password authentication failed
Solution: Verify database credentials
```

### Health Check Monitoring

**Render automatically monitors:**
- HTTP status code (expects 200)
- Response time (should be <1s)
- Endpoint: `/api/health`

**If health check fails:**
- Service will restart automatically
- Check logs for database connection errors
- Verify environment variables

---

## 📊 Performance Optimization

### Database Connection Pooling

**Already configured in `lib/db-client.ts`:**
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**For production, consider:**
```typescript
max: 10  // Render free tier limit
```

### Render Service Tiers

| Plan | RAM | CPU | DB Connections |
|------|-----|-----|----------------|
| Free | 512MB | Shared | 10 |
| Starter | 512MB | Shared | 25 |
| Standard | 2GB | 1 vCPU | 100 |

---

## 🔒 Security Checklist

- [x] **DATABASE_URL uses SSL** (Render enforces by default)
- [x] **CRON_SECRET is random** (32+ characters)
- [x] **No sensitive data in logs** (passwords redacted)
- [x] **Token-based access only** (no user passwords)
- [x] **HTTPS enforced** (Render automatic)
- [x] **Environment variables encrypted** (Render secure storage)

---

## 🚨 Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Solution: Rebuild node_modules
npm install
git add package-lock.json
git commit -m "Update dependencies"
git push
```

**Error: "TypeScript errors"**
```bash
# Solution: Fix errors locally first
npm run build  # Test locally
```

### Runtime Errors

**Error: "Database connection failed"**
```bash
# Check:
1. DATABASE_URL is set correctly
2. Using Internal Database URL (faster)
3. Database is running (Render Dashboard → Databases)
4. Credentials are correct
```

**Error: "Service starts then crashes"**
```bash
# Check logs for:
- Missing environment variables
- Port binding issues (Render uses PORT env var)
- Database authentication errors
```

### Slow Performance

**Free tier limitations:**
- Services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Subsequent requests are fast

**Solutions:**
1. **Upgrade to Starter plan** ($7/month - always on)
2. **Use external uptime monitor** (pings every 5 min to keep alive)
   - UptimeRobot (free)
   - BetterUptime
   - Pingdom

---

## 📈 Scaling Considerations

### When to upgrade:

**From Free → Starter ($7/mo):**
- Need 24/7 uptime (no spin-down)
- Growing user base

**From Starter → Standard ($25/mo):**
- 100+ concurrent users
- High traffic events
- Need faster response times

### Database Scaling:

**Current Plan:**
- 256MB RAM
- 1GB Storage
- 97 connections

**Monitor:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('gamescore_db'));
```

---

## ✅ Deployment Complete!

Your backend is now live at:
```
https://gamescore-backend.onrender.com
```

**Test URLs:**
- Health: https://gamescore-backend.onrender.com/api/health
- Create Event: POST https://gamescore-backend.onrender.com/api/events/create
- Public Scoreboard: https://gamescore-backend.onrender.com/events/{token}
- Game Results: https://gamescore-backend.onrender.com/recap/{token}

**Next Steps:**
1. ✅ Deploy frontend (Vercel/Netlify)
2. ✅ Update frontend API_URL to point to Render backend
3. ✅ Set up custom domain (optional)
4. ✅ Configure monitoring/alerts
5. ✅ Schedule automated backups

---

## 📚 Additional Resources

- **Render Docs:** https://render.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **GameScore API Docs:** See `API_CONTRACTS.md`

---

**🎉 Congratulations! Your backend is production-ready!**
