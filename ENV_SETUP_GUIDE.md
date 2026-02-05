# Environment Variables Setup Guide

Complete guide for configuring environment variables for the Game Count System Firebase project.

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Firebase Client Configuration](#firebase-client-configuration)
3. [Firebase Admin Configuration](#firebase-admin-configuration)
4. [Application Configuration](#application-configuration)
5. [Deployment Setup](#deployment-setup)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Copy the Template
```bash
cp .env.example .env.local
```

### 2. Fill in Your Values
Edit `.env.local` with your actual Firebase credentials (see sections below)

### 3. Validate Configuration
```bash
node scripts/check-env.js
```

### 4. Start Development Server
```bash
npm run dev
```

---

## Firebase Client Configuration

These variables are **public** and will be exposed to the browser. They're safe to expose as Firebase client SDK requires them.

### Getting Firebase Client Credentials

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project

2. **Navigate to Project Settings**
   - Click the ⚙️ gear icon (top left)
   - Select "Project settings"

3. **Find Your Web App Configuration**
   - Scroll down to "Your apps" section
   - If you don't have a web app yet:
     - Click "Add app" → Select Web (</>) icon
     - Register your app with a nickname (e.g., "Game Count Web")
   - Click the config radio button (not the CDN script)

4. **Copy the Configuration Values**
   You'll see a config object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```

5. **Add to .env.local**
   ```bash
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

---

## Firebase Admin Configuration

These variables are **private** and should NEVER be exposed to the browser. They're only used in API routes (server-side).

### Getting Firebase Admin Credentials

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project

2. **Navigate to Service Accounts**
   - Click ⚙️ gear icon → "Project settings"
   - Click "Service accounts" tab

3. **Generate New Private Key**
   - Click "Generate new private key" button
   - Confirm the dialog
   - A JSON file will download automatically

4. **Extract Values from JSON**
   The downloaded file looks like:
   ```json
   {
     "type": "service_account",
     "project_id": "your-project",
     "private_key_id": "abc123...",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
     "client_id": "123456789",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     ...
   }
   ```

5. **Add to .env.local**
   ```bash
   FIREBASE_ADMIN_PROJECT_ID=your-project
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
   ```

### Important: Private Key Formatting

⚠️ **Critical**: The private key must be properly formatted with newlines.

**✅ Correct** (with quotes and \n):
```bash
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANB...\n-----END PRIVATE KEY-----\n"
```

**❌ Incorrect** (no quotes or escaped newlines):
```bash
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANB...
-----END PRIVATE KEY-----
```

**💡 Quick Fix**: If you paste directly from the JSON file, ensure:
1. Wrap the entire value in double quotes
2. Keep the `\n` characters (don't replace with actual newlines)
3. The entire key should be on ONE line in .env.local

---

## Application Configuration

### NEXT_PUBLIC_APP_URL

The base URL of your application.

**Development:**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production:**
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Usage**: Used for generating public links, QR codes, and OAuth redirects.

### ADMIN_CLEANUP_SECRET

A secret key for protecting the admin cleanup cron job endpoint.

**Generate a secure random key:**

**Using OpenSSL (Mac/Linux):**
```bash
openssl rand -hex 32
```

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using PowerShell (Windows):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

**Add to .env.local:**
```bash
ADMIN_CLEANUP_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### NODE_ENV

Sets the environment mode.

```bash
NODE_ENV=development  # Local development
NODE_ENV=production   # Production deployment
```

**Note**: Vercel and most deployment platforms set this automatically.

---

## Deployment Setup

### Vercel Deployment

1. **Install Vercel CLI** (optional):
   ```bash
   npm i -g vercel
   ```

2. **Add Environment Variables via Dashboard**:
   - Go to https://vercel.com/dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add each variable from your `.env.local`

3. **Or Use Vercel CLI**:
   ```bash
   # Add one variable
   vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
   
   # Pull environment variables
   vercel env pull
   ```

4. **Important**: Add variables for ALL environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### Render Deployment

1. **Go to Render Dashboard**:
   - Navigate to your web service
   - Click "Environment" in the sidebar

2. **Add Environment Variables**:
   - Click "Add Environment Variable"
   - Enter key and value
   - Repeat for all variables

3. **Format FIREBASE_ADMIN_PRIVATE_KEY**:
   - Render handles newlines differently
   - Option 1: Use the exact JSON value with `\n`
   - Option 2: Upload the service account JSON and reference it

### Netlify Deployment

1. **Go to Site Settings**:
   - Navigate to your site
   - Click "Site settings" → "Environment variables"

2. **Add Variables**:
   - Click "Add a variable"
   - Enter key and value
   - Repeat for all variables

3. **Deploy Contexts**:
   - Set variables for Production, Deploy Previews, and Branch deploys

---

## Security Best Practices

### ✅ DO:
- ✅ Use `.env.local` for local development
- ✅ Add `.env.local` to `.gitignore`
- ✅ Use environment variables in deployment platforms
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use different Firebase projects for dev/staging/prod
- ✅ Generate strong random values for `ADMIN_CLEANUP_SECRET`
- ✅ Commit `.env.example` with dummy values
- ✅ Keep service account JSON files secure (don't share)

### ❌ DON'T:
- ❌ Commit `.env.local` to Git
- ❌ Share service account JSON files
- ❌ Use the same secrets across environments
- ❌ Store secrets in code comments or documentation
- ❌ Use weak or predictable secrets
- ❌ Expose admin credentials in client-side code
- ❌ Share your `.env.local` file via Slack/email

### Firebase Security Rules

Ensure your Firestore security rules are properly configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events: Public read, admin write
    match /events/{eventId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
      
      // Tokens: Secure access
      match /tokens/{tokenId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && request.auth.token.admin == true;
      }
      
      // Teams: Public read, admin write
      match /teams/{teamId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
      
      // Scores: Public read, scorer/admin write
      match /scores/{scoreId} {
        allow read: if true;
        allow write: if request.auth != null;
      }
    }
  }
}
```

---

## Troubleshooting

### Error: "Firebase: Error (auth/invalid-api-key)"

**Problem**: Invalid or missing `NEXT_PUBLIC_FIREBASE_API_KEY`

**Solution**:
1. Double-check the API key from Firebase Console
2. Ensure no extra spaces or quotes
3. Restart dev server after changing `.env.local`

### Error: "Firebase Admin: Error parsing private key"

**Problem**: Private key formatting issue

**Solutions**:
1. Ensure private key is wrapped in double quotes
2. Keep `\n` characters (don't replace with actual newlines)
3. Private key should be ONE line in `.env.local`
4. Copy directly from the downloaded JSON file

**Example Fix**:
```bash
# ❌ Wrong
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQI...
-----END PRIVATE KEY-----

# ✅ Correct
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"
```

### Error: "Cannot find module '@/lib/firebase-client'"

**Problem**: Environment variables not loaded or Next.js cache issue

**Solution**:
1. Ensure `.env.local` exists in project root
2. Restart dev server: `npm run dev`
3. Clear Next.js cache: `rm -rf .next` (or `Remove-Item -Recurse .next` on Windows)
4. Rebuild: `npm run build`

### Error: "ADMIN_CLEANUP_SECRET missing or invalid"

**Problem**: Cleanup cron job can't authenticate

**Solution**:
1. Add `ADMIN_CLEANUP_SECRET` to `.env.local`
2. Use a strong random value (32+ characters)
3. In deployment platform, add the same secret
4. Test locally: `curl http://localhost:3000/api/cron/cleanup?secret=YOUR_SECRET`

### Environment Variables Not Updating

**Problem**: Changes to `.env.local` not reflecting

**Solutions**:
1. **Restart dev server** (required for all env changes)
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check for typos**:
   - Variable names are case-sensitive
   - No spaces around `=`
   - Quote values with special characters

4. **Verify .env.local location**:
   - Must be in project root (same level as `package.json`)
   - Not in subdirectories

### Firebase Connection Fails in Production

**Problem**: Works locally but fails in deployment

**Solutions**:
1. Verify ALL environment variables are set in deployment platform
2. Check deployment logs for specific error messages
3. Ensure `NEXT_PUBLIC_APP_URL` matches your actual domain
4. Verify Firebase project has same configuration as local
5. Check Firebase quotas and billing status

---

## Validation

Run the validation script to check your configuration:

```bash
node scripts/check-env.js
```

**Expected Output**:
```
✅ All required environment variables are set
✅ Firebase client configuration is valid
✅ Firebase admin configuration is valid
✅ Application configuration is valid
```

**If validation fails**:
1. Follow the error messages to identify missing variables
2. Check `.env.local` for typos
3. Ensure no extra spaces or quotes
4. Restart dev server after making changes

---

## Complete Example .env.local

```bash
# ============================================================================
# FIREBASE CLIENT (Public)
# ============================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=my-game-count.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=my-game-count
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=my-game-count.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:a1b2c3d4e5f6g7h8

# ============================================================================
# FIREBASE ADMIN (Private)
# ============================================================================
FIREBASE_ADMIN_PROJECT_ID=my-game-count
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-abc123@my-game-count.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# ============================================================================
# APPLICATION
# ============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_CLEANUP_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# ============================================================================
# OPTIONAL
# ============================================================================
NODE_ENV=development
```

---

## Need Help?

1. **Check validation script**: `node scripts/check-env.js`
2. **Review Firebase Console**: Verify credentials match
3. **Check deployment logs**: Look for specific error messages
4. **Test locally first**: Ensure it works with `npm run dev`
5. **Consult Firebase docs**: https://firebase.google.com/docs

---

**Last Updated**: February 2026  
**Version**: 1.0.0
