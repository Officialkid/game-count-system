# Quick Start: Using Mock Layer

## 🚀 5-Minute Quick Start

### 1. Get Authenticated User
```typescript
'use client';
import { useAuth } from '@/lib/auth-context';

export function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  
  // In isolation mode:
  // user = { id, name, email }
  // isAuthenticated = true (always)
  
  return <h1>Hello, {user?.name}</h1>;
}
```

### 2. Create an Event
```typescript
import { mockAPI } from '@/lib/mockService';

const result = await mockAPI.events.createEvent({
  event_name: 'Camp Games 2025',
  theme_color: 'purple',
  num_teams: 4,
  allow_negative: false,
});

if (result.success) {
  console.log('Event ID:', result.data.event.id);
}
```

### 3. Add Teams
```typescript
const teamResult = await mockAPI.teams.addTeam(
  eventId,
  'Red Hawks',
  'https://example.com/avatar.png'
);

console.log('Team ID:', teamResult.data.team.id);
```

### 4. Record Scores
```typescript
const scoreResult = await mockAPI.scores.addScore(
  eventId,
  teamId,
  1,        // game number
  25        // points
);

// Team total automatically updated! ✓
```

### 5. Get Summary
```typescript
const summary = await mockAPI.recap.getSummary();

console.log('Top team:', summary.data.topTeam.name);
console.log('Total games:', summary.data.totalGames);
```

## 🎨 Testing Loading States

```typescript
'use client';
import { useMockAuth } from '@/hooks/useMockAuth';

export function Dashboard() {
  // Simulate 300ms auth check for skeleton testing
  const { user, isLoading } = useMockAuth(300);
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  
  return <DashboardContent user={user} />;
}
```

## 🔐 Protected Routes

```typescript
'use client';
import { useAuth } from '@/lib/auth-context';

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  
  // Always true in isolation mode
  if (!isAuthenticated) {
    return <div>Access Denied</div>;
  }
  
  return <div>Admin Panel</div>;
}
```

## 📊 List Operations

```typescript
// Get all events
const events = await mockAPI.events.listEvents();
console.log(events.data.events);

// Get teams for event
const teams = await mockAPI.teams.listTeams(eventId);
console.log(teams.data.teams);

// Get scores for event
const scores = await mockAPI.scores.listScores(eventId);
console.log(scores.data.scores);
```

## 🗑️ Delete Operations

```typescript
// Delete score (team total automatically decremented)
await mockAPI.scores.deleteScore(scoreId);

// Delete team
await mockAPI.teams.deleteTeam(teamId);

// Delete event
await mockAPI.events.deleteEvent(eventId);
```

## 🔄 Duplicate Event

```typescript
const result = await mockAPI.events.duplicateEvent(eventId);
console.log('Duplicated event:', result.data.event.id);
```

## ✅ Team Name Availability

```typescript
const result = await mockAPI.teams.checkTeamName(
  eventId,
  'Red Hawks'
);

console.log('Available:', result.data.available);
console.log('Suggestions:', result.data.suggestions);
```

## 🎯 Public Scoreboard

```typescript
const scoreboard = await mockAPI.public.getPublicScoreboard(token);

console.log('Event:', scoreboard.data.event.event_name);
console.log('Teams:', scoreboard.data.teams);
console.log('Scores:', scoreboard.data.scores);
```

## 🔍 View Mock Data

```typescript
import { mockEvents, mockTeams, mockScores, mockUser } from '@/lib/frontend-mock';

console.log('User:', mockUser);
console.log('Events:', mockEvents);
console.log('Teams:', mockTeams);
console.log('Scores:', mockScores);
```

## ⏱️ Simulated Latency

Each service call includes realistic network delay:
- Auth operations: 300-500ms
- Event operations: 200-400ms
- Team operations: 150-200ms
- Score operations: 150-200ms

This allows testing of loading states and spinners.

## 🧩 Common Patterns

### Form Submission
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (eventName: string) => {
  setIsLoading(true);
  try {
    const result = await mockAPI.events.createEvent({
      event_name: eventName,
      theme_color: 'purple',
      num_teams: 3,
    });
    if (result.success) {
      console.log('Created:', result.data.event.id);
    }
  } finally {
    setIsLoading(false);
  }
};
```

### Error Handling
```typescript
const result = await mockAPI.events.getEvent(eventId);

if (!result.success) {
  console.error(result.error);
  return;
}

console.log(result.data);
```

### Batch Operations
```typescript
const eventId = 'evt-1';

// Create multiple teams
const teams = await Promise.all([
  mockAPI.teams.addTeam(eventId, 'Red Hawks'),
  mockAPI.teams.addTeam(eventId, 'Blue Whales'),
  mockAPI.teams.addTeam(eventId, 'Golden Foxes'),
]);

console.log('Created teams:', teams.map(t => t.data.team.id));
```

### Real-time Updates
```typescript
// Add score
await mockAPI.scores.addScore(eventId, teamId, 1, 25);

// Get updated teams
const teams = await mockAPI.teams.listTeams(eventId);

// Team totals automatically updated!
console.log(teams.data.teams);
```

## 🎓 Service Reference

```typescript
// Authentication
mockAPI.auth.authenticate(email, password)
mockAPI.auth.register(name, email, password)
mockAPI.auth.logout()
mockAPI.auth.getCurrentUser()

// Events
mockAPI.events.listEvents()
mockAPI.events.getEvent(eventId)
mockAPI.events.createEvent(data)
mockAPI.events.updateEvent(eventId, updates)
mockAPI.events.deleteEvent(eventId)
mockAPI.events.duplicateEvent(eventId)

// Teams
mockAPI.teams.listTeams(eventId)
mockAPI.teams.addTeam(eventId, name, avatar)
mockAPI.teams.checkTeamName(eventId, name)
mockAPI.teams.deleteTeam(teamId)

// Scores
mockAPI.scores.listScores(eventId)
mockAPI.scores.addScore(eventId, teamId, gameNum, points)
mockAPI.scores.deleteScore(scoreId)
mockAPI.scores.getStats(range)

// Recap
mockAPI.recap.getSummary()
mockAPI.recap.getLiveScores()
mockAPI.recap.getDayRecap(dayNum)

// Public
mockAPI.public.getPublicScoreboard(token)
mockAPI.public.verifyToken(token)
```

## 💾 Data Persistence

Mock data persists during the session:
- Creating an event adds it to array
- Deleting removes it
- Scores update team totals
- Changes visible across all components

Refresh page = data resets to defaults

## 🧪 Testing Checklist

- [ ] useAuth returns user (no login needed)
- [ ] Creating events works
- [ ] Adding teams works
- [ ] Recording scores works
- [ ] Team totals update
- [ ] Loading states show
- [ ] No network errors
- [ ] Banner shows "Backend Disabled"

## 🚨 Important

- ⚠️ Data resets on page refresh
- ⚠️ All operations succeed (no validation)
- ⚠️ Always authenticated
- ⚠️ No real permissions enforcement
- ✅ Perfect for UI testing only

---

For more details, see:
- `MOCK_LAYER_GUIDE.md` - Full documentation
- `MOCK_AUTH_REFERENCE.ts` - Auth examples
- `lib/mockService.ts` - Service implementations
