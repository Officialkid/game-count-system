# Score History Feature

## Overview
The Score History system allows admins and scorers to view, edit, and correct all score entries in chronological order.

## Access Points

### From Admin Page
1. Navigate to `/admin/{admin_token}`
2. Click "Score History" link in the quick links section (indigo border card)
3. Or directly visit `/history/{admin_token}`

### From Scorer Page
1. Navigate to `/score/{scorer_token}`
2. Click "📜 Score History" button in the header
3. Or directly visit `/history/{scorer_token}`

## Features

### View History
- **Chronological Display**: All score entries sorted by newest first
- **Team Details**: Each entry shows:
  - Team name with color badge
  - Points (positive in green, negative in red)
  - Reason/Category (if provided)
  - Timestamp (created date, with "edited" indicator if modified)
  - Day information (for camp mode events)
- **Total Count**: Shows total number of entries

### Edit Scores
1. Click "Edit" button on any score entry
2. Inline form appears with:
   - Points field (supports negative values)
   - Reason/Category field (optional)
3. Click "Save Changes" to apply
4. Changes immediately reflect in team totals

**Validation:**
- Points must be an integer
- Score must exist and belong to the event
- Only admin or scorer tokens can edit

### Delete Scores
1. Click "Delete" button on any score entry
2. Confirmation appears: "Confirm" and "Cancel" buttons
3. Click "Confirm" to permanently remove the entry
4. Team totals automatically recalculate

**Safety:**
- Two-click confirmation required
- Cannot be undone
- Updates totals immediately

## API Endpoints

### Get History
```http
GET /api/events/{event_id}/history
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scores": [
      {
        "id": "uuid",
        "event_id": "uuid",
        "team_id": "uuid",
        "points": 50,
        "category": "Round 1",
        "created_at": "2026-01-08T10:30:00Z",
        "updated_at": "2026-01-08T10:30:00Z",
        "team_name": "Red Dragons",
        "team_color": "#FF0000",
        "day_number": 1,
        "day_label": "Day One"
      }
    ],
    "total_entries": 42
  }
}
```

### Update Score
```http
PATCH /api/scores/update
Authorization: Bearer {token}
Content-Type: application/json

{
  "score_id": "uuid",
  "points": 75,
  "category": "Round 1 (Corrected)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": {
      "id": "uuid",
      "points": 75,
      "category": "Round 1 (Corrected)",
      "updated_at": "2026-01-08T11:00:00Z"
    }
  }
}
```

### Delete Score
```http
DELETE /api/scores/update?score_id={uuid}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Score entry deleted successfully"
}
```

## Security

- **Token Verification**: All operations verify token ownership
- **Event Matching**: Scores can only be edited/deleted by tokens belonging to their event
- **Admin + Scorer Access**: Both admin and scorer tokens have full edit/delete privileges
- **Public Tokens**: Cannot access history (read-only scoreboard only)

## UI Design

- **Gradient Background**: Gray/purple/amber gradient for consistency
- **Rounded Cards**: Each score entry in a card with hover shadow
- **Color-Coded Points**: 
  - Green badge for positive points
  - Red badge for negative points
- **Inline Editing**: Form appears within the card, no popup
- **Responsive**: Works on mobile with touch-friendly buttons

## Database Impact

### Automatic Updates
When a score is edited or deleted:
1. The `scores` table is updated/row removed
2. Team totals are recalculated on next fetch using:
   ```sql
   SELECT t.*, COALESCE(SUM(s.points), 0) as total_points
   FROM teams t
   LEFT JOIN scores s ON s.team_id = t.id
   WHERE t.event_id = $1
   GROUP BY t.id
   ```
3. No cached totals exist - always computed fresh
4. Changes appear immediately on scoreboard

### Audit Trail
- `created_at`: Original entry timestamp (never changes)
- `updated_at`: Last modification timestamp (updates on PATCH)
- History shows "(edited)" indicator when `updated_at` ≠ `created_at`

## Use Cases

### Correction Workflow
1. Scorer realizes they entered wrong points (50 instead of 55)
2. Opens Score History from scorer page
3. Finds the entry, clicks "Edit"
4. Changes 50 to 55, clicks "Save Changes"
5. Public scoreboard immediately reflects new total

### Penalty Removal
1. Admin decides to remove an unfair penalty (-10 points)
2. Opens Score History from admin page
3. Finds the negative entry, clicks "Delete"
4. Clicks "Confirm"
5. Team's total increases by 10 points

### Duplicate Entry Cleanup
1. Scorer accidentally added same score twice
2. Opens Score History
3. Identifies duplicate by timestamp
4. Deletes the duplicate entry
5. Total corrects automatically

## Testing Checklist

- [ ] History loads with correct entries
- [ ] Entries sorted newest first
- [ ] Team colors display correctly
- [ ] Positive/negative points color-coded
- [ ] Edit form appears inline
- [ ] Edit saves and updates totals
- [ ] Edit shows validation errors
- [ ] Delete requires confirmation
- [ ] Delete removes entry and updates totals
- [ ] "Edited" indicator appears after update
- [ ] Unauthorized tokens blocked (403)
- [ ] Invalid score IDs return 404
- [ ] Mobile responsive layout works
- [ ] Back button returns to previous page

## Future Enhancements

- [ ] Filter by team
- [ ] Filter by date range
- [ ] Filter by day (camp mode)
- [ ] Export history to CSV
- [ ] Batch operations (select multiple, delete all)
- [ ] Undo last action
- [ ] Search by reason/category
- [ ] Sort by team/points/date
- [ ] Pagination for large events (>100 entries)
