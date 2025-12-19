# Appwrite Setup Guide

## ✅ Collections Status

The following collections have been successfully created:

1. **users** ✓
2. **events** ✓
3. **teams** ✓
4. **scores** ✓
5. **recaps** ✓
6. **share_links** ✓
7. **templates** ✓
8. **event_admins** ✓
9. **audit_logs** ✓

## 📦 Storage Buckets (Manual Setup Required)

Please create the following storage buckets in your Appwrite Console:

### 1. Avatars Bucket
- **Bucket ID**: `avatars`
- **Bucket Name**: Team Avatars
- **Max File Size**: 5MB (5242880 bytes)
- **Allowed File Extensions**: `.jpg, .jpeg, .png, .gif, .webp`
- **Permissions**:
  - Read: `any` (public read access)
  - Create: `users` (authenticated users)
  - Update: `users` (authenticated users)
  - Delete: `users` (authenticated users)

### 2. Logos Bucket
- **Bucket ID**: `logos`
- **Bucket Name**: Event Logos
- **Max File Size**: 10MB (10485760 bytes)
- **Allowed File Extensions**: `.jpg, .jpeg, .png, .svg, .webp`
- **Permissions**:
  - Read: `any` (public read access)
  - Create: `users` (authenticated users)
  - Update: `users` (authenticated users)
  - Delete: `users` (authenticated users)

## 🔧 How to Create Buckets

1. Open your Appwrite Console at https://fra.cloud.appwrite.io/
2. Navigate to **Storage** in the left sidebar
3. Click **Create Bucket**
4. Fill in the details as specified above
5. Set permissions accordingly
6. Repeat for both avatars and logos buckets

## 🔑 Permissions Guide

- **`any`**: Anyone can access (even guests)
- **`users`**: Only authenticated users
- For document-level permissions, use `user:[USER_ID]` for user-specific access

## ✅ Verification

After creating the buckets, test by:
1. Logging into your app
2. Going to Profile page
3. Try uploading an avatar
4. Creating an event with a logo

If uploads work, your buckets are correctly configured!

## 📞 Support

If you encounter issues:
- Check Appwrite Console logs
- Verify API keys in `.env.local`
- Ensure buckets have correct permissions
- Contact support with error messages
