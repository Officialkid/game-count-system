# 🔐 Environment Variables Quick Reference

## 🚀 Quick Setup (3 Steps)

```bash
# 1. Copy template
cp .env.example .env.local

# 2. Fill in your Firebase credentials
# Edit .env.local with your values

# 3. Validate configuration
npm run check-env

# 4. Start development
npm run dev
```

---

## 📋 Required Variables Checklist

### ✅ Firebase Client (Public - Browser)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=          # Get from Firebase Console
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=      # your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=       # your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=   # your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID= # 12-digit number
NEXT_PUBLIC_FIREBASE_APP_ID=           # 1:numbers:web:hash
```

**Where to find**: Firebase Console → ⚙️ Settings → Your apps → Web app

---

### 🔒 Firebase Admin (Private - Server Only)
```bash
FIREBASE_ADMIN_PROJECT_ID=             # Same as client project ID
FIREBASE_ADMIN_CLIENT_EMAIL=           # firebase-adminsdk-...@....iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY=            # "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Where to find**: Firebase Console → ⚙️ Settings → Service Accounts → Generate private key

⚠️ **CRITICAL**: Private key must be:
- Wrapped in double quotes
- Have `\n` characters (not actual newlines)
- All on ONE line in .env.local

---

### 🔧 Application Config
```bash
NEXT_PUBLIC_APP_URL=                   # http://localhost:3000 (dev) or https://yourdomain.com (prod)
ADMIN_CLEANUP_SECRET=                  # Random 32+ character string
```

**Generate secret**:
```bash
# Mac/Linux
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

---

## 🔍 Validation Commands

```bash
# Check all environment variables
npm run check-env

# Expected output if successful:
# ✅ All environment variables are properly configured!
```

---

## 🐛 Common Issues & Fixes

### ❌ "Cannot find module '@/lib/firebase-client'"
**Fix**: Restart dev server after adding .env.local
```bash
npm run dev
```

### ❌ "Firebase Admin: Error parsing private key"
**Fix**: Ensure private key format is correct
```bash
# ✅ CORRECT (with quotes and \n):
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"

# ❌ WRONG (multi-line):
FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvQI...
-----END PRIVATE KEY-----
```

### ❌ "Error: auth/invalid-api-key"
**Fix**: Double-check Firebase API key
```bash
# 1. Go to Firebase Console
# 2. Project Settings → Your apps → Web
# 3. Copy apiKey value exactly
# 4. No extra spaces or quotes
```

### ❌ Changes not reflecting
**Fix**: Clear Next.js cache and restart
```bash
# Windows PowerShell
Remove-Item -Recurse .next
npm run dev

# Mac/Linux
rm -rf .next
npm run dev
```

---

## 🚀 Deployment Platforms

### Vercel
```bash
# Via CLI
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add FIREBASE_ADMIN_PRIVATE_KEY
# ... add all variables

# Via Dashboard
# Settings → Environment Variables → Add each variable
```

### Render
```
Dashboard → Environment → Add Environment Variable
Add all variables one by one
```

### Netlify
```
Site settings → Environment variables → Add a variable
Add all variables one by one
```

⚠️ **Important**: Add variables for ALL environments (Production, Preview, Development)

---

## 🔒 Security Checklist

- [ ] `.env.local` is in `.gitignore` (✅ already done)
- [ ] Never commit `.env.local` to Git
- [ ] `.env.example` has NO real values
- [ ] Service account JSON files are secure
- [ ] `ADMIN_CLEANUP_SECRET` is strong (32+ chars)
- [ ] Different Firebase projects for dev/prod
- [ ] Firebase security rules are configured
- [ ] Admin private key is never exposed in client code

---

## 📚 Full Documentation

For complete setup instructions, troubleshooting, and examples:
👉 **See [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)**

---

## 🆘 Quick Help

```bash
# Validate environment
npm run check-env

# Start development server
npm run dev

# Build for production
npm run build

# View example template
cat .env.example
```

**Firebase Console**: https://console.firebase.google.com  
**Full Guide**: [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md)

---

**Last Updated**: February 2026  
**Game Count System** - Firebase Edition
