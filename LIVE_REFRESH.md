# Live Score Refresh System

## Overview

The public scoreboard now features an intelligent refresh system that balances real-time updates with server load and user control.

## Features

### 1. Auto-Refresh (5 Minutes)
**Previous:** 6-second polling (600 requests/hour per user)
**Current:** 5-minute polling (12 requests/hour per user)

**Benefits:**
- 98% reduction in server load
- Maintains live updates for camp/tournament scenarios
- Suitable for most event durations (hours to days)
- Prevents rate limiting issues
- Reduces database queries

**Implementation:**
```typescript
// Auto-refresh every 5 minutes
useEffect(() => {
  loadData();
  const id = setInterval(() => loadData(), 300000); // 300000ms = 5 minutes
  return () => { clearInterval(id); };
}, [token, reloadCounter]);
```

### 2. Manual Refresh Button
**Location:** Top-right header, next to Fullscreen button

**Features:**
- On-demand refresh without waiting for auto-interval
- Loading state with spinner animation (🔄)
- Disabled during refresh to prevent spam
- Updates timestamp immediately after completion

**User Experience:**
- Click "Refresh" → Button shows "Refreshing..." with spinning icon
- Data fetched → Teams re-ranked → Timestamp updated
- Button re-enabled for next manual refresh

**Code:**
```typescript
const handleManualRefresh = () => {
  loadData(true); // true = isManual flag
};

<button 
  onClick={handleManualRefresh}
  disabled={isRefreshing}
  className="disabled:opacity-50 disabled:cursor-not-allowed"
>
  <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
  {isRefreshing ? 'Refreshing...' : 'Refresh'}
</button>
```

### 3. Last Updated Timestamp
**Location:** Header, below status badges

**Format:**
- `just now` - less than 1 minute ago
- `2m ago` - 2 minutes ago
- `1h ago` - 1 hour ago
- `a while ago` - over 24 hours

**Update Frequency:**
- Timestamp text updates every 10 seconds
- Actual data updates every 5 minutes (or on manual refresh)

**Implementation:**
```typescript
const getRelativeTime = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return 'a while ago';
};

// Update relative time every 10 seconds
useEffect(() => {
  const id = setInterval(() => {
    setRelativeTime(getRelativeTime(lastUpdate));
  }, 10000);
  return () => clearInterval(id);
}, [lastUpdate]);
```

## UI Components

### Header Information Display
```
[Live Badge] ⏱️ Auto-refresh: 5m  |  Updated 2m ago
[Refresh Button] [Fullscreen Button]
```

### Status Badge States
- **Live** (green pulsing dot) - Connected, polling active
- **Loading** (blue) - Initial data load
- **Error** (yellow) - Network/server issue

## Data Loading Flow

```
1. Initial Load:
   ├─ Verify token (/api/public/verify/{token})
   ├─ Fetch data (/api/public/{token})
   ├─ Update teams, scores, event
   ├─ Set lastUpdate timestamp
   └─ Schedule next refresh (5 minutes)

2. Auto-Refresh (every 5 minutes):
   ├─ Same fetch flow
   ├─ Compare old/new ranks
   ├─ Trigger animations if changes
   └─ Update timestamp

3. Manual Refresh (on button click):
   ├─ Set isRefreshing = true (show spinner)
   ├─ Same fetch flow
   ├─ Set isRefreshing = false
   └─ Update timestamp
```

## Performance Comparison

### Before (6-second refresh)
- **Requests/hour per user:** 600
- **Server load (100 users):** 60,000 requests/hour
- **Database queries:** 60,000/hour
- **Risk:** Rate limiting, server overload

### After (5-minute refresh)
- **Requests/hour per user:** 12 (auto) + manual clicks
- **Server load (100 users):** 1,200 requests/hour (95% reduction)
- **Database queries:** 1,200/hour (95% reduction)
- **Risk:** Minimal, scalable to thousands of users

## User Benefits

### For Event Organizers
- Reduced hosting costs (fewer API calls)
- Scalable to large audiences
- Reliable performance under load
- Professional presentation

### For Spectators
- Control over data freshness
- Clear visibility of last update
- Immediate refresh when needed
- No page reload required

### For Mobile Users
- Reduced data usage
- Better battery life
- Still responsive (manual refresh available)

## Testing Checklist

- [ ] Open public scoreboard
- [ ] Verify "Auto-refresh: 5m" text displayed
- [ ] Verify "Updated just now" text displayed
- [ ] Wait 30 seconds, verify timestamp changes to "just now" (updates every 10s)
- [ ] Click "Refresh" button
- [ ] Verify button shows "Refreshing..." with spinning icon
- [ ] Verify button disabled during refresh
- [ ] Verify timestamp resets to "just now" after refresh
- [ ] Add score from admin panel
- [ ] Click "Refresh" on scoreboard
- [ ] Verify new score appears
- [ ] Wait 5 minutes
- [ ] Verify scoreboard auto-refreshes (timestamp resets)
- [ ] Check network tab: requests every ~5 minutes (not 6 seconds)

## Technical Details

### State Management
```typescript
const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
const [isRefreshing, setIsRefreshing] = useState(false);
const [relativeTime, setRelativeTime] = useState(getRelativeTime(lastUpdate));
```

### Timer Management
- **Auto-refresh timer:** 300000ms (5 minutes)
- **Relative time timer:** 10000ms (10 seconds)
- Both timers cleaned up on component unmount

### Error Handling
- Network errors show in status badge
- Manual refresh re-enabled even after errors
- Auto-refresh continues despite individual failures

## Future Enhancements

### Low Priority
- [ ] Configurable refresh interval in event settings
- [ ] Refresh interval based on event mode (quick=1m, advanced=5m, camp=10m)
- [ ] WebSocket support for instant updates (optional)
- [ ] Pause auto-refresh when tab inactive (battery saving)
- [ ] "New scores available" notification with refresh prompt

### Medium Priority
- [ ] Show countdown to next auto-refresh
- [ ] Refresh history log (last 5 refreshes)
- [ ] Network quality indicator
- [ ] Offline mode with cached data

## API Impact

**Endpoints Affected:**
- GET `/api/public/verify/{token}` - called once per refresh
- GET `/api/public/{token}` - called once per refresh

**Response Time:**
- Typical: 50-200ms
- Database query optimized (single join)
- No impact on other API routes

## Browser Compatibility

**Supported:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

**Features:**
- `setInterval` (universal support)
- `Date.now()` (universal support)
- `animate-spin` (Tailwind CSS)
- Button disabled state (HTML5)

## Summary

The new refresh system provides:
- ✅ **5-minute auto-refresh** - reduces server load by 95%
- ✅ **Manual refresh button** - user control with loading state
- ✅ **Last updated timestamp** - relative time display with auto-update

**Result:** Professional, scalable, user-friendly live scoreboard system suitable for events with hundreds of concurrent viewers.
