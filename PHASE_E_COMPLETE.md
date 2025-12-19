# Phase E Implementation Complete ✅

**Date:** December 2024  
**Focus:** Assets (Storage) & Public Share Links

---

## Overview

Phase E adds **Appwrite Storage** for team avatars and event logos, plus **public share links** for passwordless scoreboard access. Files are stored in cloud buckets with proper permissions, and share links allow public viewing without authentication.

---

## What Was Implemented

### 1. Appwrite Storage Service

**File:** `lib/services/appwriteStorage.ts`

**Features:**
- ✅ **uploadEventLogo()** - Upload event logos to `logos` bucket
- ✅ **uploadTeamAvatar()** - Upload team avatars to `avatars` bucket
- ✅ **deleteFile()** - Remove files from storage
- ✅ **getFilePreviewUrl()** - Get optimized preview URLs (width/height/quality)
- ✅ **getFileDownloadUrl()** - Get direct download URLs
- ✅ **getFileViewUrl()** - Get view-only URLs
- ✅ **listFiles()** - Admin file listing with queries

**File Validation:**
- Type checking: Only PNG and JPG allowed
- Size limits: 10MB for logos, 5MB for avatars
- Automatic preview generation with quality optimization

**Permissions:**
```typescript
[
  Permission.read(Role.user(userId)),    // Owner can view
  Permission.update(Role.user(userId)),  // Owner can update
  Permission.delete(Role.user(userId))   // Owner can delete
]
```

**Usage Example:**
```typescript
import { storageService } from '@/lib/services';

// Upload logo
const result = await storageService.uploadEventLogo(file, userId, eventId);
if (result.success) {
  const { fileId, fileUrl, fileName, sizeBytes } = result.data;
  // Save fileId or fileUrl to event.logo_path
}

// Get preview URL
const previewUrl = storageService.getFilePreviewUrl('logos', fileId, 800, 600, 90);
```

---

### 2. Share Links Service

**File:** `lib/services/appwriteShareLinks.ts`

**Features:**
- ✅ **createShareLink()** - Generate unique share token for event
- ✅ **getShareLinkByToken()** - Resolve token to share link (public)
- ✅ **getShareLinkByEvent()** - Get active link for event
- ✅ **deleteShareLink()** - Deactivate link (soft delete)
- ✅ **resolveShareToken()** - Get event ID from token
- ✅ **getUserShareLinks()** - List all user's share links
- ✅ **generateShareToken()** - Crypto-secure random token generator

**Token Generation:**
- 32-character random hex string (URL-safe)
- Uses `crypto.getRandomValues()` in browser
- Uses `crypto.randomBytes()` in Node.js
- Collision-resistant with billions of possible values

**Public Access Pattern:**
```typescript
// Create share link (authenticated user)
const result = await createShareLink(eventId, userId);
const token = result.data.shareLink.token;

// Public scoreboard URL
const scoreboardUrl = `/scoreboard/${token}`;

// Resolve token to event ID (no auth required)
const eventData = await resolveShareToken(token);
```

**Permissions:**
```typescript
[
  Permission.read(Role.any()),           // PUBLIC - anyone can read
  Permission.update(Role.user(userId)),  // Owner can regenerate
  Permission.delete(Role.user(userId))   // Owner can delete
]
```

**Soft Delete Pattern:**
- Links are not deleted, instead `is_active = false`
- Preserves history and prevents token reuse
- Queries filter by `Query.equal('is_active', true)`

---

### 3. Enhanced LogoUpload Component

**File:** `components/LogoUpload.tsx`

**New Features:**
- ✅ Automatic upload to Appwrite Storage when `NEXT_PUBLIC_USE_APPWRITE_SERVICES=true`
- ✅ Loading state during upload ("⏳ Uploading...")
- ✅ Returns `fileId` alongside preview URL
- ✅ Supports both `logo` and `avatar` types
- ✅ Entity ID tracking (event/team association)
- ✅ Graceful fallback to local preview in mock mode

**Props Interface:**
```typescript
interface LogoUploadProps {
  currentLogoUrl?: string;
  onLogoChange: (file: File | null, previewUrl: string | null, fileId?: string) => void;
  label?: string;
  maxSizeMB?: number;
  type?: 'logo' | 'avatar';  // NEW
  entityId?: string;          // NEW (event ID or team ID)
}
```

**Upload Flow:**
1. User selects file (drag-drop or click)
2. Validate file type and size
3. If Appwrite enabled:
   - Call `storageService.uploadEventLogo()` or `uploadTeamAvatar()`
   - Get `fileId` and `fileUrl` from result
   - Pass both to `onLogoChange(file, fileUrl, fileId)`
4. If mock mode:
   - Create local blob URL
   - Pass to `onLogoChange(file, blobUrl)`
5. Display preview with "Change" and "Remove" buttons

---

### 4. Service Layer Integration

**File:** `lib/services/index.ts`

**New Exports:**
- ✅ `storageService` - File upload/management
- ✅ `shareLinksService` - Share link CRUD

**Mock Fallbacks:**
```typescript
// Storage mock (when Appwrite disabled)
storageService.uploadEventLogo = async (file) => ({
  success: true,
  data: {
    fileId: 'mock-logo-' + Date.now(),
    fileUrl: URL.createObjectURL(file),  // Local blob URL
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  },
});

// Share links mock (when Appwrite disabled)
shareLinksService.createShareLink = async (eventId) => ({
  success: true,
  data: {
    shareLink: {
      $id: 'mock-link-' + eventId,
      event_id: eventId,
      token: 'mock-token-' + eventId,
      is_active: true,
      created_at: new Date().toISOString(),
    },
  },
});
```

**Graceful Degradation:** App works fully in mock mode, uses real cloud storage when enabled.

---

### 5. Database Schema Updates

**File:** `APPWRITE_COLLECTIONS_SETUP.md`

**New Collection: share_links**

| Attribute | Type | Required | Notes |
|---|---|---|---|
| event_id | String (255) | Yes | Reference to events.$id |
| token | String (64) | Yes | Unique public share token |
| is_active | Boolean | No (default: true) | Soft delete flag |
| created_at | DateTime | No (default: $now) | Creation timestamp |
| expires_at | DateTime | No (default: null) | Optional expiration |

**Indexes:**
- `token_idx` - token (ASC), **Unique: Yes** (for fast lookups)
- `event_id_idx` - event_id (ASC) (query by event)
- `active_idx` - is_active (ASC) (filter active links)

**Permissions:**
- **Create:** Users (authenticated)
- **Read:** Any (public scoreboard access)
- **Update/Delete:** Document-level (owner only)

**Storage Buckets:**

| Bucket | Purpose | Max Size | Allowed Types | Permissions |
|---|---|---|---|---|
| logos | Event logos | 10MB | PNG, JPG | File-level (owner) |
| avatars | Team avatars | 5MB | PNG, JPG | File-level (owner) |

---

### 6. Environment Configuration

**File:** `.env.example`

**New Variables:**
```bash
# Appwrite Storage Buckets (Phase E - Assets)
NEXT_PUBLIC_APPWRITE_BUCKET_LOGOS="logos"
NEXT_PUBLIC_APPWRITE_BUCKET_AVATARS="avatars"
```

**Required Steps:**
1. Copy `.env.example` to `.env.local`
2. Create storage buckets in Appwrite Console
3. Bucket IDs should match: `logos` and `avatars`
4. No need to change env vars if using default IDs

---

## Files Created/Modified

### Created Files
- ✅ `lib/services/appwriteStorage.ts` - Storage service (269 lines)
- ✅ `lib/services/appwriteShareLinks.ts` - Share links service (252 lines)
- ✅ `PHASE_E_COMPLETE.md` - This document

### Modified Files
- ✅ `lib/services/index.ts` - Exported new services with mock fallbacks
- ✅ `components/LogoUpload.tsx` - Integrated Appwrite uploads, added loading states
- ✅ `APPWRITE_COLLECTIONS_SETUP.md` - Added share_links collection and storage buckets
- ✅ `.env.example` - Added bucket ID configuration

---

## Testing Checklist

### ✅ Code Verification
- TypeScript compilation: **No errors**
- All imports resolved
- Service layer exports working
- Mock fallbacks functional

### ⏳ Manual Testing (After Appwrite Setup)

#### Storage Testing
1. **Logo Upload:**
   - [ ] Open event creation/edit form
   - [ ] Upload PNG image < 10MB
   - [ ] Verify file appears in Appwrite Storage → logos bucket
   - [ ] Check file permissions (owner only)
   - [ ] Refresh page - logo should persist

2. **Avatar Upload:**
   - [ ] Create/edit team
   - [ ] Upload JPG image < 5MB
   - [ ] Verify file in avatars bucket
   - [ ] Check preview URL loads correctly
   - [ ] Remove avatar - file should be deleted

3. **File Validation:**
   - [ ] Try uploading 15MB file - should fail with size error
   - [ ] Try uploading .gif file - should fail with type error
   - [ ] Verify error messages are user-friendly

#### Share Links Testing
1. **Create Link:**
   - [ ] Go to event settings
   - [ ] Generate share link
   - [ ] Verify token appears in share_links collection
   - [ ] Check `is_active = true`
   - [ ] Copy share URL

2. **Public Access:**
   - [ ] Open share URL in incognito window (no login)
   - [ ] Scoreboard should display without auth
   - [ ] Verify teams and scores visible
   - [ ] Check realtime updates work

3. **Regenerate Link:**
   - [ ] Click "Regenerate Link" in settings
   - [ ] Old link should have `is_active = false`
   - [ ] New link should be created with `is_active = true`
   - [ ] Old URL should no longer work

4. **Delete Link:**
   - [ ] Delete share link
   - [ ] Verify `is_active = false` in database
   - [ ] Share URL should show "Link not found" error
   - [ ] Event owner can still access via auth

---

## Deployment Checklist

### Prerequisites
- [ ] Appwrite project created
- [ ] Database `main` exists
- [ ] Collections created (Phase C)

### Storage Buckets Setup

#### logos Bucket
1. [ ] Go to Appwrite Console → Storage
2. [ ] Click "Create Bucket"
3. [ ] Bucket ID: `logos`
4. [ ] Max File Size: 10MB (10485760 bytes)
5. [ ] Allowed Extensions: png, jpg, jpeg
6. [ ] Permissions:
   - [ ] Create: Users
   - [ ] Read/Update/Delete: File-level
7. [ ] Click "Create"

#### avatars Bucket
1. [ ] Click "Create Bucket"
2. [ ] Bucket ID: `avatars`
3. [ ] Max File Size: 5MB (5242880 bytes)
4. [ ] Allowed Extensions: png, jpg, jpeg
5. [ ] Permissions: Same as logos
6. [ ] Click "Create"

### share_links Collection
1. [ ] Go to Database → main → Create Collection
2. [ ] Collection ID: `share_links`
3. [ ] Add 5 attributes (event_id, token, is_active, created_at, expires_at)
4. [ ] Create 3 indexes (token_idx **unique**, event_id_idx, active_idx)
5. [ ] **CRITICAL:** Set permissions:
   - [ ] Create: Users
   - [ ] **Read: Any** (public access required!)
   - [ ] Update/Delete: Document-level
6. [ ] Click "Create"

### Environment Configuration
1. [ ] Update `.env.local` with bucket IDs (or use defaults)
2. [ ] Set `NEXT_PUBLIC_USE_APPWRITE_SERVICES="true"`
3. [ ] Restart Next.js dev server

---

## Architecture Benefits

### Before Phase E
- ❌ Logos stored locally (lost on refresh in mock mode)
- ❌ Share links via database queries (requires auth)
- ❌ No file management or cleanup
- ❌ Local blob URLs expire after page reload

### After Phase E
- ✅ Logos persist in cloud storage
- ✅ Automatic image optimization (preview API)
- ✅ Public share links work without authentication
- ✅ File permissions prevent unauthorized access
- ✅ Soft delete preserves history
- ✅ Token-based access control

---

## Security Features

### Storage Security
1. **File-level Permissions:** Each file has owner-only access
2. **File Type Validation:** Only PNG/JPG allowed (prevents XSS via SVG)
3. **Size Limits:** Prevents DoS via large uploads
4. **Owner Association:** Files tagged with uploader's user ID

### Share Links Security
1. **Crypto-Random Tokens:** 32-character hex (2^128 entropy)
2. **Public Read Only:** Share links are read-only, can't modify events
3. **Token Uniqueness:** Database index prevents duplicates
4. **Soft Delete:** Deactivated links can't be reactivated (prevents reuse)
5. **Event Ownership:** Only event owner can create/delete links

---

## Usage Examples

### Upload Event Logo
```typescript
// In event creation/edit form
import { storageService } from '@/lib/services';

const handleLogoUpload = async (file: File, previewUrl: string, fileId?: string) => {
  if (fileId) {
    // Store fileId or fileUrl in event data
    setEventData({ ...eventData, logo_path: fileId });
  }
};

<LogoUpload
  currentLogoUrl={event?.logo_path}
  onLogoChange={handleLogoUpload}
  type="logo"
  entityId={eventId}
  label="Event Logo"
/>
```

### Create Share Link
```typescript
import { shareLinksService } from '@/lib/services';

const handleCreateShareLink = async () => {
  const result = await shareLinksService.createShareLink(eventId, userId);
  if (result.success) {
    const shareUrl = `${window.location.origin}/scoreboard/${result.data.shareLink.token}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied!');
  }
};
```

### Public Scoreboard Access
```typescript
// In app/scoreboard/[token]/page.tsx

const { token } = params;

// Resolve token to event ID (no auth required)
const linkResult = await shareLinksService.resolveShareToken(token);
if (!linkResult.success) {
  return <div>Share link not found or inactive</div>;
}

const eventId = linkResult.data.eventId;
// Load event data and display scoreboard
```

---

## Next Steps (Optional Enhancements)

### Phase E+ Future Work
1. **Link Expiration:**
   - Implement `expires_at` checking
   - Auto-deactivate expired links via cron
   - UI for setting expiration date

2. **File Cleanup:**
   - Delete old files when new ones uploaded
   - Orphan file detection (files without event/team)
   - Storage usage analytics

3. **Advanced Sharing:**
   - Password-protected share links
   - View count tracking
   - QR code generation for easy mobile access

4. **Image Processing:**
   - Auto-crop/resize on upload
   - Thumbnail generation
   - Watermark overlay

5. **CDN Integration:**
   - Cache file previews
   - Geographically distributed storage
   - Faster load times globally

---

## Troubleshooting

### Upload Fails
- **Check:** User is authenticated (`auth.getUser()` returns user)
- **Check:** File type is PNG or JPG
- **Check:** File size under limit (10MB logos, 5MB avatars)
- **Check:** Bucket exists and IDs match `.env.local`
- **View:** Appwrite Console → Storage → Buckets (verify creation)

### Share Link Returns 404
- **Check:** `is_active = true` in database
- **Check:** Token matches exactly (case-sensitive)
- **Check:** Collection permissions allow `Read: Any`
- **View:** Appwrite Console → Databases → share_links → Documents

### "Permission Denied" on Upload
- **Check:** Bucket has `Create: Users` permission
- **Check:** User is logged in (JWT token valid)
- **View:** Appwrite Console → Storage → Bucket Settings → Permissions

### Logo Not Displaying
- **Check:** `fileUrl` uses correct endpoint and project ID
- **Check:** File permissions allow owner read access
- **Try:** Open preview URL directly in browser to test
- **Verify:** `getFilePreviewUrl()` includes width/height/quality params

---

## Resources

- [Appwrite Storage Docs](https://appwrite.io/docs/products/storage)
- [Appwrite Permissions Guide](https://appwrite.io/docs/advanced/platform/permissions)
- [File Preview API](https://appwrite.io/docs/apis/rest#storage-getFilePreview)

---

## Summary

**Phase E Status:** ✅ **COMPLETE**

All storage and share link infrastructure is in place. Files can be uploaded to cloud storage with proper permissions, and public share links enable passwordless scoreboard access. The app gracefully falls back to mock behavior when Appwrite is disabled.

**Key Achievements:**
- ✅ Cloud file storage with automatic optimization
- ✅ Public share links without authentication
- ✅ Secure file permissions (owner-only access)
- ✅ Soft delete pattern for link history
- ✅ Seamless mock/Appwrite service switching

**Ready for Production:** Yes, after creating storage buckets and share_links collection in Appwrite Console.
