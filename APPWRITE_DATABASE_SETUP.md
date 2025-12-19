# Appwrite Database Setup Guide

## Overview

This guide will help you set up the required database collections and storage buckets in your Appwrite project.

**Project ID:** `694164500028df77ada9`  
**Endpoint:** `https://fra.cloud.appwrite.io/v1`

---

## Step 1: Create Database

1. Log into your Appwrite Console: https://cloud.appwrite.io/console/project-694164500028df77ada9
2. Navigate to **Databases** in the left sidebar
3. Click **Create Database**
4. Set Database ID: `main`
5. Set Database Name: `Main Database`
6. Click **Create**

---

## Step 2: Create Collections

For each collection below, follow these steps:

1. Click **Add Collection** in your `main` database
2. Enter the Collection ID and Name
3. Click **Create**
4. Add the attributes listed
5. Set up permissions (see Permissions section)

### Collection 1: Users Extended Data
- **Collection ID:** `users`
- **Collection Name:** Users Extended Data
- **Attributes:**
  - `name` (String, size: 255, required)
  - `email` (String, size: 255, required)
  - `role` (String, size: 50, default: "user")
  - `created_at` (DateTime, required, default: now)
- **Indexes:**
  - `email_idx` (unique, ASC, `email`)

### Collection 2: Events
- **Collection ID:** `events`
- **Collection Name:** Events
- **Attributes:**
  - `user_id` (String, size: 255, required)
  - `event_name` (String, size: 255, required)
  - `theme_color` (String, size: 7, default: "#7c3aed")
  - `logo_url` (String, size: 500, optional)
  - `allow_negative` (Boolean, default: false)
  - `display_mode` (String, size: 50, default: "cumulative")
  - `num_teams` (Integer, default: 2)
  - `status` (String, size: 50, default: "active")
  - `created_at` (DateTime, required, default: now)
  - `updated_at` (DateTime, required, default: now)
- **Indexes:**
  - `user_id_idx` (ASC, `user_id`)
  - `status_idx` (ASC, `status`)
  - `created_idx` (DESC, `created_at`)

### Collection 3: Teams
- **Collection ID:** `teams`
- **Collection Name:** Teams
- **Attributes:**
  - `event_id` (String, size: 255, required)
  - `team_name` (String, size: 255, required)
  - `avatar_url` (String, size: 500, optional)
  - `total_points` (Integer, default: 0)
  - `created_at` (DateTime, required, default: now)
- **Indexes:**
  - `event_id_idx` (ASC, `event_id`)
  - `points_idx` (DESC, `total_points`)

### Collection 4: Scores
- **Collection ID:** `scores`
- **Collection Name:** Scores
- **Attributes:**
  - `event_id` (String, size: 255, required)
  - `team_id` (String, size: 255, required)
  - `game_number` (Integer, required)
  - `points` (Integer, required)
  - `created_at` (DateTime, required, default: now)
- **Indexes:**
  - `event_id_idx` (ASC, `event_id`)
  - `team_id_idx` (ASC, `team_id`)
  - `game_idx` (ASC, `game_number`)

### Collection 5: Share Links
- **Collection ID:** `share_links`
- **Collection Name:** Share Links
- **Attributes:**
  - `event_id` (String, size: 255, required)
  - `token` (String, size: 255, required)
  - `is_active` (Boolean, default: true)
  - `created_at` (DateTime, required, default: now)
- **Indexes:**
  - `token_idx` (unique, ASC, `token`)
  - `event_id_idx` (ASC, `event_id`)

### Collection 6: Event Admins
- **Collection ID:** `event_admins`
- **Collection Name:** Event Admins
- **Attributes:**
  - `event_id` (String, size: 255, required)
  - `user_id` (String, size: 255, required)
  - `role` (String, size: 50, default: "editor")
  - `created_at` (DateTime, required, default: now)
- **Indexes:**
  - `event_id_idx` (ASC, `event_id`)
  - `user_id_idx` (ASC, `user_id`)

---

## Step 3: Set Up Permissions

For each collection, configure these permissions:

### Events, Teams, Scores, Share Links (User-owned data)

### Public Share Links (Public scoreboards)

**To set permissions:**
1. Go to collection Settings → Permissions
2. Add role: `Users` (authenticated users)
3. Set CRUD permissions as above


### Permissions Quick Presets (Copy/Paste Guidance)

For each collection, use these presets in the Appwrite Console → Collection → Settings → Permissions:

1) Events (user-owned)
- Create: Users
- Read: Users (creator only) — use document-level permissions on create: `user:{USER_ID}`
- Update: Users (creator only) — document-level permissions: `user:{USER_ID}`
- Delete: Users (creator only) — document-level permissions: `user:{USER_ID}`

2) Teams (user-owned per event)
- Create: Users
- Read: Users (creator only) — document-level `user:{USER_ID}`
- Update: Users (creator only) — document-level `user:{USER_ID}`
- Delete: Users (creator only) — document-level `user:{USER_ID}`

3) Scores (user-owned per event)
- Create: Users
- Read: Users (creator only) — document-level `user:{USER_ID}`
- Update: Users (creator only) — document-level `user:{USER_ID}`
- Delete: Users (creator only) — document-level `user:{USER_ID}`

4) Share Links (public read)
- Create: Users
- Read: Any (toggle Public Read ON)
- Update: Users (creator only) — document-level `user:{USER_ID}`
- Delete: Users (creator only) — document-level `user:{USER_ID}`

5) Event Admins (user-owned per event)
- Create: Users
- Read: Users (creator only) — document-level `user:{USER_ID}`
- Update: Users (creator only) — document-level `user:{USER_ID}`
- Delete: Users (creator only) — document-level `user:{USER_ID}`

Notes:
- Document-level permissions are set at creation time via the SDK (when creating a document, pass `permissions` including the creator `user:{USER_ID}`).
- If you prefer role-based sharing later, you can add additional read permissions for other users (`user:{OTHER_ID}`) or teams.
- For early development, keeping ownership to the creator simplifies access.

## Step 4: Create Storage Buckets

1. Navigate to **Storage** in the left sidebar
2. Click **Add Bucket**

### Bucket 1: Avatars
- **Bucket ID:** `avatars`
- **Bucket Name:** Team Avatars
- **Max File Size:** 2MB (2097152 bytes)
- **Allowed Extensions:** jpg, jpeg, png, gif, webp
- **Permissions:**
  - Create: Any authenticated user
  - Read: Anyone (public)
  - Update: Creator only
  - Delete: Creator only

### Bucket 2: Logos
- **Bucket ID:** `logos`
- **Bucket Name:** Event Logos
- **Max File Size:** 5MB (5242880 bytes)
- **Allowed Extensions:** jpg, jpeg, png, svg, webp
- **Permissions:**
  - Create: Any authenticated user
  - Read: Anyone (public)
  - Update: Creator only
  - Delete: Creator only

---

## Step 5: Update lib/appwrite.ts

After creating collections and buckets, update the IDs in `lib/appwrite.ts`:

```typescript
export const DATABASE_ID = 'main';

export const COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'events',
  TEAMS: 'teams',
  SCORES: 'scores',
  SHARE_LINKS: 'share_links',
  ADMINS: 'event_admins',
};

export const BUCKETS = {
  AVATARS: 'avatars',
  LOGOS: 'logos',
};
```

---

## Step 6: Enable Realtime (Optional)

For live scoreboard updates:

1. Go to **Settings** → **Realtime**
2. Enable Realtime for your project
3. Collections will automatically support realtime subscriptions

---

## Verification Checklist

- [ ] Database `main` created
- [ ] 6 collections created with all attributes
- [ ] Indexes set up for each collection
- [ ] Permissions configured
- [ ] 2 storage buckets created
- [ ] Bucket file size limits set
- [ ] Bucket permissions configured
- [ ] `lib/appwrite.ts` updated with correct IDs
- [ ] Realtime enabled (optional)

---

## Next Steps

Once database setup is complete:

1. ✅ Test authentication flows (Phase B)
2. ✅ Migrate mock services to Appwrite
3. ✅ Set up realtime subscriptions
4. ✅ Test CRUD operations

---

## Troubleshooting

**Issue:** Can't create collection attributes  
**Solution:** Make sure you clicked "Create" after entering Collection ID/Name

**Issue:** Permission errors when testing  
**Solution:** Check that you're authenticated and the collection has proper user permissions

**Issue:** File upload fails  
**Solution:** Verify bucket file size limits and allowed extensions match your needs

---

**Reference:** See `APPWRITE_CONTRACT.md` for detailed API contract and migration guide.
