# Role Capabilities Update

## Overview
Updated the role system to give admins full scoring capabilities while keeping scorers limited to their designated functions.

## Role Definitions

### Admin Role
**Full System Access** - Admin token holders can:
- ✅ Add and manage teams (admin-only)
- ✅ Add scores via single entry form
- ✅ Add scores via quick-add buttons
- ✅ Submit bulk scores for all teams
- ✅ View and edit score history
- ✅ Access all event links (scorer, public, recap)
- ✅ View real-time team totals
- ✅ Manage event settings

**New Capabilities Added:**
- Score entry form (same interface as scorer)
- Quick-add point buttons for all teams
- Bulk scoring interface
- Direct scoring without needing separate scorer link

### Scorer Role
**Limited to Scoring** - Scorer token holders can:
- ✅ Add scores via single entry form
- ✅ Add scores via quick-add buttons
- ✅ Submit bulk scores for all teams
- ✅ View and edit score history
- ✅ View team list and current totals
- ❌ Cannot add or manage teams
- ❌ Cannot access admin panel
- ❌ Cannot change event settings

## Interface Changes

### Admin Page ([app/admin/[token]/page.tsx](app/admin/[token]/page.tsx))

**Header Section:**
- Quick links now include 4 cards: Scorer, History, Public, Recap
- Added "Score History" link (indigo border)

**New Scoring Section** (appears after quick links when teams exist):

1. **Single Score Entry Form**
   - Team dropdown with current points
   - Points input (supports negative values)
   - Optional reason/game name field
   - Submit button with gradient styling

2. **Quick Add Points**
   - One row per team showing color badge and current total
   - 8 quick-add buttons: -25, -10, -5, -1, +1, +5, +10, +25
   - Red buttons for negative, blue for positive
   - Instant feedback on click

3. **Bulk Score Entry**
   - Purple/pink gradient card
   - Reason/game name field at top
   - Grid layout: team name, input field, current total
   - Validates and skips zero entries
   - Success/error messages

**Team Management Section:**
- Amber/orange section header marking admin-only area
- "Team Management" title with description
- Add team form (unchanged)
- Team list display (unchanged)

**Updated Flow:**
1. Admin adds teams (admin-only)
2. Admin can score directly OR share scorer link
3. Updated callout: "You can score directly here or share the scorer link"

### Scorer Page
**No Changes** - Scorer interface remains the same:
- Score entry form
- Quick-add buttons
- Bulk entry form
- History link in header

## Technical Implementation

### State Management
Added to admin page:
```typescript
const [selectedTeamId, setSelectedTeamId] = useState('');
const [points, setPoints] = useState('');
const [category, setCategory] = useState('');
const [submitting, setSubmitting] = useState(false);
const [successMessage, setSuccessMessage] = useState('');
```

### Handler Functions
Copied from scorer page:
- `handleSubmitScore()` - Single score submission
- `quickAddPoints()` - Quick-add button handler
- `BulkAddForm` component with state and submit logic

### API Integration
Admin now uses `X-ADMIN-TOKEN` header for all scoring endpoints:
- `POST /api/events/[event_id]/scores` - Single score
- `POST /api/scores/bulk` - Bulk scores

All scoring APIs already support both admin and scorer tokens, so no backend changes were needed.

## User Experience

### Admin Workflow
**Before:**
1. Add teams in admin panel
2. Open separate scorer link in new tab
3. Switch between tabs to manage teams and add scores

**After:**
1. Add teams in admin panel
2. Scroll down to scoring section
3. Add scores directly without leaving page
4. Team management and scoring in one interface

### Scorer Workflow
**Unchanged** - Scorers still use dedicated `/score/{token}` page with same features.

## Security

- Admin token verified via `X-ADMIN-TOKEN` header
- Scorer token verified via `X-SCORER-TOKEN` header
- Both tokens have equal privileges for scoring operations
- Only admin tokens can access team management
- Token validation happens at API layer (no client-side bypass)

## UI/UX Enhancements

- **Visual Separation**: Amber/orange banner marks admin-only team management
- **Unified Interface**: Admins don't need to switch pages/tabs
- **Progressive Disclosure**: Scoring section only appears after teams are added
- **Consistent Styling**: Same gradient backgrounds and animations throughout
- **Success Feedback**: Green banner shows confirmation after score submission
- **Updated Callout**: Changed "Ready to start" message to reflect dual options

## Build Impact

- Admin page bundle: **2.52 kB → 4.08 kB** (+1.56 kB)
- Added ~60 lines of scoring logic
- Added BulkAddForm component (~100 lines)
- No impact on scorer page (unchanged)
- Total app size remains optimized

## Compatibility

- ✅ All existing admin tokens work with new scoring features
- ✅ All existing scorer tokens work unchanged
- ✅ Public tokens remain read-only (no changes)
- ✅ Backward compatible with all API endpoints
- ✅ No database schema changes required

## Testing Checklist

- [x] Build compiles successfully
- [ ] Admin can add teams
- [ ] Admin can submit single score
- [ ] Admin can use quick-add buttons
- [ ] Admin can submit bulk scores
- [ ] Scorer interface still works independently
- [ ] Score history accessible from both admin and scorer
- [ ] Team totals update after admin scores
- [ ] Success messages display correctly
- [ ] Negative points work in admin interface
- [ ] Validation errors show properly

## Future Enhancements

- [ ] Toggle between "Admin Mode" and "Scorer Mode" views
- [ ] Keyboard shortcuts for quick-add (1-8 for amounts)
- [ ] Undo last score action
- [ ] Score approval workflow (scorer submits, admin approves)
- [ ] Role permissions editor (custom role creation)
- [ ] Audit log showing who scored what (admin vs scorer attribution)
