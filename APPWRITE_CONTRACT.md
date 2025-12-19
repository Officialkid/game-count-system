# Appwrite Integration Contract (Frontend Blueprint)

## Project Details

**Appwrite Project ID:** `694164500028df77ada9`  
**Appwrite Endpoint:** `https://fra.cloud.appwrite.io/v1` (Frankfurt region)  
**Environment:** Appwrite Cloud  
**SDK Wrapper:** `lib/appwrite.ts`

## Goals
- Frontend stays mock-driven; zero backend calls today.
- Clear handoff for Appwrite phase: what to implement, inputs/outputs, realtime expectations.
- Do **not** integrate Appwrite now; this is the contract only.

## Services Mapping

### Auth
- **getCurrentUser**
  - Inputs: none
  - Outputs: `{ success, data: user }`
  - Realtime: none
- **authenticate**
  - Inputs: `email`, `password`
  - Outputs: `{ success, data: { user, token } }`
  - Realtime: none
- **register**
  - Inputs: `name`, `email`, `password`
  - Outputs: `{ success, data: { user, token } }`
  - Realtime: none
- **logout**
  - Inputs: none
  - Outputs: `{ success }`
  - Realtime: none

### Events
- **listEvents**
  - Inputs: none (use authenticated user)
  - Outputs: `{ success, data: { events } }`
  - Realtime: subscribe to events collection per user
- **getEvent**
  - Inputs: `eventId`
  - Outputs: `{ success, data: event }`
  - Realtime: optional document subscription
- **createEvent**
  - Inputs: `eventData`
  - Outputs: `{ success, data: { event } }`
  - Realtime: broadcast new event
- **updateEvent**
  - Inputs: `eventId`, `updates`
  - Outputs: `{ success, data: { event } }`
  - Realtime: broadcast update
- **deleteEvent**
  - Inputs: `eventId`
  - Outputs: `{ success }`
  - Realtime: broadcast deletion
- **duplicateEvent**
  - Inputs: `eventId`
  - Outputs: `{ success, data: { event } }`
  - Realtime: broadcast new event

### Teams
- **listTeams**
  - Inputs: `eventId`
  - Outputs: `{ success, data: { teams } }`
  - Realtime: subscribe to teams per event
- **addTeam**
  - Inputs: `eventId`, `teamName`, `avatarUrl?`
  - Outputs: `{ success, data: { team } }`
  - Realtime: broadcast creation
- **checkTeamName**
  - Inputs: `eventId`, `teamName`
  - Outputs: `{ success, data: { available, suggestions } }`
  - Realtime: none
- **deleteTeam**
  - Inputs: `teamId`
  - Outputs: `{ success }`
  - Realtime: broadcast deletion

### Scores
- **listScores**
  - Inputs: `eventId`
  - Outputs: `{ success, data: { scores } }`
  - Realtime: subscribe to scores per event
- **addScore**
  - Inputs: `eventId`, `teamId`, `gameNumber`, `points`
  - Outputs: `{ success, data: { score } }`
  - Realtime: broadcast add + update team totals
- **deleteScore**
  - Inputs: `scoreId`
  - Outputs: `{ success }`
  - Realtime: broadcast delete + update team totals
- **getStats**
  - Inputs: `range`
  - Outputs: `{ success, data: stats }
  - Realtime: optional subscription or polling

### Recap
- **getSummary**
  - Inputs: none
  - Outputs: `{ success, data: recap }
  - Realtime: optional aggregates
- **getLiveScores**
  - Inputs: none
  - Outputs: `{ success, data: { scores, timestamp } }
  - Realtime: yes (scores channel)
- **getDayRecap**
  - Inputs: `dayNumber`
  - Outputs: `{ success, data: { day, recap } }
  - Realtime: none

### Public
- **getPublicScoreboard**
  - Inputs: `token`
  - Outputs: `{ success, data: { event, teams, scores, token } }
  - Realtime: yes (public scoreboard channel)
- **verifyToken**
  - Inputs: `token`
  - Outputs: `{ success, data: { valid, eventId } }
  - Realtime: none

## Realtime Summary
- Subscribe: events, teams, scores, public scoreboard.
- Optional: recap aggregates, stats.
- Not needed: auth flows.

## Non-goals (explicit)
- No Appwrite SDK wiring now.
- No DB/JWT reintroduction.
- No backend performance tuning now.

## Acceptance Fit
- Frontend remains zero-backend (mock-only) while documenting exact Appwrite expectations for phase 2.
