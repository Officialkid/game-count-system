# 🚀 Deployment Checklist

Pre-deployment checklist to ensure your Game Count System is production-ready.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables ✅

**Local Validation**:
- [ ] Run `npm run check-env` - all green checkmarks
- [ ] `.env.local` has all required variables
- [ ] No placeholder values (e.g., "your_api_key_here")
- [ ] `ADMIN_CLEANUP_SECRET` is strong (32+ characters)
- [ ] `NEXT_PUBLIC_APP_URL` points to production domain

**Deployment Platform**:
- [ ] All variables added to deployment platform
- [ ] Variables set for Production, Preview, and Development
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` properly formatted
- [ ] `NEXT_PUBLIC_APP_URL` uses production HTTPS URL
- [ ] Test environment variables via platform's test/preview deployment

**Security Check**:
- [ ] `.env.local` is NOT committed to Git
- [ ] Service account JSON files are NOT committed
- [ ] `.gitignore` includes `.env*` patterns
- [ ] Using separate Firebase projects for dev/staging/prod (recommended)

---

### 2. Firebase Configuration ✅

**Firestore Database**:
- [ ] Database created (if not already)
- [ ] Security rules deployed and tested
- [ ] Indexes created for common queries
- [ ] Test data cleared (if any)

**Authentication**:
- [ ] Auth providers enabled (if using)
- [ ] Email/password authentication configured (if needed)
- [ ] OAuth redirect URLs set for production domain

**Storage**:
- [ ] Storage bucket configured (if using)
- [ ] Storage security rules set
- [ ] CORS configured for production domain

**Security Rules** (Example):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null && 
                    request.auth.token.admin == true;
      
      match /tokens/{tokenId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
                     request.auth.token.admin == true;
      }
      
      match /teams/{teamId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
      
      match /scores/{scoreId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
  }
}
```

**Test Security Rules**:
```bash
# Test read access (should work)
curl https://your-app.com/api/events

# Test write access without auth (should fail)
curl -X POST https://your-app.com/api/events/create
```

---

### 3. Build & Tests ✅

**Local Testing**:
- [ ] `npm run build` succeeds without errors
- [ ] `npm run start` works locally
- [ ] Test all critical flows:
  - [ ] Create event
  - [ ] Add teams
  - [ ] Submit scores
  - [ ] View scoreboard
  - [ ] Access via tokens

**TypeScript Validation**:
- [ ] No TypeScript errors
- [ ] Run: `npx tsc --noEmit`

**Linting**:
- [ ] No linting errors
- [ ] Run: `npm run lint`

---

### 4. Application Configuration ✅

**URLs & Domains**:
- [ ] `NEXT_PUBLIC_APP_URL` uses production domain
- [ ] Domain configured in deployment platform
- [ ] SSL certificate active (HTTPS)
- [ ] DNS records point to deployment platform

**API Endpoints**:
- [ ] All API routes working
- [ ] Test: `/api/health` returns 200
- [ ] Test: `/api/events/create` with admin token
- [ ] Test: `/api/scores/submit` with scorer token

**Cron Jobs** (if applicable):
- [ ] Cleanup cron configured: `/api/cron/cleanup?secret=YOUR_SECRET`
- [ ] Vercel Cron: Add to `vercel.json`
- [ ] Test cron endpoint with secret

---

### 5. Performance & Optimization ✅

**Next.js Build**:
- [ ] Build size is reasonable (check build output)
- [ ] No excessive bundle sizes
- [ ] Images optimized

**Firebase**:
- [ ] Firestore indexes created for common queries
- [ ] No N+1 query issues
- [ ] Batched operations used where appropriate

**Caching**:
- [ ] Static pages cached properly
- [ ] API responses cached where appropriate

---

### 6. Monitoring & Logging ✅

**Error Tracking**:
- [ ] Console errors reviewed and fixed
- [ ] Test error boundaries work
- [ ] 404 pages work correctly

**Firebase Monitoring**:
- [ ] Firebase Console monitoring enabled
- [ ] Check Firestore usage and quotas
- [ ] Review Firebase logs for errors

**Analytics** (optional):
- [ ] Vercel Analytics enabled (if using)
- [ ] Google Analytics configured (if using)

---

### 7. Security Hardening ✅

**Environment Variables**:
- [ ] No secrets in client-side code
- [ ] `FIREBASE_ADMIN_*` variables only in server code
- [ ] All secrets rotated from defaults

**Firebase Security**:
- [ ] Security rules tested and working
- [ ] Admin privileges properly restricted
- [ ] Token access properly validated

**HTTPS**:
- [ ] All requests use HTTPS
- [ ] No mixed content warnings
- [ ] SSL certificate valid

**Headers** (optional):
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

---

### 8. User Experience ✅

**Mobile Testing**:
- [ ] Responsive design works on mobile
- [ ] Touch interactions work
- [ ] Scoreboard readable on small screens

**Browser Testing**:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

**Accessibility** (optional):
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast sufficient

---

### 9. Documentation ✅

**Code Documentation**:
- [ ] README.md updated with setup instructions
- [ ] API endpoints documented
- [ ] Environment variables documented

**User Documentation**:
- [ ] User guide for event organizers
- [ ] Instructions for scorers
- [ ] Public scoreboard access guide

---

### 10. Backup & Recovery ✅

**Data Backup**:
- [ ] Firebase automatic backups enabled
- [ ] Export critical data before major changes
- [ ] Document restore process

**Rollback Plan**:
- [ ] Know how to rollback deployment
- [ ] Previous version accessible
- [ ] Database migration rollback plan (if applicable)

---

## 🚀 Deployment Steps

### Vercel Deployment

1. **Connect Repository**:
   ```bash
   vercel login
   vercel link
   ```

2. **Configure Environment**:
   ```bash
   # Add all variables
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   vercel env add FIREBASE_ADMIN_PROJECT_ID
   # ... etc
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

4. **Verify Deployment**:
   - Check deployment logs
   - Test production URL
   - Verify all features work

### Render Deployment

1. **Create Web Service**:
   - Dashboard → New → Web Service
   - Connect GitHub repository

2. **Configure Build**:
   - Build Command: `npm run build`
   - Start Command: `npm run start`

3. **Add Environment Variables**:
   - Go to Environment tab
   - Add all variables from `.env.local`

4. **Deploy**:
   - Render auto-deploys on push
   - Monitor deployment logs

### Netlify Deployment

1. **Connect Repository**:
   - Dashboard → Add new site → Import from Git

2. **Configure Build**:
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Add Environment Variables**:
   - Site settings → Environment variables
   - Add all variables

4. **Deploy**:
   - Trigger deploy
   - Check deploy logs

---

## ✅ Post-Deployment Verification

### Smoke Tests

**Critical Paths**:
```bash
# Health check
curl https://your-app.com/api/health

# Create event (admin token required)
curl -X POST https://your-app.com/api/events/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Event","adminToken":"YOUR_ADMIN_TOKEN"}'

# View public scoreboard
curl https://your-app.com/scoreboard/VIEWER_TOKEN
```

**Frontend Tests**:
- [ ] Homepage loads
- [ ] Create event flow works
- [ ] Scorer can submit scores
- [ ] Real-time updates work
- [ ] Public scoreboard accessible

**Data Verification**:
- [ ] Events created successfully
- [ ] Teams added successfully
- [ ] Scores submitted successfully
- [ ] Scoreboard displays correctly

---

## 🐛 Common Deployment Issues

### Issue: Build fails with environment variable errors
**Solution**: 
- Check all variables are set in deployment platform
- Verify variable names match exactly (case-sensitive)
- Check for typos in variable names

### Issue: Firebase connection fails in production
**Solution**:
- Verify `NEXT_PUBLIC_FIREBASE_API_KEY` is set
- Check `FIREBASE_ADMIN_PRIVATE_KEY` format
- Ensure Firebase project has correct permissions

### Issue: API routes return 500 errors
**Solution**:
- Check deployment logs for errors
- Verify server-side environment variables
- Test API routes with curl/Postman

### Issue: Real-time updates don't work
**Solution**:
- Check Firebase client SDK initialization
- Verify Firestore security rules
- Check browser console for errors

---

## 📊 Monitoring Dashboard

**Firebase Console**:
- Firestore usage: https://console.firebase.google.com/project/YOUR_PROJECT/firestore
- Auth usage: https://console.firebase.google.com/project/YOUR_PROJECT/authentication
- Performance: https://console.firebase.google.com/project/YOUR_PROJECT/performance

**Deployment Platform**:
- Vercel: https://vercel.com/dashboard
- Render: https://dashboard.render.com
- Netlify: https://app.netlify.com

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ All checklist items completed
- ✅ Production URL accessible
- ✅ All critical features working
- ✅ No errors in logs
- ✅ Real-time updates working
- ✅ Mobile experience smooth
- ✅ Firebase connection stable
- ✅ Security rules enforced

---

## 📞 Support Resources

- **Firebase Status**: https://status.firebase.google.com
- **Vercel Status**: https://www.vercel-status.com
- **Render Status**: https://status.render.com
- **Netlify Status**: https://www.netlifystatus.com

---

**Last Updated**: February 2026  
**Version**: 1.0.0

---

## Quick Command Reference

```bash
# Validate environment
npm run check-env

# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to Vercel
vercel --prod

# View deployment logs (Vercel)
vercel logs

# Rollback deployment (Vercel)
vercel rollback
```
