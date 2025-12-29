# Appwrite Complete Setup Guide
**Complete Authentication & Integration Setup**

## Current Issue Diagnosis

You're seeing 401 errors because:
1. ❌ No user account exists in your Appwrite project yet
2. ❌ Google OAuth may not be configured in Appwrite Console
3. ❌ MFA is not set up (optional but referenced in code)
4. ❌ CORS settings may need verification

---

## ✅ STEP 1: Verify Appwrite Console Access

### 1.1 Login to Appwrite Console
```
URL: https://cloud.appwrite.io/console
```

### 1.2 Navigate to Your Project
- Project ID: `694164500028df77ada9`
- Endpoint: `https://fra.cloud.appwrite.io/v1`
- Region: Frankfurt (fra)

✅ **Confirm**: You can see your project dashboard

---

## ✅ STEP 2: Configure Web Platform

### 2.1 Add Web Platform (if not exists)
1. Go to **Settings** → **Platforms**
2. Click **"Add Platform"** → **Web**
3. Enter details:
   ```
   Name: Game Count System (Local Dev)
   Hostname: localhost
   ```
4. Click **"Add"**

### 2.2 Add Production Platform (for deployment)
1. Click **"Add Platform"** → **Web**
2. Enter details:
   ```
   Name: Game Count System (Production)
   Hostname: your-domain.com
   ```
   (Or if using Vercel: `your-app.vercel.app`)

✅ **Confirm**: Both platforms show as registered

---

## ✅ STEP 3: Create Test User Account

### Option A: Via Appwrite Console (Recommended)
1. Go to **Auth** → **Users**
2. Click **"Create User"**
3. Fill in:
   ```
   Email: your-email@example.com
   Password: YourSecurePassword123!
   Name: Test User
   ```
4. Click **"Create"**

### Option B: Via Your App Registration
1. Open: http://localhost:3000/register
2. Fill in registration form
3. Submit (this will create user in Appwrite)

✅ **Confirm**: User appears in Appwrite Console → Auth → Users

---

## ✅ STEP 4: Test Email/Password Login

### 4.1 Try Login
1. Open: http://localhost:3000/login
2. Enter the credentials you created
3. Submit

### 4.2 Expected Result
- ✅ Login successful → redirects to `/dashboard`
- ✅ No 401 errors in console

### 4.3 If Still Getting 401
Check these in Appwrite Console:

**A. Session Settings**
- Go to **Auth** → **Security**
- Verify **"Session length"** is not 0
- Default: 31536000 seconds (1 year)

**B. User Status**
- Go to **Auth** → **Users**
- Find your user
- Ensure status is **"Active"** (not blocked/unverified)

**C. API Key Permissions** (if using server routes)
- Go to **Settings** → **API Keys**
- Find your key: `standard_73ac7d...`
- Verify scopes include:
  - `users.read`
  - `users.write`
  - `sessions.read`
  - `sessions.write`

✅ **Confirm**: Email/password login works

---

## ✅ STEP 5: Configure Google OAuth (Optional)

### 5.1 Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project (or select existing)
3. Enable **Google+ API**
4. Go to **APIs & Services** → **Credentials**
5. Click **"Create Credentials"** → **OAuth 2.0 Client ID**
6. Application type: **Web application**
7. Add authorized redirect URIs:
   ```
   https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/694164500028df77ada9
   ```
8. Copy:
   - Client ID
   - Client Secret

### 5.2 Configure in Appwrite
1. Go to Appwrite Console → **Auth** → **Settings**
2. Scroll to **"OAuth2 Providers"**
3. Find **Google** → Click **"Enable"**
4. Paste:
   - **App ID**: Your Google Client ID
   - **App Secret**: Your Google Client Secret
5. Click **"Save"**

### 5.3 Update Redirect URLs
In Google Cloud Console → Credentials → Your OAuth Client:
- Add authorized JavaScript origins:
  ```
  http://localhost:3000
  https://your-production-domain.com
  ```
- Add authorized redirect URIs:
  ```
  http://localhost:3000/login
  https://your-production-domain.com/login
  https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/694164500028df77ada9
  ```

### 5.4 Test Google Login
1. Open: http://localhost:3000/login
2. Click **"Continue with Google"**
3. Should redirect to Google → authorize → redirect back
4. Should be logged in

✅ **Confirm**: Google OAuth login works

---

## ✅ STEP 6: Configure MFA (Multi-Factor Authentication) - Optional

### 6.1 Enable MFA in Appwrite
1. Go to **Auth** → **Security**
2. Find **"Multi-factor authentication"**
3. Toggle **"Enable MFA"**
4. Select methods:
   - ✅ TOTP (Authenticator App)
   - ⬜ SMS (requires Twilio/similar)
   - ⬜ Email (uses Appwrite emails)

### 6.2 Test MFA Setup Flow
1. Login with email/password
2. Go to: http://localhost:3000/mfa-setup
3. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
4. Enter verification code
5. MFA is now enabled for your account

### 6.3 Test MFA Login
1. Logout
2. Login with email/password
3. You'll be prompted for MFA code
4. Enter code from authenticator app
5. Should complete login

✅ **Confirm**: MFA setup and login works (if enabled)

---

## ✅ STEP 7: Verify Database Collections

### 7.1 Check Collections Exist
Go to **Databases** → **main** (or your database name)

Required collections:
- ✅ `events`
- ✅ `teams`
- ✅ `scores`
- ✅ `share_links`
- ✅ `event_admins`
- ✅ `recaps` (if using recap feature)

### 7.2 Verify Permissions
For each collection, check **Settings** → **Permissions**:

**Recommended settings for development:**
```
Create: Any
Read: Any
Update: Any
Delete: Any
```

**Production settings** (more secure):
```
Create: Users
Read: Any (for public scoreboards)
Update: Users (with attribute-level rules)
Delete: Users (owner only)
```

✅ **Confirm**: All collections exist with proper permissions

---

## ✅ STEP 8: Update Environment Variables (if needed)

Your `.env.local` looks good! But verify:

```env
# ✅ Correct endpoint
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1

# ✅ Correct project ID
NEXT_PUBLIC_APPWRITE_PROJECT=694164500028df77ada9

# ✅ Valid API key (keep secret!)
APPWRITE_API_KEY=standard_73ac7d...

# ✅ Auth enabled
NEXT_PUBLIC_USE_APPWRITE=true

# ✅ Services enabled
NEXT_PUBLIC_USE_APPWRITE_SERVICES=true

# 🆕 Add this if missing:
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

After changes, restart dev server:
```powershell
cd "C:\Users\DANIEL\Documents\Website Projects\game-count-system\game-count-system"
npm run dev
```

---

## ✅ STEP 9: Test Complete Flow

### 9.1 Registration Flow
1. Go to: http://localhost:3000/register
2. Create new account
3. Should auto-login and redirect to dashboard
4. Check Appwrite Console → Auth → Users (new user should appear)

### 9.2 Login Flow
1. Logout (if logged in)
2. Go to: http://localhost:3000/login
3. Login with credentials
4. Should redirect to dashboard
5. Check browser console: no 401 errors

### 9.3 Dashboard Access
1. Verify you can see dashboard at: http://localhost:3000/dashboard
2. Try creating an event
3. Try adding teams
4. Try adding scores

### 9.4 Public Scoreboard
1. Create a share link for an event
2. Open in incognito/private window
3. Should display without login

---

## 🐛 TROUBLESHOOTING

### Issue: 401 Unauthorized on Login

**Possible Causes:**
1. ❌ User doesn't exist → Create user in Appwrite Console
2. ❌ Wrong credentials → Verify password
3. ❌ User is blocked → Check user status in Console
4. ❌ Session expired → Clear browser cache/cookies
5. ❌ Wrong project ID → Verify `.env.local`

**Fix:**
```powershell
# Clear browser storage
# In browser DevTools: Application → Storage → Clear site data

# Restart dev server
npm run dev
```

### Issue: CORS Errors

**Fix:**
1. Go to Appwrite Console → **Settings** → **Platforms**
2. Verify hostname: `localhost` (no `http://` prefix!)
3. Add wildcard if needed: `*.localhost`

### Issue: OAuth Redirect Loop

**Fix:**
1. Verify redirect URI in Google Console matches Appwrite format
2. Ensure platform hostname is registered in Appwrite
3. Check browser allows third-party cookies

### Issue: MFA Not Working

**Fix:**
1. Ensure MFA is enabled in Appwrite Console → Auth → Security
2. Verify time sync on authenticator device (TOTP requires accurate time)
3. Use backup codes if available

### Issue: Database Operations Fail

**Fix:**
1. Verify collection IDs in `lib/appwrite.ts` match Console
2. Check collection permissions (should allow read/write)
3. Verify API key has database scopes

---

## 📋 Quick Verification Checklist

Copy this to verify everything:

```
□ Appwrite Console access confirmed
□ Project ID and endpoint are correct in .env.local
□ Web platform added (localhost)
□ Test user account created
□ Email/password login works (no 401 errors)
□ Google OAuth configured (if using)
□ MFA configured (if using)
□ Database collections exist
□ Collection permissions set
□ Can access dashboard after login
□ Can create events, teams, scores
□ Public scoreboard works
```

---

## 🎯 Next Steps After Setup

Once authentication works:

1. **Deploy to Production**
   - Update platform hostname in Appwrite Console
   - Update Google OAuth redirect URIs
   - Update `NEXT_PUBLIC_APP_URL` env var

2. **Enable Email Verification** (optional)
   - Configure SMTP in Appwrite Console → Auth → Settings
   - Users will receive verification emails

3. **Set Up Teams/Organizations** (optional)
   - Go to Console → Auth → Teams
   - Create organizational structure

4. **Configure Rate Limiting** (optional)
   - Go to Console → Functions → Rate Limits
   - Prevent abuse

---

## 🆘 Still Having Issues?

**Debug Steps:**

1. **Check Browser Console**
   ```javascript
   // Open DevTools → Console → Run:
   console.log('Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT);
   console.log('Project:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT);
   ```

2. **Check Network Tab**
   - DevTools → Network → Filter: XHR
   - Look for requests to `fra.cloud.appwrite.io`
   - Check request headers and response

3. **Check Appwrite Logs**
   - Go to Console → Settings → Logs
   - Look for authentication attempts

4. **Test with cURL**
   ```bash
   curl -X POST https://fra.cloud.appwrite.io/v1/account/sessions/email \
     -H "Content-Type: application/json" \
     -H "X-Appwrite-Project: 694164500028df77ada9" \
     -d '{"email":"your-email@example.com","password":"YourPassword"}'
   ```

---

## 📞 Support Resources

- [Appwrite Discord](https://discord.com/invite/appwrite)
- [Appwrite Docs](https://appwrite.io/docs)
- [GitHub Issues](https://github.com/appwrite/appwrite/issues)

---

**Created:** December 22, 2025  
**Last Updated:** December 22, 2025  
**Status:** 🔴 In Progress → Follow steps above
