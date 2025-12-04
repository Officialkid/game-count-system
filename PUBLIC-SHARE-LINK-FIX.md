# Public Share Link Fix - December 4, 2025

## 🔍 Issue Identified

The public share link system was broken because:

1. **Wrong URL Being Used**: The event detail page (`/event/[eventId]`) was linking to `/scoreboard/[eventId]` instead of `/scoreboard/[shareToken]`
2. **Route Confusion**: Users were copying/visiting event IDs instead of share tokens
3. **Public Events Page**: Was redirecting to wrong path `/public/[token]` instead of `/scoreboard/[token]`

### Evidence from Logs
```
GET /api/public/verify/f3f15567-0349-461e-ae59-04992a95d3bb 404
```
This shows the user was trying to use event ID `f3f15567-0349-461e-ae59-04992a95d3bb` when the actual share token is `PsYLaVxC2en-NhVw`.

## ✅ Fixes Applied

### 1. Event Detail Page (`app/event/[eventId]/page.tsx`)
- **Added** `shareToken` state to track the actual share token
- **Modified** `loadEvent()` to fetch share link data from `/api/events/[eventId]/share-link`
- **Fixed** "View Public Scoreboard" button to use `shareToken` instead of `eventId`
- **Added** disabled state when no share link exists (prompts user to create one in Settings)

### 2. Public Events List (`app/public/page.tsx`)
- **Fixed** `viewEvent()` function to navigate to `/scoreboard/[token]` instead of `/public/[token]`

## 🎯 How It Works Now

### Share Link Creation Flow
1. User creates an event
2. System **auto-creates** a share link on first GET to `/api/events/[eventId]/share-link`
3. Share token is a short, URL-safe string (e.g., `PsYLaVxC2en-NhVw`)
4. Link format: `https://yourdomain.com/scoreboard/PsYLaVxC2en-NhVw`

### Share Link Properties
- **Never expires** (unless manually deleted by owner)
- **Unique per event** (each event gets its own token)
- **Persistent** (survives across multiple days)
- **No authentication required** to view

### User Actions
1. **Create**: Automatically created when accessing Settings tab or clicking "Create Share Link"
2. **Copy**: Click "Copy" button in Settings tab to copy full URL to clipboard
3. **Verify**: Click "Verify" button to test link in new tab
4. **Regenerate**: Generate a new token (invalidates old one)
5. **Delete**: Remove public access completely

## 📋 Database Schema

```sql
CREATE TABLE share_links (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Note**: No `expires_at` column means links **never expire** automatically.

## 🔗 Example Mapping

| Event ID | Share Token | Public URL |
|----------|-------------|------------|
| `6d1fa04d-bf15-4e41-89e7-fccc96756377` | `LTXKa6tvDKecyND2` | `/scoreboard/LTXKa6tvDKecyND2` |
| `f3f15567-0349-461e-ae59-04992a95d3bb` | `PsYLaVxC2en-NhVw` | `/scoreboard/PsYLaVxC2en-NhVw` |
| `29d8fcb4-df2e-44c8-93b3-8a0263dc1917` | `gaKLHnqhKpu2S4qE` | `/scoreboard/gaKLHnqhKpu2S4qE` |
| `f9ce5d4f-89bc-41d9-b491-9dd2f1d1a8c4` | `yBNS4Rx9JT_j-neM` | `/scoreboard/yBNS4Rx9JT_j-neM` |

## 🌐 Public Events Discovery

Users can now visit `/public` to see **all active events** with public share links:
- Shows event cards with name, logo, theme color
- Displays team count and creation date
- "Live" badge indicates active events
- Click any card to open that event's public scoreboard

## ✨ Multiple Events Per Day

Each event gets its own unique share token, so you can have:
- ✅ Unlimited events on the same day
- ✅ Each with its own public link
- ✅ All accessible via `/public` page
- ✅ No conflicts or overwrites

## 🧪 Testing Steps

1. **Create New Event**
   - Go to Dashboard → Create Event
   - Fill in details and save

2. **Get Share Link**
   - Open event → Settings tab
   - Share link auto-created on page load
   - Copy the link (e.g., `http://localhost:3002/scoreboard/ABC123xyz`)

3. **Test Public Access**
   - Open link in incognito/private window (no auth needed)
   - Verify scoreboard loads with event name, teams, scores
   - Check "Live" indicator appears when SSE connects

4. **Test Public Events List**
   - Visit `/public`
   - See all your events listed
   - Click any event card to open scoreboard

## 🚨 Important Notes

- **Share tokens are permanent** (until manually regenerated or deleted)
- **Event IDs and share tokens are different** - never mix them up
- **Public access requires no authentication** - anyone with the link can view
- **Regenerating a token invalidates the old link** - update any shared links
- **Deleting a share link makes the event private** - creates 404 for visitors

## 🎉 What's Fixed

✅ Public links now work correctly after copying  
✅ No more "Invalid or expired link" errors  
✅ Each event has unique, permanent public link  
✅ Multiple events per day fully supported  
✅ Public events list shows all active events  
✅ Share tokens never expire unless deleted  
