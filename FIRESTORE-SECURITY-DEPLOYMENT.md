# 🚀 Firestore Security Rules - Deployment Checklist

**Created**: February 5, 2026  
**Purpose**: Step-by-step checklist for deploying production security rules

---

## ✅ Pre-Deployment Checklist

### 1. Review Rules File

- [ ] Open `firestore.rules` and review all rules
- [ ] Verify helper functions are correct
- [ ] Check token validation logic
- [ ] Verify day locking logic
- [ ] Confirm event status checks

### 2. Backup Current Data

```bash
# Export all Firestore data
gcloud firestore export gs://YOUR_BUCKET/backup-$(date +%Y%m%d)
```

- [ ] Data backup completed
- [ ] Verify backup file exists in Cloud Storage
- [ ] Note backup location: `_______________________`

### 3. Test Locally First

```bash
# Install Firebase CLI (if needed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize emulator (if not done)
firebase init emulators

# Start emulator
firebase emulators:start
```

- [ ] Firebase CLI installed
- [ ] Emulator running on `localhost:4000`
- [ ] Test events, teams, scores creation
- [ ] Test locked day rejection
- [ ] Test completed event rejection

### 4. Review Current Rules

```bash
# View current rules in production
firebase firestore:rules:get
```

- [ ] Current rules reviewed
- [ ] Confirmed they are test mode rules (allow all)
- [ ] Ready to replace with production rules

---

## 🚀 Deployment Steps

### Step 1: Initialize Firebase Project

```bash
# Navigate to project directory
cd c:\Users\DANIEL\Documents\Website Projects\game-count-system

# Check current Firebase project
firebase projects:list

# Use correct project
firebase use YOUR_PROJECT_ID
```

- [ ] Firebase project selected: `_______________________`
- [ ] Project ID confirmed: `_______________________`

### Step 2: Validate Rules Syntax

```bash
# Validate rules syntax before deployment
firebase deploy --only firestore:rules --dry-run
```

- [ ] Rules syntax validated
- [ ] No syntax errors found

### Step 3: Deploy to Staging (Optional)

If you have a staging environment:

```bash
# Switch to staging project
firebase use staging-project-id

# Deploy to staging
firebase deploy --only firestore:rules
```

- [ ] Deployed to staging
- [ ] Tested on staging environment
- [ ] All tests passed on staging

### Step 4: Deploy to Production

```bash
# Switch to production project
firebase use production-project-id

# Deploy rules
firebase deploy --only firestore:rules
```

**Expected Output**:
```
=== Deploying to 'YOUR_PROJECT'...

i  deploying firestore
i  firestore: checking firestore.rules for compilation errors...
✔  firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
✔  firestore: released rules firestore.rules to cloud.firestore

✔  Deploy complete!
```

- [ ] Deployment successful
- [ ] No errors in output
- [ ] Deployment time: `_______________________`

### Step 5: Verify Deployment

```bash
# View deployed rules
firebase firestore:rules:get

# Should show new rules with helper functions
```

- [ ] Deployed rules verified
- [ ] Helper functions present
- [ ] Collection rules match expectations

---

## 🧪 Post-Deployment Testing

### Test 1: Public Scoreboard Access

**Expected**: ✅ Should work

```bash
# Test reading an event (should succeed)
curl "https://firestore.googleapis.com/v1/projects/YOUR_PROJECT/databases/(default)/documents/events/EVENT_ID"
```

**Result**:
- [ ] ✅ Public read access working
- [ ] Response code: 200 OK
- [ ] Event data returned

### Test 2: Score Submission with Valid Token

**Expected**: ✅ Should work

Test via your Next.js API:

```bash
curl -X POST "https://your-domain.com/api/events/EVENT_ID/scores" \
  -H "Content-Type: application/json" \
  -d '{"teamId": "TEAM_ID", "points": 10, "day": 1, "token": "ADMIN_TOKEN"}'
```

**Result**:
- [ ] ✅ Score submission working
- [ ] Response code: 200 OK
- [ ] Score created in Firestore

### Test 3: Score Submission on Locked Day

**Expected**: ❌ Should fail

```bash
curl -X POST "https://your-domain.com/api/events/EVENT_ID/scores" \
  -H "Content-Type: application/json" \
  -d '{"teamId": "TEAM_ID", "points": 10, "day": 2, "token": "ADMIN_TOKEN"}'
```

(Assuming day 2 is locked)

**Result**:
- [ ] ❌ Score submission blocked (expected)
- [ ] Response code: 403 or 500 with permission error
- [ ] Error message mentions permissions

### Test 4: Score Submission with Invalid Token

**Expected**: ❌ Should fail

```bash
curl -X POST "https://your-domain.com/api/events/EVENT_ID/scores" \
  -H "Content-Type: application/json" \
  -d '{"teamId": "TEAM_ID", "points": 10, "day": 1, "token": "INVALID_TOKEN"}'
```

**Result**:
- [ ] ❌ Score submission blocked (expected)
- [ ] Response code: 403 or 500 with permission error
- [ ] Error message indicates invalid token

### Test 5: Direct Firestore Write (No Token)

**Expected**: ❌ Should fail

Try writing directly to Firestore without token:

```bash
curl -X POST "https://firestore.googleapis.com/v1/projects/YOUR_PROJECT/databases/(default)/documents/events/EVENT_ID/scores" \
  -H "Content-Type: application/json" \
  -d '{"fields": {"teamId": {"stringValue": "team1"}, "points": {"integerValue": 10}}}'
```

**Result**:
- [ ] ❌ Write blocked (expected)
- [ ] Response code: 403 PERMISSION_DENIED
- [ ] Direct writes now blocked

---

## 📊 Monitoring (First 24 Hours)

### Monitor Permission Errors

```bash
# View Firestore logs for permission errors
gcloud logging read "resource.type=cloud_firestore_database AND severity=ERROR" \
  --limit 50 \
  --format json
```

- [ ] No unexpected permission errors
- [ ] Expected errors (locked days, invalid tokens) logging correctly
- [ ] No errors from public scoreboard reads

### Monitor Rule Evaluation Performance

Check Firebase Console → Firestore → Usage tab:

- [ ] Document read count not increased dramatically
- [ ] Rule evaluations completing in <500ms
- [ ] No timeout errors

### User Reports

- [ ] Public scoreboards loading correctly
- [ ] Admins can still submit scores
- [ ] Scorers can still submit scores
- [ ] Locked days are properly enforced
- [ ] No reports of "permission denied" on valid operations

---

## 🔄 Rollback Procedure (If Needed)

If something goes wrong:

### Quick Rollback to Test Mode

```bash
# Create emergency rollback rules file
cat > firestore-emergency.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
EOF

# Deploy emergency rules
firebase deploy --only firestore:rules --config firestore-emergency.rules
```

- [ ] Emergency rules deployed
- [ ] System back to functioning state
- [ ] Investigate what went wrong

### Rollback to Specific Version

```bash
# List previous rule versions
firebase firestore:rules:list

# Download specific version
firebase firestore:rules:get [RULE_VERSION_ID] > firestore-backup.rules

# Deploy that version
firebase deploy --only firestore:rules --config firestore-backup.rules
```

- [ ] Previous version restored
- [ ] Test that system works
- [ ] Document what went wrong

---

## 📝 Post-Deployment Documentation

### Update Project Documentation

- [ ] Note deployment date in `00-CRITICAL-FIX-10-FIRESTORE-SECURITY-RULES.md`
- [ ] Document any issues encountered
- [ ] Update `README.md` if needed

### Share with Team

- [ ] Notify team that security rules are live
- [ ] Share testing results
- [ ] Document any behavior changes
- [ ] Update onboarding docs

### Security Audit

- [ ] Review token usage patterns
- [ ] Check for any token leaks in logs
- [ ] Verify no tokens exposed in client code
- [ ] Confirm service account credentials are secure

---

## ✅ Final Checklist

- [ ] ✅ Security rules deployed successfully
- [ ] ✅ All post-deployment tests passed
- [ ] ✅ Monitoring set up for first 24 hours
- [ ] ✅ Team notified
- [ ] ✅ Documentation updated
- [ ] ✅ Rollback procedure documented and tested
- [ ] ✅ No permission errors on valid operations
- [ ] ✅ Public scoreboards working
- [ ] ✅ Token-based access control enforced
- [ ] ✅ Day locking enforced
- [ ] ✅ Event status validation working

---

## 🎉 Success Criteria

Your deployment is successful if:

1. **Public Access Works**: Anyone can view events, teams, and scores
2. **Token Access Works**: Admin/scorer tokens can create/update data
3. **Day Locking Works**: Scores blocked on locked days
4. **Event Status Works**: Completed/archived events are read-only
5. **Security Works**: Invalid tokens are rejected
6. **Performance Good**: No noticeable slowdown
7. **No Errors**: No unexpected permission denied errors

---

## 🆘 Support Resources

If you encounter issues:

1. **Documentation**: `00-CRITICAL-FIX-10-FIRESTORE-SECURITY-RULES.md`
2. **Troubleshooting**: See "Troubleshooting" section in main doc
3. **Firebase Support**: https://firebase.google.com/support
4. **Rules Reference**: https://firebase.google.com/docs/firestore/security/get-started

---

**Deployment Date**: `_______________________`  
**Deployed By**: `_______________________`  
**Production Project ID**: `_______________________`  
**Status**: [ ] Success [ ] Partial [ ] Rolled Back

---

## 📝 Notes

(Add any notes about the deployment, issues encountered, or lessons learned)

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```
