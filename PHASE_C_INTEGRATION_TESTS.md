# Phase C - CRUD Integration Test Guide

**Status:** Appwrite service layer created and ready to test  
**Prerequisites:**
- Database `main` created
- 4 collections created (events, teams, scores, recaps)
- Permissions configured
- `NEXT_PUBLIC_USE_APPWRITE_SERVICES=false` (initially)

---

## Testing Strategy

### Phase 1: Mock Mode Baseline (Current)
```env
NEXT_PUBLIC_USE_APPWRITE_SERVICES=false
```
- All existing functionality works
- Baseline for comparison

### Phase 2: Collection Readiness Check
1. Create collections in Appwrite Console
2. Verify no permission errors
3. Test document creation manually in Console

### Phase 3: Service Layer Activation
```env
NEXT_PUBLIC_USE_APPWRITE_SERVICES=true
```
- Switch to Appwrite services
- Run tests below
- Fix any permission/query issues

---

## Test Suite

### Test 1: Event CRUD Flow

**Setup:**
```typescript
import { eventsService } from '@/lib/services';
const userId = 'test-user-123';
```

**Test 1a: Create Event**
```typescript
const res = await eventsService.createEvent(userId, {
  event_name: 'Test Event',
  theme_color: '#7c3aed',
  status: 'draft',
  num_teams: 4,
});

expect(res.success).toBe(true);
expect(res.data.event.$id).toBeDefined();
expect(res.data.event.user_id).toBe(userId);
```

**Expected:**
- ✅ Document created in Appwrite
- ✅ ID auto-generated
- ✅ Timestamps auto-filled
- ✅ User owns document

**Test 1b: Read Events**
```typescript
const res = await eventsService.getEvents(userId);

expect(res.success).toBe(true);
expect(res.data.events.length).toBeGreaterThan(0);
expect(res.data.events[0].user_id).toBe(userId);
```

**Expected:**
- ✅ Returns only user's events
- ✅ Ordered by created_at DESC

**Test 1c: Update Event**
```typescript
const eventId = res.data.event.$id;
const updateRes = await eventsService.updateEvent(eventId, {
  event_name: 'Updated Event Name',
  status: 'active',
});

expect(updateRes.success).toBe(true);
expect(updateRes.data.event.event_name).toBe('Updated Event Name');
```

**Expected:**
- ✅ Document updated
- ✅ `updated_at` refreshed

**Test 1d: Delete Event**
```typescript
const deleteRes = await eventsService.deleteEvent(eventId);

expect(deleteRes.success).toBe(true);

// Verify deletion
const getRes = await eventsService.getEvent(eventId);
expect(getRes.success).toBe(false);
```

**Expected:**
- ✅ Document deleted
- ✅ Cannot retrieve deleted event

---

### Test 2: Team CRUD Flow

**Test 2a: Create Team**
```typescript
const teamRes = await teamsService.createTeam(userId, {
  event_id: eventId,
  team_name: 'Red Team',
});

expect(teamRes.success).toBe(true);
expect(teamRes.data.team.total_points).toBe(0);
```

**Expected:**
- ✅ Team created with `total_points = 0`
- ✅ Linked to event

**Test 2b: Check Team Name Availability**
```typescript
const available = await teamsService.checkTeamName(eventId, 'Red Team');

expect(available.data.available).toBe(false);
expect(available.data.suggestions).toContain('Red Team 2');
```

**Expected:**
- ✅ Detects duplicate name
- ✅ Provides suggestions

**Test 2c: Get Teams by Event**
```typescript
const teamsRes = await teamsService.getTeams(eventId);

expect(teamsRes.success).toBe(true);
expect(teamsRes.data.teams.length).toBeGreaterThan(0);
expect(teamsRes.data.teams[0].event_id).toBe(eventId);
```

**Expected:**
- ✅ Returns only teams for this event
- ✅ Ordered by total_points DESC

**Test 2d: Update Team Total Points**
```typescript
const updateRes = await teamsService.updateTeamTotalPoints(teamId, 150);

expect(updateRes.success).toBe(true);
expect(updateRes.data.team.total_points).toBe(150);
```

**Expected:**
- ✅ Points updated
- ✅ Leaderboard reflects change

---

### Test 3: Score CRUD & Upsert Flow

**Test 3a: Add Score (Create)**
```typescript
const scoreRes = await scoresService.addScore(userId, {
  event_id: eventId,
  team_id: teamId,
  game_number: 1,
  points: 50,
});

expect(scoreRes.success).toBe(true);
expect(scoreRes.data.score.points).toBe(50);
```

**Expected:**
- ✅ Score created
- ✅ Composite index prevents duplicates

**Test 3b: Add Score (Upsert)**
```typescript
// Same game/team, different points
const upsertRes = await scoresService.addScore(userId, {
  event_id: eventId,
  team_id: teamId,
  game_number: 1,
  points: 75, // Changed from 50
});

expect(upsertRes.success).toBe(true);
expect(upsertRes.data.score.points).toBe(75);

// Verify only one score exists
const scoresRes = await scoresService.getScores(eventId, { gameNumber: 1 });
expect(scoresRes.data.scores.length).toBe(1);
```

**Expected:**
- ✅ Updates existing score (doesn't create duplicate)
- ✅ Composite index enforces uniqueness

**Test 3c: Get Leaderboard**
```typescript
// Create more scores for different teams
await scoresService.addScore(userId, { event_id: eventId, team_id: team2Id, game_number: 1, points: 100 });
await scoresService.addScore(userId, { event_id: eventId, team_id: team3Id, game_number: 1, points: 60 });

const leaderboardRes = await scoresService.getLeaderboard(eventId);

expect(leaderboardRes.success).toBe(true);
expect(leaderboardRes.data.leaderboard[0].totalPoints).toBe(100); // team2
expect(leaderboardRes.data.leaderboard[1].totalPoints).toBe(75); // team1
```

**Expected:**
- ✅ Sorted by total points DESC
- ✅ Aggregates all games for each team

**Test 3d: Get Game Stats**
```typescript
const gameRes = await scoresService.getGameStats(eventId, 1);

expect(gameRes.success).toBe(true);
expect(gameRes.data.gameNumber).toBe(1);
expect(gameRes.data.totalPoints).toBe(235); // 100 + 75 + 60
expect(gameRes.data.teamCount).toBe(3);
```

**Expected:**
- ✅ Totals all scores for game
- ✅ Counts participating teams

---

### Test 4: Recap CRUD Flow

**Test 4a: Create Recap Snapshot**
```typescript
const snapshot = {
  event_id: eventId,
  event_name: 'Test Event',
  total_games: 1,
  total_teams: 3,
  final_leaderboard: [
    { team_id: team2Id, team_name: 'Blue Team', total_points: 100, rank: 1 },
    { team_id: team1Id, team_name: 'Red Team', total_points: 75, rank: 2 },
  ],
  top_scorer: { team_id: team2Id, team_name: 'Blue Team', total_points: 100 },
};

const recapRes = await recapsService.createRecap(userId, eventId, snapshot);

expect(recapRes.success).toBe(true);
expect(recapRes.data.recap.snapshot.final_leaderboard.length).toBe(2);
```

**Expected:**
- ✅ Recap created with JSON snapshot
- ✅ Timestamps auto-filled

**Test 4b: Get Latest Recap**
```typescript
const latestRes = await recapsService.getLatestRecap(eventId);

expect(latestRes.success).toBe(true);
expect(latestRes.data.recap.event_id).toBe(eventId);
```

**Expected:**
- ✅ Returns most recent recap
- ✅ Ordered by generated_at DESC

**Test 4c: Get All Recaps**
```typescript
const recapsRes = await recapsService.getEventRecaps(eventId);

expect(recapsRes.success).toBe(true);
expect(recapsRes.data.recaps.length).toBeGreaterThanOrEqual(1);
```

**Expected:**
- ✅ Returns all recaps for event

---

### Test 5: Permission & Security Checks

**Test 5a: Other User Cannot Read Document**
```typescript
const otherUserId = 'other-user-123';

// Try to fetch event created by user1 as user2
const res = await eventsService.getEvent(eventId); // Called as otherUserId context
// Should fail or return empty
```

**Expected:**
- ✅ Access denied or returns empty (depends on permission model)

**Test 5b: Cannot Modify Other User's Document**
```typescript
const updateRes = await eventsService.updateEvent(eventId, { event_name: 'Hacked' });
// Called from otherUserId context

expect(updateRes.success).toBe(false);
```

**Expected:**
- ✅ Update fails due to permissions

---

### Test 6: Query Performance & Limits

**Test 6a: Pagination**
```typescript
const res1 = await eventsService.getEvents(userId, { limit: 5, offset: 0 });
const res2 = await eventsService.getEvents(userId, { limit: 5, offset: 5 });

expect(res1.data.events.length).toBeLessThanOrEqual(5);
expect(res2.data.events.length).toBeLessThanOrEqual(5);
```

**Expected:**
- ✅ Limits work
- ✅ Offset works

**Test 6b: Status Filter**
```typescript
// Create draft and active events
await eventsService.createEvent(userId, { event_name: 'Draft Event', status: 'draft' });
await eventsService.createEvent(userId, { event_name: 'Active Event', status: 'active' });

const draftRes = await eventsService.getEvents(userId, { status: 'draft' });
const activeRes = await eventsService.getEvents(userId, { status: 'active' });

expect(draftRes.data.events.every(e => e.status === 'draft')).toBe(true);
expect(activeRes.data.events.every(e => e.status === 'active')).toBe(true);
```

**Expected:**
- ✅ Filter by status works
- ✅ Returns only matching documents

---

## Integration Checklist

### Before Enabling Services

- [ ] Database `main` exists
- [ ] Collections created: events, teams, scores, recaps
- [ ] Indexes created for all collections
- [ ] Permissions set: "Create: Users"
- [ ] Document permissions set at creation time

### During Testing

- [ ] Set `NEXT_PUBLIC_USE_APPWRITE_SERVICES=true` in `.env.local`
- [ ] Restart dev server
- [ ] Run Test 1 (Events CRUD) ✓
- [ ] Run Test 2 (Teams CRUD) ✓
- [ ] Run Test 3 (Scores CRUD & Upsert) ✓
- [ ] Run Test 4 (Recaps CRUD) ✓
- [ ] Run Test 5 (Permissions) ✓
- [ ] Run Test 6 (Query Performance) ✓

### After Testing

- [ ] All CRUD operations work
- [ ] Permissions enforced
- [ ] No 401 authorization errors
- [ ] Service logs show "Using Appwrite services"
- [ ] UI features work end-to-end

---

## Debugging Tips

### Service Mode Check

```typescript
// In browser console or test file
import { getServiceMode } from '@/lib/services';
console.log(getServiceMode()); // "appwrite" or "mock"
```

### Enable Debug Logging

Add to service files:
```typescript
console.log('[appwriteEvents.getEvents]', { userId, filters, result });
```

### Common Errors

| Error | Cause | Fix |
|---|---|---|
| "Collection does not exist" | Collection ID mismatch | Check collection ID in console |
| "Document not found" | Querying non-existent doc | Verify document was created |
| "Permission denied" | Missing document permissions | Set permissions on create |
| "Invalid query" | Index missing for query | Add index to collection |

---

## Next Steps

1. ✅ Create collections (APPWRITE_COLLECTIONS_SETUP.md)
2. ✅ Run CRUD tests (this guide)
3. ✅ Fix permission/query issues
4. → Enable services toggle permanently
5. → Test full UI workflows
6. → Deploy to production

---

**Estimated test time:** 30-45 minutes
