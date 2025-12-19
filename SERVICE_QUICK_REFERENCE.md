# Service Layer Quick Reference

**Mode:** Appwrite Services with Mock Fallback  
**Toggle:** `NEXT_PUBLIC_USE_APPWRITE_SERVICES=true|false`

---

## Service Imports

```typescript
// Import from adapter
import { 
  eventsService, 
  teamsService, 
  scoresService, 
  recapsService,
  isUsingAppwriteServices,
  getServiceMode 
} from '@/lib/services';

// Check mode
console.log(getServiceMode());  // "appwrite" or "mock"
console.log(isUsingAppwriteServices());  // boolean
```

---

## Events Service API

```typescript
// Get all user's events
const res = await eventsService.getEvents(userId, {
  status?: 'draft' | 'active' | 'completed' | 'archived',
  limit?: number,
  offset?: number
});
// Returns: { success: true; data: { events, total } }
//          { success: false; error: string }

// Get single event
const res = await eventsService.getEvent(eventId);
// Returns: { success: true; data: { event } }

// Create event
const res = await eventsService.createEvent(userId, {
  event_name: string,
  theme_color?: string,
  logo_path?: string,
  allow_negative?: boolean,
  display_mode?: 'cumulative' | 'per-game',
  num_teams?: number,
  status?: 'draft' | 'active' | 'completed' | 'archived'
});
// Returns: { success: true; data: { event } }

// Update event
const res = await eventsService.updateEvent(eventId, {
  event_name?: string,
  status?: string,
  // ... other fields
});
// Returns: { success: true; data: { event } }

// Delete event
const res = await eventsService.deleteEvent(eventId);
// Returns: { success: true }

// Duplicate event
const res = await eventsService.duplicateEvent(eventId, userId);
// Returns: { success: true; data: { event } }

// Get event statistics
const res = await eventsService.getEventStats(eventId);
// Returns: { success: true; data: { event, totalGames, completedGames } }
```

---

## Teams Service API

```typescript
// Get teams for event
const res = await teamsService.getTeams(eventId);
// Returns: { success: true; data: { teams } }  // Sorted by points DESC

// Get single team
const res = await teamsService.getTeam(teamId);
// Returns: { success: true; data: { team } }

// Create team
const res = await teamsService.createTeam(userId, {
  event_id: string,
  team_name: string,
  avatar_path?: string
});
// Returns: { success: true; data: { team } }

// Update team
const res = await teamsService.updateTeam(teamId, {
  team_name?: string,
  avatar_path?: string
});
// Returns: { success: true; data: { team } }

// Delete team
const res = await teamsService.deleteTeam(teamId);
// Returns: { success: true }

// Check team name availability
const res = await teamsService.checkTeamName(eventId, teamName);
// Returns: { success: true; data: { available: boolean, suggestions: string[] } }

// Update team total points
const res = await teamsService.updateTeamTotalPoints(teamId, totalPoints);
// Returns: { success: true; data: { team } }
```

---

## Scores Service API

```typescript
// Get scores for event
const res = await scoresService.getScores(eventId, {
  teamId?: string,
  gameNumber?: number,
  limit?: number,
  offset?: number
});
// Returns: { success: true; data: { scores } }

// Get single score
const res = await scoresService.getScore(scoreId);
// Returns: { success: true; data: { score } }

// Add or update score (UPSERT)
const res = await scoresService.addScore(userId, {
  event_id: string,
  team_id: string,
  game_number: number,
  points: number
});
// Returns: { success: true; data: { score } }
// Note: If (event_id, team_id, game_number) exists, updates; otherwise creates

// Delete score
const res = await scoresService.deleteScore(scoreId);
// Returns: { success: true }

// Get scores for team
const res = await scoresService.getScoresForTeam(teamId);
// Returns: { success: true; data: { scores, totalPoints } }

// Get leaderboard for event
const res = await scoresService.getLeaderboard(eventId);
// Returns: { success: true; data: { scores, leaderboard, total } }
// Leaderboard: sorted by totalPoints DESC, aggregated per team

// Get game statistics
const res = await scoresService.getGameStats(eventId, gameNumber);
// Returns: { success: true; data: { gameNumber, scores, totalPoints, teamCount } }
```

---

## Recaps Service API

```typescript
// Create recap snapshot
const res = await recapsService.createRecap(userId, eventId, {
  event_id: string,
  event_name: string,
  total_games: number,
  total_teams: number,
  final_leaderboard: Array<{
    team_id: string,
    team_name: string,
    total_points: number,
    rank: number
  }>,
  top_scorer?: { team_id, team_name, total_points },
  winner?: { team_id, team_name, total_points },
  highlights?: string[]
});
// Returns: { success: true; data: { recap } }

// Get single recap
const res = await recapsService.getRecap(recapId);
// Returns: { success: true; data: { recap } }

// Get all recaps for event
const res = await recapsService.getEventRecaps(eventId);
// Returns: { success: true; data: { recaps } }

// Get latest recap for event
const res = await recapsService.getLatestRecap(eventId);
// Returns: { success: true; data: { recap } }

// Delete recap
const res = await recapsService.deleteRecap(recapId);
// Returns: { success: true }
```

---

## Common Patterns

### Handle Success/Error
```typescript
const res = await eventsService.getEvents(userId);

if (res.success) {
  console.log(res.data.events);  // Type-safe: Event[]
} else {
  console.error(res.error);      // Type-safe: string
}
```

### With Loading State
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [events, setEvents] = useState<Event[]>([]);

useEffect(() => {
  (async () => {
    setLoading(true);
    setError(null);
    
    const res = await eventsService.getEvents(userId);
    
    if (res.success) {
      setEvents(res.data.events);
    } else {
      setError(res.error);
    }
    
    setLoading(false);
  })();
}, [userId]);
```

### Pagination
```typescript
const [page, setPage] = useState(0);
const pageSize = 10;

const res = await eventsService.getEvents(userId, {
  limit: pageSize,
  offset: page * pageSize
});

if (res.success) {
  const hasMore = page * pageSize + res.data.total < res.data.total;
  // ...
}
```

### Filtering
```typescript
// By status
const res = await eventsService.getEvents(userId, {
  status: 'active'
});

// Multiple filters
const res = await scoresService.getScores(eventId, {
  gameNumber: 1,
  teamId: 'team-123'
});
```

### Upsert Score
```typescript
// Same game/team, different points = automatic update
const first = await scoresService.addScore(userId, {
  event_id: eventId,
  team_id: teamId,
  game_number: 1,
  points: 50  // Creates
});

const second = await scoresService.addScore(userId, {
  event_id: eventId,
  team_id: teamId,
  game_number: 1,
  points: 75  // Updates (no duplicate created)
});
```

### Create and Verify
```typescript
// Create
const createRes = await eventsService.createEvent(userId, {
  event_name: 'Camp 2025',
  num_teams: 4
});

if (createRes.success) {
  const eventId = createRes.data.event.$id;
  
  // Verify
  const getRes = await eventsService.getEvent(eventId);
  if (getRes.success) {
    console.log('Event created:', getRes.data.event.event_name);
  }
}
```

---

## Type Definitions

```typescript
// Common Response Shape
type ServiceResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Events
interface Event {
  $id: string;
  user_id: string;
  event_name: string;
  theme_color?: string;
  logo_path?: string;
  allow_negative?: boolean;
  display_mode?: 'cumulative' | 'per-game';
  num_teams?: number;
  status?: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

// Teams
interface Team {
  $id: string;
  user_id: string;
  event_id: string;
  team_name: string;
  avatar_path?: string | null;
  total_points: number;
  created_at?: string;
}

// Scores
interface Score {
  $id: string;
  user_id: string;
  event_id: string;
  team_id: string;
  game_number: number;
  points: number;
  created_at: string;
}

// Recaps
interface Recap {
  $id: string;
  event_id: string;
  snapshot: RecapSnapshot;
  generated_at: string;
}

interface RecapSnapshot {
  event_id: string;
  event_name: string;
  total_games: number;
  total_teams: number;
  final_leaderboard: Array<{...}>;
  top_scorer?: {...};
  winner?: {...};
  highlights?: string[];
}
```

---

## Environment Configuration

```bash
# .env.local

# Toggle service mode
NEXT_PUBLIC_USE_APPWRITE_SERVICES=false    # Start with mock
# Change to true after collections created

# Appwrite credentials (required when toggled to true)
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT=694164500028df77ada9
APPWRITE_API_KEY=<your-api-key>  # Server-only
```

---

## Debugging

```typescript
// Check service mode
import { getServiceMode, isUsingAppwriteServices } from '@/lib/services';

console.log(`Mode: ${getServiceMode()}`);
console.log(`Using Appwrite: ${isUsingAppwriteServices()}`);

// Enable logging in dev
if (process.env.NODE_ENV === 'development') {
  console.log('[Service Layer] Initialized', getServiceMode());
}
```

---

## Migration Checklist

- [ ] Collections created in Appwrite Console
- [ ] All indexes added per `APPWRITE_COLLECTIONS_SETUP.md`
- [ ] Permissions set to "Create: Users"
- [ ] Test collections by creating sample documents
- [ ] Update components to import from adapter
- [ ] Pass userId to all service calls
- [ ] Set `NEXT_PUBLIC_USE_APPWRITE_SERVICES=true`
- [ ] Run E2E tests
- [ ] Verify mock mode still works
- [ ] Deploy to production

---

## Support

**Issues:**
- Service returns `success: false` → check `error` property for details
- "Collection does not exist" → verify collection created in Appwrite Console
- "Permission denied" → check document permissions and user ID match
- Mode not switching → verify env variable and restart dev server

**Docs:**
- Setup: `APPWRITE_COLLECTIONS_SETUP.md`
- Testing: `PHASE_C_ACCEPTANCE_CRITERIA.md`
- Integration: `PHASE_C_INTEGRATION_TESTS.md`
