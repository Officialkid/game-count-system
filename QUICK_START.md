# Quick Start Guide

## Setup Instructions

### 1. Database Migration (Templates)
Run the templates migration to add template functionality:

```bash
node scripts/run-migration.js migrations/2025-12-04-templates.sql
```

If you get SSL errors, the migration will need to be run manually through your database provider's console.

### 2. Start Development Server
```bash
npm run dev
```

Access at: http://localhost:3000

## New Features Guide

### 🎨 Dark Mode
- **Location:** Toggle button in Navbar (moon/sun icon)
- **Behavior:** Persists across sessions
- **Affects:** All pages and components

### 🔊 Sound & Confetti Preferences
- **Location:** Gear icon (⚙️) in Navbar → Preferences menu
- **Sound Effects:**
  - Success sound on score add
  - Error sound on failures
  - Toggle on/off
- **Confetti:**
  - Triggers on scores ≥ 50 points
  - Toggle on/off

### 💾 Templates System
**Save Template:**
1. Go to event Settings tab
2. Click "Save as Template"
3. Enter template name and default event name
4. Template saves current event configuration

**Use Template:**
1. From Dashboard, click "Use Template" button
2. Select template from list
3. Enter event name
4. Event created with template settings

### 🎯 Quick Score Entry
**Option 1: From Event Page**
- Click "Quick Add Score" button in header
- Select team, enter game info and points
- Use quick-add buttons (+10, +20, +50, etc.)

**Option 2: From Scoring Tab**
- Same interface as modal
- Integrated into event page

### 📊 Public Scoreboard Features
- **Fullscreen:** Click fullscreen button in header
- **Auto-refresh:** Updates every 7 seconds
- **Theme:** Displays event theme color and logo
- **Ranking:** Teams sorted by score with medals (🥇🥈🥉)

### ✏️ Edit Event
- Click "Edit Event" button on event page header
- Modify: Name, theme color, logo URL, scoring settings, display mode
- Changes save immediately

### 🗑️ Delete Event
- Click "Delete" button on event card (Dashboard)
- Confirm deletion
- Cascades: Removes teams, scores, and share links

## Feature Matrix

| Feature | Location | Status |
|---------|----------|--------|
| Dark Mode | Navbar toggle | ✅ Complete |
| Sound Effects | Preferences menu | ✅ Complete |
| Confetti | Preferences menu | ✅ Complete |
| Templates | Settings tab + Dashboard | ✅ Complete |
| Quick Score | Event page header | ✅ Complete |
| Edit Event | Event page header | ✅ Complete |
| Delete Event | Dashboard cards | ✅ Complete |
| Fullscreen | Public scoreboard | ✅ Complete |
| Auto-refresh | Public scoreboard | ✅ Complete |
| Error Handling | Global + Components | ✅ Complete |

## Keyboard Shortcuts
- **Escape:** Close modals
- **F11:** Browser fullscreen (alternative to button)

## Troubleshooting

### Sound Not Playing
1. Check Preferences menu (gear icon)
2. Ensure "Sound Effects" is enabled
3. Check browser sound settings

### Confetti Not Showing
1. Check Preferences menu
2. Ensure "Confetti" is enabled
3. Score must be ≥ 50 points

### Dark Mode Not Persisting
- Clear browser cache
- Check localStorage for 'dark_mode' key

### Template Migration Failed
Run SQL directly in your database console:
```sql
-- See migrations/2025-12-04-templates.sql
```

## API Endpoints Reference

### Templates
- `GET /api/templates` - List user's templates
- `POST /api/templates` - Create template
- `DELETE /api/templates/[id]` - Delete template
- `POST /api/events/create-from-template` - Create event from template

### Events
- `GET /api/events/[eventId]` - Fetch event
- `PATCH /api/events/[eventId]` - Update event
- `DELETE /api/events/[eventId]` - Delete event

### Error Handling
All API calls include:
- Automatic retry (3 attempts)
- Exponential backoff (1s → 2s → 4s)
- Proper error messages

## Browser Compatibility
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Web Audio API required for sound
- ⚠️ Fullscreen API for fullscreen mode

## Production Checklist
- [ ] Run all tests (see IMPLEMENTATION_COMPLETE.md)
- [ ] Verify database migrations applied
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Configure environment variables
- [ ] Set up error logging
- [ ] Enable SSL in production

## Support
For issues or questions, refer to:
- `IMPLEMENTATION_COMPLETE.md` - Full feature documentation
- `README.md` - Original project documentation
