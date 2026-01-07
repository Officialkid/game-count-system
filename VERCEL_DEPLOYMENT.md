# 🚀 Vercel Frontend Deployment Guide

## Overview

Deploy the Next.js frontend to **Vercel** while connecting to the **Render backend**.

**Architecture:**
- **Frontend:** Vercel (Next.js App Router, Static Generation, Edge Network)
- **Backend:** Render (PostgreSQL, API Routes, Server-Side Logic)
- **Connection:** CORS-enabled API calls from Vercel → Render

---

## Prerequisites

✅ Backend deployed to Render: `https://game-count-system.onrender.com`  
✅ Database running on Render PostgreSQL  
✅ CORS configured in API routes  
✅ Environment variables configured

---

## Deployment Options

### Option 1: Monolithic (Render Only) ✅ CURRENT

Deploy everything to Render:
- Frontend + Backend in one Next.js app
- Simpler setup
- Single deployment

**Status:** Already configured with `render.yaml`

### Option 2: Separate Deployments (Vercel + Render)

Deploy frontend to Vercel, backend to Render:
- Better performance (Vercel Edge Network)
- Independent scaling
- Lower backend costs (no static file serving)

**This guide covers Option 2**

---

## Step 1: Prepare Backend (Render)

### 1.1 Update CORS Origins

Update [lib/cors.ts](lib/cors.ts#L12):

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://game-count-system.vercel.app',  // Add your Vercel domain
  'https://your-custom-domain.com',         // Optional: Custom domain
  'https://game-count-system.onrender.com',
];
```

### 1.2 Deploy Backend to Render

Already configured! Just ensure:
- Service is live: https://game-count-system.onrender.com
- Health check passes: `/api/health`
- Database connected

Test backend:
```bash
curl https://game-count-system.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": {
    "database": "connected"
  }
}
```

---

## Step 2: Configure Frontend for Vercel

### 2.1 Environment Variables

Vercel needs these environment variables:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Frontend URL |
| `NEXT_PUBLIC_API_BASE_URL` | `https://game-count-system.onrender.com` | Backend API URL |

### 2.2 Vercel Configuration

Already configured in [vercel.json](vercel.json):

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_APP_URL": "@app-url",
    "NEXT_PUBLIC_API_BASE_URL": "@api-base-url"
  }
}
```

---

## Step 3: Deploy to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Select project name: game-count-system
# - Override settings? No
```

### Option B: Vercel Dashboard

1. Go to https://vercel.com/new
2. Import from GitHub: `Officialkid/game-count-system`
3. Configure:
   - **Framework:** Next.js
   - **Root Directory:** `/`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. Add environment variables:
   - `NEXT_PUBLIC_APP_URL` = `https://game-count-system.vercel.app`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://game-count-system.onrender.com`
5. Click **Deploy**

### Option C: GitHub Integration (Auto-Deploy)

1. Connect repository to Vercel
2. Push to `main` branch
3. Vercel auto-deploys on every commit

---

## Step 4: Post-Deployment Verification

### 4.1 Test Health Check

```bash
curl https://game-count-system.vercel.app/api/health
```

**Wait, this won't work!** Frontend doesn't have `/api/health`.  
The API is on Render. Test the backend connection:

```bash
# Check if frontend can reach backend
# Open browser console on Vercel deployment
fetch('https://game-count-system.onrender.com/api/health')
  .then(r => r.json())
  .then(console.log)
```

### 4.2 Test Event Creation

```bash
curl -X POST https://game-count-system.onrender.com/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Vercel Test",
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
    "event_id": "evt_...",
    "admin_url": "https://game-count-system.vercel.app/admin/...",
    "scorer_url": "https://game-count-system.vercel.app/score/...",
    "public_url": "https://game-count-system.vercel.app/events/..."
  }
}
```

### 4.3 Test Frontend Routes

Visit these URLs:

- **Home:** https://game-count-system.vercel.app
- **Create Event:** https://game-count-system.vercel.app/events/create
- **Public Scoreboard:** https://game-count-system.vercel.app/events/{public_token}
- **Recap:** https://game-count-system.vercel.app/recap/{public_token}

---

## Troubleshooting

### Issue: CORS Errors

**Symptom:** Browser console shows:
```
Access to fetch at 'https://game-count-system.onrender.com/api/...' 
from origin 'https://game-count-system.vercel.app' has been blocked by CORS
```

**Solution:**
1. Update [lib/cors.ts](lib/cors.ts#L12) with Vercel domain
2. Redeploy backend to Render
3. Wait 2-3 minutes for deployment
4. Test again

### Issue: API_BASE_URL Not Set

**Symptom:** API calls go to `https://game-count-system.vercel.app/api/...` (404)

**Solution:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_BASE_URL` = `https://game-count-system.onrender.com`
3. Redeploy frontend

### Issue: Database Connection Failed

**Symptom:** Backend returns 500 errors

**Solution:**
1. Check Render Dashboard → Database → Status
2. Verify DATABASE_URL in Render environment variables
3. Test connection: `curl https://game-count-system.onrender.com/api/health`

### Issue: Build Fails on Vercel

**Symptom:** Vercel build logs show TypeScript errors

**Solution:**
1. Run locally: `npm run build`
2. Fix TypeScript errors
3. Commit and push
4. Vercel auto-redeploys

---

## Architecture Comparison

### Monolithic (Render Only)

```
User Browser
     ↓
Render (Frontend + Backend)
     ↓
PostgreSQL (Render)
```

**Pros:**
- Simpler setup
- No CORS issues
- Single deployment

**Cons:**
- Slower global performance
- Higher backend costs (static files)

### Separate (Vercel + Render)

```
User Browser
     ↓
Vercel (Frontend - Edge Network)
     ↓
Render (Backend - API Only)
     ↓
PostgreSQL (Render)
```

**Pros:**
- Faster global performance (Vercel CDN)
- Lower backend costs
- Independent scaling

**Cons:**
- CORS configuration required
- Two deployments to manage

---

## Cost Comparison

### Monolithic (Render Only)

| Service | Plan | Cost |
|---------|------|------|
| Render Web Service | Starter | $7/month |
| Render PostgreSQL | Starter | $7/month |
| **Total** | | **$14/month** |

### Separate (Vercel + Render)

| Service | Plan | Cost |
|---------|------|------|
| Vercel Hobby | Free | $0 |
| Render Web Service | Starter | $7/month |
| Render PostgreSQL | Starter | $7/month |
| **Total** | | **$14/month** |

**Note:** Same cost, but Vercel deployment offers better performance.

---

## Recommended Setup

### For Development
✅ **Monolithic** - Simpler, faster iteration

### For Production
✅ **Separate** - Better performance, professional setup

---

## Quick Commands

```bash
# Deploy backend to Render
git push origin main  # Auto-deploys via render.yaml

# Deploy frontend to Vercel
vercel --prod

# Test health check (backend)
curl https://game-count-system.onrender.com/api/health

# Test health check (frontend CDN)
curl https://game-count-system.vercel.app

# Check environment variables
vercel env ls
```

---

## Next Steps

1. ✅ Deploy backend to Render (Already done)
2. ✅ Configure CORS (Already done)
3. ⬜ Deploy frontend to Vercel (Run `vercel`)
4. ⬜ Add environment variables in Vercel Dashboard
5. ⬜ Test API connectivity
6. ⬜ Update CORS with actual Vercel domain
7. ⬜ Configure custom domain (optional)

---

## Support

**Issues?** Check:
1. Render Dashboard → Logs
2. Vercel Dashboard → Deployment Logs
3. Browser Console → Network Tab
4. [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md) for backend status

**Common Problems:**
- CORS: Update [lib/cors.ts](lib/cors.ts)
- Environment: Check Vercel Dashboard → Settings
- Database: Check Render Dashboard → Database

---

## Success Criteria

- ✅ Frontend loads on Vercel
- ✅ API calls reach Render backend
- ✅ Create event works
- ✅ Public scoreboard displays
- ✅ Recap page loads
- ✅ No CORS errors in console

**Once all checked → Production ready! 🎉**
