# Offline Scorer - Quick Reference

## 🚀 Quick Start for Scorers

### Online Mode (Green Badge)
1. Go to scorer URL: `/score/[token]`
2. Enter scores normally
3. Scores submit immediately
4. ✅ Success message appears

### Offline Mode (Red Badge)
1. Device loses network connection
2. 🟡 Yellow banner appears: "Offline Mode"
3. Enter scores as usual
4. ✅ "Queued" message appears
5. Scores held locally
6. 🔄 When online, auto-syncs automatically

### Connection Restored
1. Device reconnects to network
2. 🟢 Badge changes to "Online"
3. 💙 Blue "Syncing..." banner appears
4. All queued scores upload
5. ✅ "All scores synced!" message
6. Scoreboard updates

## 📱 Working Offline

### What Works?
- ✅ Single score entry
- ✅ Quick add buttons (±1, ±5, ±10, ±25)
- ✅ Bulk score entry for multiple teams
- ✅ View cached team data
- ✅ See team totals (optimistic)
- ✅ Change score category
- ✅ Enter scores for any team

### What Doesn't?
- ❌ Update from live scoreboard
- ❌ See real-time team changes
- ❌ Fetch latest event data
- ❌ Upload files or media

### Data Shown Offline
- Last cached event name
- Last cached team list
- Cached team colors
- Your locally entered scores

## 📊 Status Indicators

### Badge (Top Right)
```
🟢 Online   - Connected, scores submit immediately
🔴 Offline  - No connection, scores will queue
```

### Banners

```
🟡 YELLOW "Offline Mode" - You can still enter scores
💙 BLUE "Syncing Scores..." - Auto-uploading queued data
🟠 ORANGE "X Score(s) Pending" - Waiting to sync
⚪ GRAY "Using cached data" - No fresh data available
```

## 🎯 Submission Methods

### Method 1: Manual Entry
1. Select team from dropdown
2. Enter points (number)
3. Enter category (reason)
4. Click "Add Score"
5. ✅ Shows queued/added message

### Method 2: Quick Add
1. Find team in "Quick Add" section
2. Click button (+5, -10, etc.)
3. ✅ Score added immediately
4. Team total updates

### Method 3: Bulk Entry
1. Scroll to "Bulk Score Entry"
2. Enter points for each team
3. Enter category (reason)
4. Click "Submit Bulk Scores"
5. ✅ All scores added at once

## ⚡ Messages Explained

| Message | Meaning | Action |
|---------|---------|--------|
| ✅ `Added X points to TeamName` | Online - score uploaded | Wait for reload |
| ✓ `Queued: X points...` | Offline - score saved locally | Reconnect when ready |
| `Syncing Scores...` | Uploading queued data | Wait 1-3 seconds |
| `All scores synced!` | Queue cleared, data uploaded | Scoreboard updating |
| `Using cached data` | No internet, showing old data | Reconnect for new data |
| `X Score(s) Pending` | Waiting in queue | Will auto-sync when online |

## 🔄 Manual Sync

If you have pending scores and want to upload now:

1. 🟡 See orange "Pending" banner
2. 🟢 When online, see "Sync Now" button
3. Click "Sync Now"
4. 💙 Blue syncing banner appears
5. ✅ Wait for completion (1-3s)

## 📍 Important Notes

### Always Remember
- 📱 Keep your phone/device with you
- 🔌 Reconnect to sync scores
- 🟢 Wait for badge to turn green
- ✅ Look for sync completion message
- 👀 Check scoreboard after sync

### Storage
- Scores saved locally on device
- Not on company server yet
- Lost if localStorage cleared
- No automatic cloud backup offline
- Only persist for 30 minutes

### Reliability
- Online: 100% submitted immediately
- Offline: 100% saved, synced on reconnect
- No timeouts or auto-failures
- Manual retry always available
- Data safe in queue

### Troubleshooting

**Scores not syncing?**
- Check badge is green
- Reload page (Ctrl+F5)
- Check internet connection
- Click "Sync Now" manually

**Can't see cached data?**
- Must load page online once first
- Cache expires after 30 minutes
- Reload page to refresh cache
- Check if browser has localStorage

**Scores disappeared?**
- Check if page reloaded
- Offline data not in main scoreboard
- Will appear after sync completes
- Check console for errors

**Queue keeps growing?**
- Check internet connection
- Verify token is valid
- Try reloading page
- Contact admin if persists

## 🎮 Quick Tips

### Best Practices
1. ✅ Check badge color first
2. ✅ Use offline mode confidently
3. ✅ Reconnect when available
4. ✅ Wait for sync to complete
5. ✅ Verify scores in scoreboard

### Offline Strategies
- **Flaky WiFi**: Use quick add buttons (faster)
- **Road Trip**: Enter bulk scores offline
- **Event Start**: Load page online first
- **Busy Later**: Batch entries offline
- **Unsure**: Check badge before entering

### Performance
- Single entry: ~300ms (online)
- Quick add: ~100ms (online)
- Bulk entry: ~500ms-1s (online)
- Offline queue: Instant local save
- Sync: ~100-300ms per score

## 📞 Getting Help

### Check Status First
- Is badge green or red?
- Any banners showing?
- What message displayed?
- How many pending?

### Common Fixes
1. Reload page: Ctrl+F5
2. Check internet: Open a website
3. Refresh cache: Go online, reload
4. Clear queue: Contact admin
5. Reset browser: Clear localStorage

### Report Issues With
- Your device type
- Browser name and version
- What you were doing
- Exact error message
- Current online/offline status

## 🔐 Data Safety

- ✅ No passwords transmitted offline
- ✅ No personal data stored
- ✅ Tokens required for sync
- ✅ Server validates all scores
- ✅ No data lost if offline works as designed

---

**Remember**: The system is designed to keep your scores safe. Offline is a feature, not a failure. Work confidently knowing your data is secure!

