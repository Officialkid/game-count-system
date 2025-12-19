# Rollback Plan & Disaster Recovery

**Last Updated:** December 16, 2025  
**Status:** Active

---

## Overview

This document outlines the rollback procedures and disaster recovery strategies for the Camp Countdown System. Use this guide when you need to revert to a previous stable state due to:

- Critical bugs in production
- Data corruption
- Service outages
- Failed deployments
- Security incidents

---

## Table of Contents

1. [Quick Rollback](#quick-rollback)
2. [Frontend Rollback](#frontend-rollback)
3. [Database Rollback](#database-rollback)
4. [Function Rollback](#function-rollback)
5. [Emergency Mock Mode](#emergency-mock-mode)
6. [Data Backup & Restore](#data-backup--restore)
7. [Communication Plan](#communication-plan)

---

## Quick Rollback

### Severity Levels

**P0 - Critical (Immediate Action)**
- Complete service outage
- Data loss or corruption
- Security breach

**P1 - High (Within 1 hour)**
- Major feature broken
- Performance degradation
- Authentication issues

**P2 - Medium (Within 4 hours)**
- Minor feature broken
- UI issues
- Non-critical bugs

---

## Frontend Rollback

### Option 1: Vercel Dashboard (Fastest - 2 minutes)

1. **Navigate to Vercel Dashboard**
   ```
   https://vercel.com/your-org/camp-countdown-system
   ```

2. **Go to Deployments tab**
   - Find last working deployment (look for green checkmark)
   - Click on deployment
   - Click "Promote to Production"

3. **Verify rollback**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

### Option 2: Vercel CLI (5 minutes)

```bash
# Install Vercel CLI if needed
npm install -g vercel@latest

# List recent deployments
vercel ls

# Promote specific deployment to production
vercel promote <deployment-url> --prod

# Example:
vercel promote https://camp-countdown-abc123.vercel.app --prod
```

### Option 3: Git Revert (10 minutes)

```bash
# Revert to last working commit
git log --oneline
git revert <commit-hash>
git push origin main

# This will trigger automatic deployment
```

---

## Database Rollback

### Appwrite Database Snapshot Restore

#### Manual Backup (Do this daily!)

```bash
# Export collections
appwrite databases listDocuments \
  --databaseId=main \
  --collectionId=events \
  > backups/events-$(date +%Y%m%d).json

appwrite databases listDocuments \
  --databaseId=main \
  --collectionId=teams \
  > backups/teams-$(date +%Y%m%d).json

appwrite databases listDocuments \
  --databaseId=main \
  --collectionId=scores \
  > backups/scores-$(date +%Y%m%d).json
```

#### Restore from Backup

```bash
# 1. Clear current collection (WARNING: Destructive!)
# Only do this if you're absolutely sure
appwrite databases deleteDocument \
  --databaseId=main \
  --collectionId=events \
  --documentId=<each-document-id>

# 2. Restore from backup
cat backups/events-20251215.json | while read doc; do
  appwrite databases createDocument \
    --databaseId=main \
    --collectionId=events \
    --data="$doc"
done
```

#### Point-in-Time Recovery (if using Appwrite Cloud Pro)

1. Go to Appwrite Console → Database → Backups
2. Select backup timestamp
3. Click "Restore"
4. Confirm restoration

**WARNING:** This will overwrite current data!

---

## Function Rollback

### Rollback Appwrite Function Deployment

```bash
# 1. List function executions to find last working version
appwrite functions listExecutions \
  --functionId=submitScoreHandler

# 2. Get deployment history
appwrite functions listDeployments \
  --functionId=submitScoreHandler

# 3. Update function to use previous deployment
appwrite functions updateDeployment \
  --functionId=submitScoreHandler \
  --deploymentId=<previous-deployment-id>

# 4. Test function
appwrite functions createExecution \
  --functionId=submitScoreHandler \
  --data='{"test": true}'
```

### Redeploy from Git

```bash
cd appwrite/functions/submitScoreHandler

# Checkout previous version
git checkout <previous-commit>

# Redeploy
appwrite deploy function
```

---

## Emergency Mock Mode

### Enable Mock Mode (Bypass Appwrite)

If Appwrite is completely unavailable, you can switch to mock mode:

#### 1. Update Environment Variable

**Vercel Dashboard:**
1. Go to Settings → Environment Variables
2. Add/Update:
   ```
   NEXT_PUBLIC_USE_MOCK_DATA=true
   ```
3. Redeploy

**Or via CLI:**
```bash
vercel env add NEXT_PUBLIC_USE_MOCK_DATA production
# Enter value: true

vercel --prod
```

#### 2. Enable Mock Mode in Code

The app will automatically use mock data when `NEXT_PUBLIC_USE_MOCK_DATA=true`:

```typescript
// lib/appwrite.ts already has this logic
const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

if (useMockData) {
  // Use mock services
  export { mockEvents as events };
  export { mockTeams as teams };
  export { mockScores as scores };
} else {
  // Use real Appwrite
  export { appwriteEvents as events };
  export { appwriteTeams as teams };
  export { appwriteScores as scores };
}
```

#### 3. Verify Mock Mode

```bash
# Check that app loads
curl https://your-app.vercel.app

# Should see mock data in responses
curl https://your-app.vercel.app/api/events
```

---

## Data Backup & Restore

### Automated Backup Script

**Create:** `scripts/backup-appwrite.sh`

```bash
#!/bin/bash

BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating Appwrite backup..."

# Backup all collections
for collection in events teams scores share_links audit_logs; do
  echo "  Backing up $collection..."
  appwrite databases listDocuments \
    --databaseId=main \
    --collectionId=$collection \
    --limit=1000 \
    > "$BACKUP_DIR/$collection.json"
done

# Backup storage buckets
appwrite storage listFiles \
  --bucketId=event-logos \
  > "$BACKUP_DIR/logos-manifest.json"

appwrite storage listFiles \
  --bucketId=team-avatars \
  > "$BACKUP_DIR/avatars-manifest.json"

echo "✅ Backup complete: $BACKUP_DIR"
```

**Schedule via cron:**
```bash
# Run daily at 2 AM
0 2 * * * /path/to/scripts/backup-appwrite.sh
```

### Restore Script

**Create:** `scripts/restore-appwrite.sh`

```bash
#!/bin/bash

BACKUP_DIR=$1

if [ -z "$BACKUP_DIR" ]; then
  echo "Usage: ./restore-appwrite.sh <backup-directory>"
  exit 1
fi

echo "⚠️  WARNING: This will overwrite current data!"
echo "Restoring from: $BACKUP_DIR"
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

for collection in events teams scores share_links audit_logs; do
  echo "  Restoring $collection..."
  # Import logic here
done

echo "✅ Restore complete"
```

---

## Monitoring & Alerts

### Set Up Alerts for Rollback Triggers

**Vercel:**
- Enable deployment notifications in Vercel Dashboard
- Set up Slack webhook for deployment failures

**Sentry:**
```javascript
// Automatic alert if error rate spikes
Sentry.init({
  beforeSend(event) {
    // Count errors
    errorCount++;
    
    // Alert if > 10 errors/minute
    if (errorCount > 10) {
      fetch(SLACK_WEBHOOK, {
        method: 'POST',
        body: JSON.stringify({
          text: '🚨 High error rate detected! Consider rollback.'
        })
      });
    }
    
    return event;
  }
});
```

**UptimeRobot:**
- Set up monitors for `/api/health`
- Alert via email/SMS if down > 5 minutes

---

## Communication Plan

### During Rollback

1. **Internal Team:**
   ```
   Slack: #incidents channel
   "⚠️ Production incident detected. Rolling back deployment.
    Status: In progress
    ETA: 10 minutes
    Affected: [features]"
   ```

2. **Users (if needed):**
   ```
   Status page update:
   "We're experiencing technical difficulties and are working to restore service.
    Current status: Degraded
    ETA: 15 minutes"
   ```

3. **Post-Rollback:**
   ```
   "✅ Service restored. We've rolled back to previous version.
    Investigating root cause.
    Next update: 30 minutes"
   ```

### Incident Report Template

```markdown
## Incident Report: [Title]

**Date:** YYYY-MM-DD
**Duration:** XX minutes
**Severity:** P0/P1/P2

### Timeline
- HH:MM - Issue detected
- HH:MM - Rollback initiated
- HH:MM - Service restored

### Root Cause
[Description]

### Impact
- Users affected: XX
- Downtime: XX minutes
- Data loss: None/[details]

### Resolution
[What was done]

### Prevention
- [ ] Action item 1
- [ ] Action item 2
```

---

## Rollback Checklist

### Pre-Rollback

- [ ] Identify rollback target (commit, deployment, backup)
- [ ] Notify team in #incidents channel
- [ ] Update status page (if applicable)
- [ ] Take current state backup (just in case)

### During Rollback

- [ ] Execute rollback procedure
- [ ] Monitor error rates
- [ ] Check health endpoints
- [ ] Verify core functionality

### Post-Rollback

- [ ] Confirm service restored
- [ ] Update status page
- [ ] Notify users (if needed)
- [ ] Document incident
- [ ] Schedule post-mortem
- [ ] Create prevention tasks

---

## Emergency Contacts

**On-Call Engineer:** [Your contact]  
**Vercel Support:** support@vercel.com  
**Appwrite Support:** support@appwrite.io  
**Slack Channel:** #incidents  

---

## Testing Rollback Procedures

**Quarterly Drill:**

1. Create test deployment with intentional bug
2. Deploy to preview environment
3. Practice rollback procedures
4. Document time taken
5. Update this document with learnings

**Last Tested:** [Date]  
**Next Test:** [Date + 3 months]

---

## Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments)
- [Appwrite Backup Guide](https://appwrite.io/docs/backup)
- [Incident Response Best Practices](https://response.pagerduty.com/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-16 | Initial rollback plan created |
