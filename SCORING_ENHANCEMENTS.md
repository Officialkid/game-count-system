# Enhanced Scoring System

## Overview
The scoring system now supports **bulk scoring**, **negative points** for penalties/deductions, and **optional reasons** for each score entry.

## Features Implemented

### 1. Bulk Scoring Interface ✅
**Location**: Scorer page (`/score/[token]`)

- **All-teams-at-once form**: Enter points for every team in one submission
- **Visual layout**: 
  - Gradient purple/pink card with prominent header
  - Each team shows: color indicator, name, input field, current total
  - Clean grid layout with hover effects
- **Smart validation**: Only submits non-zero values
- **Transaction safety**: All scores inserted atomically via `/api/scores/bulk`

**How it works**:
1. Scorer enters a reason/game name (e.g., "Round 1", "Penalty Round")
2. For each team, enter points (positive or negative)
3. Click "Submit Bulk Scores" — all entries saved together
4. Teams with 0 or empty values are skipped automatically

### 2. Negative Points Support ✅
**Validation**: Removed `min(0)` constraint from `CreateScoreSchema`

**Usage**:
- **Single score form**: Enter negative values directly (e.g., -10)
- **Quick add buttons**: Now includes -25, -10, -5, -1 (red styling)
- **Bulk form**: Any team can have negative points for penalties

**Examples**:
- Team lost 10 points for a rule violation → Enter `-10`
- Penalty round where Team A loses 5 pts → Enter `-5`
- Bonus deduction → Use negative value with reason "Late Submission"

### 3. Optional Reason Field ✅
**Field name**: "Reason / Game Name"

**Available in**:
- **Single score form**: Per-score optional field with placeholder examples
- **Bulk form**: One reason applies to all teams in that submission
- **Quick add**: Uses default "Quick Add" category

**Use cases**:
- Track which game/round the points came from
- Document penalty reasons ("Delay Penalty", "Rule Violation")
- Note bonus rounds ("Bonus Challenge", "Tie-breaker")

## API Endpoints

### POST `/api/scores/add`
Add a single score with optional reason:
```json
{
  "event_id": "uuid",
  "team_id": "uuid",
  "points": -10,
  "category": "Penalty - Late Start",
  "day_id": "uuid" // optional
}
```

### POST `/api/scores/bulk`
Add scores for multiple teams at once:
```json
{
  "event_id": "uuid",
  "category": "Round 1",
  "items": [
    { "team_id": "uuid1", "points": 50 },
    { "team_id": "uuid2", "points": -10 },
    { "team_id": "uuid3", "points": 30 }
  ],
  "day_id": "uuid" // optional
}
```

**Authentication**: Requires scorer or admin token via `Authorization: Bearer {token}` header

## UI/UX Improvements

### Scorer Page Layout
1. **Header**: Gradient card with quick link to scoreboard
2. **Single Score Form**: Clean, modern inputs with negative point support
3. **Quick Add**: Expanded to include negative buttons (-25 to +25)
4. **Bulk Entry**: Prominent purple gradient card with all-teams grid

### Visual Enhancements
- Gradient backgrounds for distinction
- Color-coded buttons (red for negative, blue for positive)
- Smooth hover animations and scale effects
- Team color indicators in bulk form
- Success/error messages with proper styling

## Validation Rules
- **Points**: Any integer (positive or negative)
- **Reason/Category**: Optional string, max 100 characters
- **Bulk entries**: At least one non-zero value required
- **Team ID**: Must be valid UUID from the event

## Database Schema
No changes required — existing `scores` table supports:
- `points` column: INTEGER (already allows negative values)
- `category` column: VARCHAR(100) for reason/game name

## Example Workflows

### Scenario 1: Recording a game with penalties
1. Use **bulk form**
2. Reason: "Game 1 - Soccer Match"
3. Enter points:
   - Team A: 50
   - Team B: 30
   - Team C: -10 (penalty)
4. Submit → All recorded with same reason

### Scenario 2: Quick penalty deduction
1. Find team in **Quick Add** section
2. Click `-10` button
3. Points deducted instantly with "Quick Add" reason

### Scenario 3: Individual score with context
1. Use **single score form**
2. Select team
3. Enter points: -5
4. Reason: "Delay Penalty - 5min late"
5. Submit

## Testing Checklist
- ✅ Single positive score
- ✅ Single negative score
- ✅ Bulk with mixed positive/negative
- ✅ Bulk with all zeros (should show validation message)
- ✅ Quick add negative buttons work
- ✅ Reason field appears in all forms
- ✅ Mobile responsiveness

## Future Enhancements
- History view showing all score entries with timestamps and reasons
- Ability to edit/delete score entries
- Export scores to PDF with reason breakdown
- Per-day scoring for camp mode with day selection

---

**Status**: ✅ Production Ready  
**Last Updated**: 2026-01-08
