# Offline Scorer - Testing Guide

## Quick Test Procedure

### Test 1: Basic Offline Mode
1. Open scorer interface: `/score/[token]`
2. Open browser DevTools (F12)
3. Go to **Network** tab
4. Check "Offline" checkbox
5. ✅ Verify offline banner appears
6. ✅ Verify badge shows "Offline" (red)
7. Enter a score using the form
8. ✅ Verify success message: "✓ Queued: X points..."
9. ✅ Verify team total updates immediately
10. ✅ Verify orange "pending" banner shows queue count

### Test 2: Auto-Sync
1. Keep queue from Test 1
2. Uncheck "Offline" in DevTools
3. ✅ Verify blue "Syncing..." banner appears
4. ✅ Verify queue count decreases
5. ✅ Verify success message: "All scores synced successfully!"
6. ✅ Verify badge changes to "Online" (green)
7. ✅ Verify scoreboard reloads with real data

### Test 3: Cached Data
1. Load scorer page (online)
2. ✅ Verify teams and event load normally
3. Go offline (DevTools)
4. Reload page (F5)
5. ✅ Verify data loads from cache
6. ✅ Verify "Using cached data" indicator appears
7. Enter scores
8. ✅ Verify scores queue successfully

### Test 4: Quick Add Offline
1. Go offline
2. Click "+5" button for a team
3. ✅ Verify queued message appears
4. ✅ Verify team total increases by 5
5. Click multiple quick add buttons
6. ✅ Verify all queue successfully
7. Go online
8. ✅ Verify all sync successfully

### Test 5: Bulk Entry Offline
1. Go offline
2. Open bulk entry section
3. Enter points for multiple teams
4. Submit bulk form
5. ✅ Verify queued message appears
6. ✅ Verify all team totals update
7. Go online
8. ✅ Verify bulk submission syncs

### Test 6: Manual Sync
1. Go offline
2. Enter 2-3 scores (any method)
3. ✅ Verify "pending" banner shows count
4. Go online
5. ✅ Verify "Sync Now" button appears
6. Click "Sync Now"
7. ✅ Verify immediate sync starts
8. ✅ Verify queue clears after sync

### Test 7: Page Reload with Queue
1. Go offline
2. Enter 2 scores
3. ✅ Verify queue shows "2 Score(s) Pending"
4. Reload page (F5)
5. ✅ Verify queue still shows "2 Score(s) Pending"
6. ✅ Verify cached data loads
7. Go online
8. ✅ Verify auto-sync processes both scores

### Test 8: Mixed Online/Offline
1. Online: Enter score → submits immediately
2. Go offline: Enter score → queues
3. Go online: Previous score auto-syncs
4. Online: Enter another score → submits immediately
5. ✅ Verify all scores recorded correctly
6. ✅ Verify scoreboard shows all scores

## Browser Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers (Chrome Mobile, iOS Safari)

## Expected Behaviors

### Visual Indicators
| State | Badge | Banner Color | Icon |
|-------|-------|--------------|------|
| Online | Green "Online" | None | Wifi |
| Offline | Red "Offline" | Yellow warning | WifiOff |
| Syncing | Green "Online" | Blue progress | RefreshCw (spinning) |
| Pending | Green/Red | Orange alert | RefreshCw |
| Using Cache | Red "Offline" | Gray info | WifiOff |

### Success Messages
- **Online submission**: `✅ X points added to TeamName`
- **Offline queue**: `✓ Queued: X points for TeamName (will sync when online)`
- **Bulk queue**: `✓ Queued X entries (will sync when online)`
- **Sync complete**: `All scores synced successfully!`

## Common Issues & Solutions

### Issue: Offline mode not detected
- **Solution**: Use browser DevTools → Network → Offline checkbox
- **Alternative**: Disconnect actual network (WiFi/Ethernet)

### Issue: Cache not loading
- **Check**: Open DevTools → Application → Local Storage
- **Verify**: Key `scorer_cache_[token]` exists with data
- **Fix**: Load page online first to populate cache

### Issue: Queue not persisting
- **Check**: DevTools → Application → Local Storage → `scorer_queue`
- **Verify**: Array of queued items present
- **Fix**: Clear localStorage and retry

### Issue: Sync not triggering
- **Check**: Console for errors
- **Verify**: Token still valid
- **Fix**: Reload page and retry sync

### Issue: Optimistic updates wrong
- **Expected**: Temporary mismatch until sync
- **Fix**: Real data loads after successful sync
- **Note**: This is normal behavior

## Simulating Network Conditions

### Chrome DevTools
1. Open DevTools (F12)
2. Network tab
3. "Throttling" dropdown
4. Select "Offline" or custom throttle
5. Test behavior

### Firefox DevTools
1. Open DevTools (F12)
2. Network tab
3. Throttling dropdown → Offline
4. Test behavior

### Real Network Disconnect
- Turn off WiFi/unplug ethernet
- Test with actual network loss
- More realistic than DevTools simulation

## Performance Checks

### Storage Usage
```javascript
// Check localStorage size
let total = 0;
for (let key in localStorage) {
  total += localStorage[key].length;
}
console.log(`localStorage: ${(total / 1024).toFixed(2)} KB`);
```

### Sync Time
- 1 score: ~100-300ms
- 10 scores: ~1-3 seconds
- 50 scores: ~5-15 seconds

### Cache Load Time
- Instant (synchronous read)
- No network delay
- Teams display immediately

## Accessibility Testing

- [ ] Status indicators readable by screen readers
- [ ] Color-blind friendly (not just color-coded)
- [ ] Keyboard navigation works offline
- [ ] Focus states visible
- [ ] Error messages descriptive

## Mobile Testing

### iOS Safari
- [ ] Offline mode detection works
- [ ] localStorage persists
- [ ] Touch interactions work
- [ ] UI scales properly

### Chrome Mobile
- [ ] Offline banner visible
- [ ] Queue button accessible
- [ ] Sync triggers on reconnect
- [ ] Performance acceptable

### Tablet
- [ ] Layout adapts correctly
- [ ] Touch targets adequate size
- [ ] No UI overflow
- [ ] All features accessible

## Security Verification

- [ ] Tokens still required for API access
- [ ] No token exposure in localStorage
- [ ] Cache clears on logout
- [ ] Server validates all synced scores
- [ ] No client-side validation bypass

## Edge Cases

### Multiple Tabs
1. Open scorer in 2 tabs
2. Go offline in both
3. Queue scores in tab 1
4. ✅ Verify tab 2 shows same queue count
5. Sync from tab 2
6. ✅ Verify both tabs update

### Cache Expiration
1. Load scorer page (online)
2. Wait 31 minutes (cache expires at 30m)
3. Go offline
4. Reload page
5. ✅ Verify cache ignored (expired)
6. ✅ Verify error shown (no fresh data)

### Large Queue
1. Go offline
2. Queue 50+ scores
3. Go online
4. ✅ Verify sync completes (may take 10-15s)
5. ✅ Verify all scores recorded
6. ✅ Verify UI doesn't freeze

### Partial Sync Failure
1. Queue 5 scores offline
2. Invalidate token (change in DevTools)
3. Go online
4. ✅ Verify sync fails
5. ✅ Verify items remain in queue
6. Fix token
7. ✅ Verify retry succeeds

## Automated Testing (Future)

```javascript
// Playwright test example
test('offline score queueing', async ({ page, context }) => {
  await page.goto('/score/test-token');
  await context.setOffline(true);
  
  await page.fill('[name="points"]', '10');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.success-message'))
    .toContainText('Queued');
    
  await context.setOffline(false);
  
  await expect(page.locator('.sync-banner'))
    .toBeVisible();
});
```

## Success Criteria

All tests pass ✅:
- [ ] Offline detection works instantly
- [ ] All score types queue properly
- [ ] Cache loads on network failure
- [ ] Auto-sync triggers on reconnect
- [ ] Manual sync button works
- [ ] Queue persists across reloads
- [ ] Optimistic UI updates correctly
- [ ] Real data loads after sync
- [ ] All visual indicators clear
- [ ] No data loss in any scenario

## Reporting Issues

When reporting bugs, include:
1. Browser & version
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Console errors (DevTools → Console)
6. localStorage contents (if relevant)
7. Network conditions (online/offline/throttled)

## Next Steps After Testing

1. ✅ Verify all basic tests pass
2. ✅ Test on mobile devices
3. ✅ Load test with large queues
4. ✅ Security audit
5. 📱 Consider PWA conversion
6. 🔄 Add service worker for full offline
7. 📊 Monitor real-world usage
8. 🎯 Gather user feedback

