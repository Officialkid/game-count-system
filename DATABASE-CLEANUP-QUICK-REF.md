# 🚀 Database Cleanup - Quick Reference

## One-Liner Commands

### Backup (Always Do First!)
```bash
npm run db:backup
```

### Cleanup (Test First - Dry Run)
```bash
npm run db:cleanup
```

### Cleanup (Actually Delete - CAREFUL!)
```bash
npm run db:cleanup:confirm
```

### Restore from Backup
```bash
npm run db:restore backups/firestore-complete-2026-02-05T10-30-45.json
```

---

## Complete Workflow

```bash
# 1. Backup current data
npm run db:backup

# 2. Test cleanup (shows what would be deleted)
npm run db:cleanup

# 3. Actually cleanup (requires confirmation)
npm run db:cleanup:confirm

# 4. If needed, restore
npm run db:restore backups/firestore-complete-<timestamp>.json
```

---

## Safety Checklist

- [ ] Firebase service account key downloaded
- [ ] Saved as `firebase-service-account.json` in project root
- [ ] Environment variable set: `$env:GOOGLE_APPLICATION_CREDENTIALS = ".\firebase-service-account.json"`
- [ ] Tested with dry-run first
- [ ] Backup created before cleanup
- [ ] Confirmed you want to delete all data

---

## Common Commands

```bash
# Check if credentials are set
$env:GOOGLE_APPLICATION_CREDENTIALS

# Set credentials (Windows PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS = ".\firebase-service-account.json"

# Verify scripts work
node --check scripts/backup-firestore.js
node --check scripts/cleanup-firestore.js
node --check scripts/restore-firestore.js

# Check if service account file exists
Test-Path firebase-service-account.json
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "No Firebase credentials found" | Set `$env:GOOGLE_APPLICATION_CREDENTIALS` |
| "ENOENT: no such file" | Download service account key from Firebase Console |
| "Permission denied" | Add "Cloud Datastore User" role to service account |
| "Running in PRODUCTION" | Add `--force` flag (only if you're sure!) |

---

## File Locations

```
game-count-system/
├── firebase-service-account.json     ← Your service account key
├── scripts/
│   ├── backup-firestore.js           ← Backup script
│   ├── cleanup-firestore.js          ← Cleanup script
│   └── restore-firestore.js          ← Restore script
├── backups/                           ← Created by backup script
│   ├── firestore-complete-*.json
│   └── firestore-manifest-*.json
├── 00-DEBUG-PROMPT-05-DATABASE-CLEANUP.md  ← Full docs
└── FIREBASE-ADMIN-SETUP.md            ← Setup guide
```

---

## Quick Setup (First Time)

1. **Get Firebase Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select project: `combinedactivities-7da43`
   - Settings → Service Accounts → Generate New Private Key
   - Save as `firebase-service-account.json`

2. **Set Environment Variable**:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS = ".\firebase-service-account.json"
   ```

3. **Test Connection**:
   ```bash
   npm run db:backup
   ```

4. **Ready!** 🎉

---

## Script Options

### backup-firestore.js
```bash
node scripts/backup-firestore.js                    # Default (backups/)
node scripts/backup-firestore.js --output ./custom  # Custom directory
```

### cleanup-firestore.js
```bash
node scripts/cleanup-firestore.js                   # Dry-run (default)
node scripts/cleanup-firestore.js --confirm         # Actually delete
node scripts/cleanup-firestore.js --confirm --force # Force in production
```

### restore-firestore.js
```bash
node scripts/restore-firestore.js <file>            # Restore from file
node scripts/restore-firestore.js <file> --dry-run  # Test restore
```

---

## Emergency Procedures

### 🚨 Accidentally Deleted Data

1. **Don't Panic!** Data might be in backup
2. Check `backups/` folder for recent backup
3. Restore immediately:
   ```bash
   npm run db:restore backups/firestore-complete-<latest-timestamp>.json
   ```

### 🚨 Script Hangs or Errors

1. Press **Ctrl+C** to cancel
2. Check Firebase Console for rate limits
3. Wait 1 minute and try again
4. For large databases, be patient (may take 10+ minutes)

### 🚨 Wrong Data Deleted

1. Restore from backup (see above)
2. If no backup exists, data is **permanently lost**
3. Always backup before cleanup!

---

## Performance Guide

| Documents | Backup | Cleanup | Restore |
|-----------|--------|---------|---------|
| 100       | ~2s    | ~1s     | ~2s     |
| 1,000     | ~10s   | ~5s     | ~12s    |
| 10,000    | ~60s   | ~30s    | ~80s    |
| 100,000   | ~10min | ~5min   | ~15min  |

---

## Security Reminders

- ⚠️ **NEVER** commit `firebase-service-account.json` to Git
- ⚠️ **NEVER** share your service account key
- ⚠️ If compromised, **delete** and **regenerate** key immediately
- ✅ File is in `.gitignore` (already configured)

---

## Pro Tips

1. **Backup before every cleanup** - You can never be too safe
2. **Test with dry-run** - See what would happen first
3. **Keep recent backups** - Store last 7 days in `backups/`
4. **Automate backups** - Set up cron job for daily backups
5. **Check Firebase Console** - Verify deletions in UI

---

**Need More Help?**
- Full Documentation: [00-DEBUG-PROMPT-05-DATABASE-CLEANUP.md](00-DEBUG-PROMPT-05-DATABASE-CLEANUP.md)
- Setup Guide: [FIREBASE-ADMIN-SETUP.md](FIREBASE-ADMIN-SETUP.md)
