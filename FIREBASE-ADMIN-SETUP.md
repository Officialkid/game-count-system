# 🔧 Firebase Admin Setup for Cleanup Scripts

## Quick Start Guide

To use the cleanup/backup/restore scripts, you need Firebase Admin credentials.

---

## Option 1: Service Account File (Recommended for Local Development)

### Step 1: Download Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **combinedactivities-7da43**
3. Click ⚙️ **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file as `firebase-service-account.json` in your project root

```
game-count-system/
├── firebase-service-account.json  ← Put file here
├── scripts/
│   ├── backup-firestore.js
│   ├── cleanup-firestore.js
│   └── restore-firestore.js
└── ...
```

### Step 2: Update .env.local (Already Configured)

Your `.env.local` already has:
```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

### Step 3: Set Environment Variable

**Windows PowerShell**:
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS = ".\firebase-service-account.json"
node scripts/backup-firestore.js
```

**Or set it permanently** (recommended):
```powershell
# Run as Administrator
[System.Environment]::SetEnvironmentVariable('GOOGLE_APPLICATION_CREDENTIALS', 'C:\Users\DANIEL\Documents\Website Projects\game-count-system\firebase-service-account.json', 'User')

# Then restart PowerShell and run:
node scripts/backup-firestore.js
```

---

## Option 2: Environment Variable (Recommended for Production/CI)

### For Render.com or other hosting

1. Download service account key (same as Option 1, Steps 1-2)

2. Copy the **entire JSON content**

3. Set as environment variable:
   ```bash
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"combinedactivities-7da43",...}
   ```

4. On Render.com:
   - Go to your web service
   - Environment → Add Environment Variable
   - Key: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - Value: Paste the entire JSON

---

## Quick Test

### Test 1: Check Firebase Connection
```powershell
# Set credential
$env:GOOGLE_APPLICATION_CREDENTIALS = ".\firebase-service-account.json"

# Test backup (dry-run, just connects)
node scripts/backup-firestore.js
```

**Expected Output**:
```
🔥 Firestore Backup Script
========================

✅ Firebase Admin initialized
📊 Analyzing database...

📈 Database Statistics:
   Events: 5
   Teams: 20
   Scores: 150
   ...
```

### Test 2: Cleanup Dry-Run
```powershell
node scripts/cleanup-firestore.js
```

**Expected Output**:
```
🔥 Firestore Cleanup Script
==========================

🟡 DRY-RUN MODE
   No data will be deleted.
   ...
```

---

## Troubleshooting

### Error: "No Firebase credentials found"

**Problem**: Environment variable not set

**Solution**:
```powershell
# Check if set
$env:GOOGLE_APPLICATION_CREDENTIALS

# If empty, set it:
$env:GOOGLE_APPLICATION_CREDENTIALS = ".\firebase-service-account.json"

# Or use absolute path:
$env:GOOGLE_APPLICATION_CREDENTIALS = "C:\Users\DANIEL\Documents\Website Projects\game-count-system\firebase-service-account.json"
```

### Error: "ENOENT: no such file or directory"

**Problem**: Service account file not found

**Solution**: Make sure file exists in project root
```powershell
# Check if file exists
Test-Path firebase-service-account.json

# If False, download from Firebase Console
```

### Error: "Permission denied"

**Problem**: Service account lacks Firestore permissions

**Solution**:
1. Go to Firebase Console
2. Go to IAM & Admin
3. Find your service account
4. Add role: **Cloud Datastore User**

---

## Security Warning

⚠️ **NEVER commit `firebase-service-account.json` to Git!**

The file is already in `.gitignore`:
```
firebase-service-account.json
```

If you accidentally committed it:
1. Remove from Git: `git rm --cached firebase-service-account.json`
2. Go to Firebase Console → Service Accounts
3. **Delete** the compromised key
4. **Generate a new key**

---

## Ready to Use!

Once you've set up credentials, you can:

```powershell
# 1. Backup your data
node scripts/backup-firestore.js

# 2. Test cleanup (dry-run)
node scripts/cleanup-firestore.js

# 3. Actually cleanup
node scripts/cleanup-firestore.js --confirm

# 4. Restore if needed
node scripts/restore-firestore.js backups/firestore-complete-<timestamp>.json
```

See [00-DEBUG-PROMPT-05-DATABASE-CLEANUP.md](00-DEBUG-PROMPT-05-DATABASE-CLEANUP.md) for full documentation.
