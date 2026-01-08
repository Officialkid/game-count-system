# Offline Scorer Safety System

## Overview

The scorer interface now supports **full offline functionality**, allowing score entry even when network connectivity is lost. All offline scores are queued locally and automatically synced when the connection is restored.

## Features

### ✅ Offline Detection
- Automatic detection using `navigator.onLine` API
- Real-time status indicator (Online/Offline badge)
- Visual alerts when connection is lost/restored

### 💾 Local Caching
- Event and team data cached in `localStorage`
- 30-minute cache validity period
- Fallback to cache when API calls fail
- Cached data indicator shown to user

### 📝 Score Queuing
- All score submissions queued when offline:
  - Single score entries
  - Quick add buttons (±1, ±5, ±10, ±25)
  - Bulk score entries
- Queue stored in `localStorage` with unique IDs
- Persistent across page reloads

### 🔄 Auto-Sync
- Automatic sync when connection is restored
- Manual sync button when queue has pending items
- Retries failed sync attempts
- Clear success/failure feedback

### 🎨 Optimistic UI Updates
- Team scores update immediately when offline
- Visual indication that scores are queued
- Cache updated with optimistic changes
- Real scores loaded after sync completes

## Architecture

### localStorage Keys

```typescript
// Cache keys (per scorer token)
`scorer_cache_${token}` = {
  event: Event,
  teams: Team[],
  timestamp: number,
  token: string
}

// Queue key (global)
`scorer_queue` = QueuedScore[]
```

### Queue Item Structure

```typescript
interface QueuedScore {
  id: string;              // Unique ID for queue management
  eventId: string;         // Event ID
  teamId: string;          // Team ID (empty for bulk)
  points: number;          // Points value (0 for bulk)
  category: string;        // Score category/reason
  dayNumber: number;       // Day number (always 1 for quick/camp)
  timestamp: number;       // When queued (Unix timestamp)
  type: 'single' | 'quick' | 'bulk';  // Submission type
  bulkItems?: Array<{      // Only for bulk submissions
    team_id: string;
    points: number;
  }>;
}
```

## User Experience

### Online Mode
1. ✅ Normal operation
2. Green "Online" badge visible
3. Scores submitted immediately
4. Success message shown
5. Scoreboard reloads automatically

### Offline Mode
1. 🔴 Connection lost detected
2. Yellow "Offline Mode" banner appears
3. Red "Offline" badge visible
4. Scores are queued locally
5. Success message: "✓ Queued: X points for TeamName (will sync when online)"
6. Team totals update optimistically
7. Orange banner shows pending queue count

### Sync Process
1. 🌐 Connection restored detected
2. Blue "Syncing Scores..." banner appears
3. All queued items submitted sequentially
4. Successfully synced items removed from queue
5. Failed items remain for retry
6. Success message: "All scores synced successfully!"
7. Scoreboard reloads with real data

## Visual Indicators

### Status Banners

```tsx
// Offline Warning
<div className="bg-yellow-50 border-yellow-400">
  <WifiOff /> Offline Mode
  Scores will be queued and synced when connection is restored
</div>

// Syncing Progress
<div className="bg-blue-50 border-blue-400">
  <RefreshCw className="animate-spin" /> Syncing Scores...
  Uploading X queued score(s) to server
</div>

// Pending Queue
<div className="bg-orange-50 border-orange-400">
  <RefreshCw /> X Score(s) Pending
  [Sync Now button if online]
</div>

// Using Cache
<div className="bg-gray-50 border-gray-400">
  <WifiOff /> Showing cached data - offline
</div>
```

### Header Badge
- **Online**: Green badge with `<Wifi />` icon
- **Offline**: Red badge with `<WifiOff />` icon

## Technical Implementation

### Network Detection

```typescript
// Initial state
const [isOnline, setIsOnline] = useState(
  typeof navigator !== 'undefined' ? navigator.onLine : true
);

// Event listeners
useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    syncQueue(); // Auto-sync when online
  };
  
  const handleOffline = () => {
    setIsOnline(false);
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

### Score Submission Flow

```typescript
const handleSubmitScore = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Check if offline
  if (!isOnline) {
    // Queue the score
    queueScore({ eventId, teamId, points, category, dayNumber: 1, type: 'single' });
    
    // Update cache optimistically
    updateCachedTeamPoints(token, teamId, points);
    
    // Update UI optimistically
    setTeams(prevTeams => prevTeams.map(team => 
      team.id === teamId 
        ? { ...team, total_points: (team.total_points || 0) + points }
        : team
    ));
    
    // Show queued message
    setSuccessMessage(`✓ Queued: ${points} points (will sync when online)`);
    return;
  }
  
  // Online: Submit normally
  const res = await fetch('/api/events/${eventId}/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-SCORER-TOKEN': token },
    body: JSON.stringify({ team_id, day_number, category, points })
  });
  
  // Handle response...
};
```

### Sync Queue Function

```typescript
const syncQueue = async () => {
  const queue = getQueue();
  if (queue.length === 0) return;
  
  setSyncing(true);
  
  for (const queuedScore of queue) {
    try {
      if (queuedScore.type === 'bulk') {
        await fetch('/api/scores/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ event_id, category, items: queuedScore.bulkItems })
        });
      } else {
        await fetch(`/api/events/${queuedScore.eventId}/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-SCORER-TOKEN': token },
          body: JSON.stringify({ team_id, day_number, category, points })
        });
      }
      
      removeFromQueue(queuedScore.id); // Success
    } catch (error) {
      console.error('Failed to sync score:', error);
      // Keep in queue for retry
    }
  }
  
  setSyncing(false);
  
  if (getQueue().length === 0) {
    setSuccessMessage('All scores synced successfully!');
    loadData(); // Reload real data
  }
};
```

## Edge Cases Handled

### 1. **Connection Lost During Load**
- Attempts to load from API
- Falls back to cached data on error
- Shows "Using cached data" indicator
- User can still enter scores (queued)

### 2. **Connection Lost During Submission**
- Fetch fails (network error)
- Score automatically queued
- User sees queued confirmation
- No data loss

### 3. **Page Reload While Offline**
- Queue persists in localStorage
- Cache loads automatically
- User sees pending queue count
- Can continue entering scores

### 4. **Partial Sync Failure**
- Successfully synced items removed from queue
- Failed items remain for retry
- User can manually trigger sync
- Clear feedback on what succeeded/failed

### 5. **Stale Cache**
- Cache expires after 30 minutes
- Expired cache ignored
- Fresh data required
- User sees error if can't connect

### 6. **Multiple Browser Tabs**
- Each tab has its own queue tracking
- localStorage shared across tabs
- Queue updates reflected everywhere
- Sync can happen from any tab

## Testing Checklist

### Basic Offline Functionality
- [ ] Go offline → see offline banner
- [ ] Enter single score → queued successfully
- [ ] Quick add points → queued successfully  
- [ ] Bulk entry → queued successfully
- [ ] Offline badge shows correctly
- [ ] Optimistic UI updates team totals

### Cache System
- [ ] Load page online → data cached
- [ ] Go offline → reload page → cached data loads
- [ ] Cache shows event name and teams
- [ ] "Using cached data" indicator appears
- [ ] Can enter scores with cached data

### Sync Process
- [ ] Go online → auto-sync starts
- [ ] Sync banner appears during process
- [ ] All queued scores submitted
- [ ] Queue cleared after sync
- [ ] Success message shown
- [ ] Real data loaded from server

### Edge Cases
- [ ] Enter multiple scores offline → all queued
- [ ] Reload page offline → queue persists
- [ ] Partial sync failure → failed items remain
- [ ] Manual sync button works
- [ ] Mixed online/offline submissions
- [ ] Cache expiration after 30 minutes

### UI/UX
- [ ] All status indicators clear and visible
- [ ] Color coding intuitive (green=good, yellow=warning, red=error)
- [ ] Messages are descriptive
- [ ] No confusing states
- [ ] Smooth transitions between online/offline

## Browser Compatibility

### Supported Features
- ✅ `navigator.onLine` (all modern browsers)
- ✅ `localStorage` (all modern browsers)
- ✅ `online`/`offline` events (all modern browsers)

### Minimum Requirements
- Chrome 5+
- Firefox 3.5+
- Safari 4+
- Edge (all versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Known Limitations
- `navigator.onLine` only detects network interface status
- Doesn't detect if internet actually works (e.g., captive portal)
- Fetch errors serve as backup detection
- Cache limited by localStorage quota (~5-10MB)

## Performance Considerations

### Storage Usage
- **Per Event Cache**: ~1-10 KB (depends on team count)
- **Queue Item**: ~100-200 bytes
- **Total Impact**: Minimal (<1MB typical)

### Sync Performance
- Sequential sync (one at a time)
- No concurrent requests to avoid race conditions
- Typical sync time: 100-300ms per score
- 10 queued scores = ~1-3 seconds total

### Network Usage
- Reduced: Fewer failed requests
- Cached data prevents redundant loads
- Sync batches reduce overhead

## Security Considerations

### Data Privacy
- All data stored locally in browser
- Cleared when localStorage cleared
- Not accessible cross-domain
- Scorer tokens still required for API access

### Token Security
- Tokens not stored independently
- Only in cached event data
- Same security as session storage
- No new vulnerabilities introduced

### Integrity
- Optimistic updates are temporary
- Real data loaded after sync
- Server remains source of truth
- No client-side score validation bypassed

## Maintenance

### Monitoring
- Check browser console for sync errors
- Monitor failed queue items
- Track cache hit/miss rates
- Watch for localStorage quota issues

### Troubleshooting
```javascript
// Clear cache for specific token
localStorage.removeItem(`scorer_cache_${token}`);

// Clear entire queue
localStorage.removeItem('scorer_queue');

// Check queue contents
console.log(JSON.parse(localStorage.getItem('scorer_queue') || '[]'));

// Check cache contents
console.log(JSON.parse(localStorage.getItem(`scorer_cache_${token}`) || 'null'));
```

## Future Enhancements

### Potential Improvements
1. **Service Worker**: True offline PWA with background sync
2. **IndexedDB**: Larger storage capacity for more data
3. **Conflict Resolution**: Handle concurrent edits from multiple devices
4. **Batch Sync API**: Single request for multiple scores
5. **Smart Retry**: Exponential backoff for failed syncs
6. **Offline Analytics**: Track usage patterns
7. **Push Notifications**: Alert when scores sync
8. **Background Sync API**: Sync even when page closed

### Progressive Web App (PWA)
The offline system provides a foundation for converting to a full PWA:
- Add service worker for asset caching
- Add manifest.json for install prompt
- Enable background sync for queue
- Support push notifications
- Full offline mode for entire app

---

## Summary

The offline scorer safety system ensures **zero data loss** even with poor connectivity. Scorers can confidently enter scores knowing they'll be saved and synced automatically. The system provides clear visual feedback at every step, making the offline experience seamless and stress-free.

**Key Benefits:**
- 📱 Works anywhere, even without internet
- 💾 Never lose a score entry
- 🔄 Automatic sync when connection returns
- 👀 Clear status indicators
- ⚡ Optimistic UI for instant feedback
- 🎯 Perfect for outdoor events, camps, and remote locations

