# 🔋 Offline Scorer - Quick Reference Guide

## Quick Start

The scorer interface **automatically detects when you go offline** and queues scores locally. When you reconnect, **scores sync automatically**.

### What You See

```
ONLINE                      OFFLINE                    SYNCING
┌────────────────┐         ┌────────────────┐         ┌────────────────┐
│   [✅ Online]  │         │  [🔴 Offline]  │         │ [🔄 Syncing]   │
│                │         │                │         │                │
│ Add Score      │         │ Add Score      │         │ Add Score      │
│ [Normal mode]  │         │ [Queued mode]  │         │ [Queue shown]  │
│                │         │                │         │                │
│ Points sync    │         │ Points queued  │         │ Points syncing │
│ immediately    │         │ locally first  │         │ to server      │
└────────────────┘         └────────────────┘         └────────────────┘
```

---

## 🎯 How It Works

### When You Go Offline

1. **Offline banner appears** (yellow)
   - "Offline Mode – scores saved locally"
2. **You add scores** → They queue immediately
3. **UI shows confirmation** 
   - "✓ Queued: 50 points for Team Name"
4. **Team totals update** instantly (cached locally)

### When You Reconnect

1. **Sync banner appears** (blue)
   - "🔄 Syncing Scores... Uploading X queued score(s)"
2. **Automatic sync happens** (no action needed)
3. **Success message** shows after sync
   - "✅ All scores synced successfully!"
4. **Queue clears** and data updates from server

---

## 📊 What Gets Stored

Each score entry stores:
- ✅ Team ID
- ✅ Points (positive or negative)
- ✅ Reason/Game Name
- ✅ Day Number
- ✅ Timestamp
- ✅ Unique ID (prevents duplicates)

**Where**: Browser's `localStorage` (secure, automatic cleanup)

---

## ⚙️ Features

| Feature | Works Offline | Works Online |
|---------|---------------|--------------|
| Add single score | ✅ Queued | ✅ Synced |
| Quick add (+/- buttons) | ✅ Queued | ✅ Synced |
| Bulk add | ✅ Queued | ✅ Synced |
| See team totals | ✅ Cached | ✅ Live |
| View scoreboard | ✅ Can't | ✅ Yes |
| View history | ✅ Can't | ✅ Yes |

---

## 🔋 UI States

### Status Badge (Top Right)
```
✅ Online     🔴 Offline
```

### Banners (Top of Page)

**Offline Mode** (Yellow)
```
🔴 OFFLINE MODE
Scores will be queued and synced when connection is restored
```

**Syncing** (Blue)
```
🔄 SYNCING SCORES...
Uploading 3 queued score(s) to server
```

**Pending** (Orange)
```
⏱️ 5 Score(s) Pending
Will sync automatically    [Sync Now] (if online)
```

**Using Cache** (Gray)
```
📦 Showing cached data - offline
```

---

## 🖱️ User Actions

### Add Score While Offline
1. Select Team
2. Enter Points
3. Enter Reason (optional)
4. Click "Add Score"
5. See "✓ Queued: X points for Team Name"
6. Continue adding scores

### Manual Sync
```
⏱️ 3 Score(s) Pending
[Sync Now]  ← Click to sync manually
```

### Check Queue
Open DevTools → Application → Local Storage → `scorer_queue`

---

## ✅ What's Guaranteed

✔️ **No scores are lost** - All queued scores sync
✔️ **No duplicates** - Each score has unique ID
✔️ **Automatic retry** - Failed syncs retry on next reconnect
✔️ **Non-blocking** - UI stays responsive always
✔️ **Clear status** - Always know what's happening
✔️ **Instant feedback** - See confirmation immediately
✔️ **Mobile friendly** - Works on all devices

---

## 🚨 What If?

### Internet goes out while syncing?
- Sync pauses automatically
- Remaining scores stay in queue
- Sync resumes when connection restored
- **No data lost**

### Browser closes while offline?
- Scores stay in localStorage
- When you open again, scores still there
- Can sync when connection restored
- **No data lost**

### Same score queued twice?
- **Won't happen** - Each score has unique ID
- Even if you add it twice, they're separate entries
- Both will sync, both will count
- (This is expected behavior)

### Sync partially fails?
- Successful scores removed from queue
- Failed scores stay in queue
- Automatic retry on next connection
- **No duplicates from retry**

---

## 📱 Mobile Usage

The offline scorer works great on mobile:

✅ Works with wifi or cellular data
✅ Handles network transitions smoothly  
✅ Responsive design on all screen sizes
✅ Queuing works on mobile browsers
✅ Auto-sync when cell signal returns

---

## 🔧 Technical Details

### Storage
- **localStorage** - Native browser storage (secure)
- **Expires** - Cache data expires after 30 minutes
- **Size** - Can store ~1000+ scores
- **Scope** - Domain-specific (secure from other sites)

### Sync
- **Polling** - Queue updates checked every 1 second
- **Batch** - All pending scores sync together
- **Timeout** - Standard browser timeout (~60 seconds)
- **Retry** - Automatic retry on connection restore

### Performance
- **Non-blocking** - All operations async
- **Efficient** - Minimal network overhead
- **Fast** - ~100-500ms per score sync
- **Responsive** - UI always responsive

---

## 🎓 Examples

### Example 1: Normal Offline Session
```
1. Go offline (turn off wifi)
2. Add: 50 points for Team A → "✓ Queued"
3. Add: -10 points for Team B → "✓ Queued"
4. Turn wifi back on
5. See: "🔄 Syncing..." banner
6. See: "✅ All scores synced successfully!"
7. Continue normal scoring
```

### Example 2: Long Offline Session
```
1. Connection drops (traveling)
2. Keep scoring for 30 minutes offline
3. Queue builds up (10+ scores)
4. Reach location with wifi
5. All 10 scores sync automatically
6. Can see confirmation for each batch
```

### Example 3: Intermittent Connection
```
1. Wifi drops frequently
2. Add scores while offline
3. Connection restores briefly
4. Some scores sync
5. Connection drops again
6. More scores queue
7. Next stable connection
8. All remaining scores sync
```

---

## 📋 Checklist for Offline Events

- [ ] Have internet backup (phone hotspot)
- [ ] Test offline mode before event
- [ ] Open scorer URL before going offline
- [ ] Keep browser tab open during event
- [ ] Add scores normally (system handles offline)
- [ ] Check "Score(s) Pending" count
- [ ] When online, watch for sync confirmation
- [ ] Refresh page to verify server has scores

---

## 🔍 Troubleshooting

### Q: Scores not queuing?
A: Check if offline mode is enabled in DevTools

### Q: Queue stuck at 5 scores?
A: Manual sync may be needed - click "Sync Now" button

### Q: Lost all queued scores?
A: Try clearing cache then refreshing
```
localStorage.removeItem('scorer_queue')
```

### Q: Sync taking too long?
A: Check network speed, may need to wait 1-2 minutes

### Q: Seeing "Using cached data"?
A: Network is having issues, try manual sync

---

## 💡 Tips & Tricks

1. **Phone backup** - Use phone hotspot if wifi fails
2. **Hotspot from phone** - Can sync queued scores anytime
3. **Check pending count** - See how many scores to sync
4. **Manual sync** - Click "Sync Now" to sync immediately
5. **Monitor status badge** - Always shows online/offline status

---

## 🚀 Summary

The offline scorer is designed to **just work**:
- You don't need to think about offline/online
- System detects and handles everything
- Scores never get lost
- UI is always clear about what's happening
- No special actions needed

**Just score. Let the system handle the rest.**

---

## Need Help?

See: [OFFLINE_SCORER_COMPLETE.md](./OFFLINE_SCORER_COMPLETE.md) for detailed documentation

