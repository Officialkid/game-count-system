# 🚀 Vercel Deployment - Quick Start

## Current Status

✅ **Backend:** Deployed to Render  
✅ **CORS:** Configured for cross-origin requests  
✅ **API Client:** Updated with NEXT_PUBLIC_API_BASE_URL  
✅ **Config:** vercel.json ready

---

## Deploy Now (3 Steps)

### 1. Update CORS Origins

Edit [lib/cors.ts](lib/cors.ts#L12) and add your Vercel domain:

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://game-count-system.vercel.app',  // ← Add this
  'https://game-count-system.onrender.com',
];
```

### 2. Deploy Frontend

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Or use Vercel Dashboard:**
1. https://vercel.com/new
2. Import `Officialkid/game-count-system`
3. Add environment variables:
   - `NEXT_PUBLIC_APP_URL` = `https://game-count-system.vercel.app`
   - `NEXT_PUBLIC_API_BASE_URL` = `https://game-count-system.onrender.com`

### 3. Test

```bash
# Create test event
curl -X POST https://game-count-system.onrender.com/api/events/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "mode": "quick",
    "start_at": "2026-01-08T09:00:00Z"
  }'

# Visit URLs from response
# Example: https://game-count-system.vercel.app/events/tok_...
```

---

## Architecture

```
Browser
  ↓
Vercel Frontend (CDN)
  ↓ API Calls
Render Backend (game-count-system.onrender.com)
  ↓
PostgreSQL Database
```

---

## Files Modified

| File | Change |
|------|--------|
| [lib/api-client.ts](lib/api-client.ts) | Added NEXT_PUBLIC_API_BASE_URL support |
| [lib/cors.ts](lib/cors.ts) | Created CORS middleware |
| [.env.production.example](.env.production.example) | Added NEXT_PUBLIC_API_BASE_URL |
| [vercel.json](vercel.json) | Updated config for frontend-only |
| [app/api/health/route.ts](app/api/health/route.ts) | Added CORS headers |
| [app/api/events/create/route.ts](app/api/events/create/route.ts) | Added CORS headers |

---

## Environment Variables

### Vercel (Frontend)

```env
NEXT_PUBLIC_APP_URL=https://game-count-system.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://game-count-system.onrender.com
```

### Render (Backend)

```env
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://game-count-system.onrender.com
NODE_ENV=production
CRON_SECRET=<random-secret>
PORT=10000
```

---

## Troubleshooting

**CORS Error?**
- Update [lib/cors.ts](lib/cors.ts) with actual Vercel URL
- Redeploy backend: `git push origin main`

**404 on API calls?**
- Check NEXT_PUBLIC_API_BASE_URL in Vercel env vars
- Should be: `https://game-count-system.onrender.com` (NO trailing slash)

**Build fails?**
- Run `npm run build` locally first
- Fix TypeScript errors
- Push and redeploy

---

## Full Documentation

See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed guide.

---

## Quick Test

```bash
# 1. Deploy frontend
vercel

# 2. Test backend health
curl https://game-count-system.onrender.com/api/health

# 3. Create event via backend
curl -X POST https://game-count-system.onrender.com/api/events/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","mode":"quick","start_at":"2026-01-08T09:00:00Z"}'

# 4. Open public URL in browser (from response)
```

**Success:** Public scoreboard loads on Vercel, data from Render ✅
