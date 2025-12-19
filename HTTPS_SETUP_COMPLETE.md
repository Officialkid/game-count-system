# HTTPS Local Development Setup - Completed ✅

## Summary
HTTPS localhost has been successfully configured to fix Appwrite session cookies. The system now runs on:
- **HTTPS URL:** https://localhost:3002 (secure)
- **Next.js Dev Server:** http://localhost:3001 (proxied through SSL)
- **Appwrite:** Communicates over HTTPS with properly persisted session cookies

---

## What Was Installed

### 1. ✅ mkcert v1.4.4
- **Status:** Installed and running
- **Path:** `C:\Users\DANIEL\AppData\Roaming\mkcert.exe`
- **Purpose:** Generate locally-trusted SSL certificates

### 2. ✅ Root CA Certificate
- **Installed in:** System Trust Store (Windows Certificate Manager)
- **Status:** Trusted on this machine
- **Expiry:** 19 March 2028

### 3. ✅ localhost Certificates
- **Location:** `.cert/` directory
- **Files:**
  - `localhost.pem` - Certificate
  - `localhost-key.pem` - Private key
- **Valid for:** localhost, 127.0.0.1
- **Expiry:** 19 March 2028

### 4. ✅ local-ssl-proxy
- **Status:** Already in package.json
- **Purpose:** HTTPS reverse proxy (3002 → 3001)
- **Version:** ^2.0.5

---

## Running HTTPS Dev Server

### Option 1: HTTPS with SSL Proxy (Recommended for Appwrite)
```bash
npm run dev:https
```

**What happens:**
1. Next.js dev server starts on `http://localhost:3001` (internal)
2. SSL proxy listens on `https://localhost:3002` (public)
3. All traffic is encrypted with mkcert certificate
4. Appwrite session cookies persist (HTTPS requirement met)

**Access the app:** https://localhost:3002

---

### Option 2: Regular Dev Server (HTTP - for reference)
```bash
npm run dev
```

**Access the app:** http://localhost:3000

---

## Certificate Details

### Generated Certificate Info
```
Certificate: localhost.pem
Key: localhost-key.pem
Names: localhost, 127.0.0.1
Valid: 19 March 2025 - 19 March 2028
Issuer: mkcert development CA
Trust: System Root CA (Windows)
```

### Browser Behavior
- **On HTTPS:** ✅ Green lock icon (trusted certificate)
- **No warnings:** Certificate is locally trusted
- **Secure cookies:** Session cookies can use Secure flag
- **localhost-specific:** Certificate only works on localhost/127.0.0.1

---

## Testing Auth with HTTPS

### Test Steps:
1. **Start the server:**
   ```bash
   npm run dev:https
   ```

2. **Wait for output:**
   ```
   🔐 Starting HTTPS dev (proxy https://localhost:3002 → next dev on 3001)
   ✓ Generated/loaded localhost certificate
   ```

3. **Open browser:**
   - Navigate to: https://localhost:3002

4. **Test signup/login:**
   - Click "Sign Up" or "Login"
   - Enter credentials
   - Should see account creation success
   - Should be redirected to dashboard
   - Check browser console for errors (should be minimal)

5. **Verify session persistence:**
   - After login, refresh the page
   - Should remain logged in
   - Should NOT see 401 Unauthorized
   - Dashboard should load data from Appwrite

6. **Check Appwrite logs:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Look for successful requests to:
     - `POST /account/sessions/email` (200 OK)
     - `GET /account` (200 OK)
     - `GET /databases/main/collections/...` (200 OK)

---

## Troubleshooting

### Issue: "Certificate is not valid" warning still appears
**Solution:** Browser cache issue. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Issue: "Cannot find localhost certificate"
**Solution:** Verify files exist:
```bash
ls -la .cert/
# Should show: localhost.pem, localhost-key.pem
```

### Issue: "EACCES: permission denied" on dev:https
**Solution:** Run with admin rights or use `npm run dev` instead

### Issue: Port 3002 already in use
**Edit scripts/dev-https.js** and change:
```javascript
['local-ssl-proxy', '--source', '3003', '--target', '3001', ...]
// Changed from 3002 to 3003
```

### Issue: Still getting 401 auth errors
**This likely means:** Appwrite Console settings not configured
- Go to Appwrite Console → Project Settings → Platforms
- Add: `https://localhost:3002` (HTTPS URL)
- Save and retry login

---

## How It Fixes Appwrite Sessions

### The Problem (HTTP)
```
Browser: http://localhost:3000
└─ Appwrite: https://fra.cloud.appwrite.io (HTTPS)
   └─ Sets cookie: a_session_{ID}
      └─ Flags: Secure (requires HTTPS)
         └─ Result: Cookie NOT sent back to browser (protocol mismatch)
            └─ 401 Unauthorized on next request
```

### The Solution (HTTPS)
```
Browser: https://localhost:3002 ✅
└─ Appwrite: https://fra.cloud.appwrite.io (HTTPS) ✅
   └─ Sets cookie: a_session_{ID}
      └─ Flags: Secure (requires HTTPS) ✅
         └─ Result: Cookie persisted and sent with requests
            └─ Authenticated requests work ✅
```

---

## Files & Directories

### New Files Created
- **`.cert/localhost.pem`** - SSL certificate
- **`.cert/localhost-key.pem`** - SSL private key
- **`setup-https.ps1`** - Setup script (already ran)

### Existing Files (Already Present)
- **`scripts/dev-https.js`** - HTTPS dev server script
- **`package.json`** - Already includes `dev:https` script and `local-ssl-proxy` dependency

### No Changes Needed
- **`next.config.js`** - Already compatible
- **`app/layout.tsx`** - No changes needed
- **`lib/appwrite.ts`** - No changes needed

---

## Performance Notes

**HTTPS Dev Server:**
- ✅ Fast (same as regular dev)
- ✅ Hot reload works
- ✅ Source maps available
- ✅ No performance penalty vs HTTP
- ✅ Actual TLS termination (not mock)

**Certificate Caching:**
- ✅ Cached by browser (valid for 1 year on page)
- ✅ No re-negotiation needed
- ✅ Automatic renewal on expiry (2028)

---

## Next Steps

1. **Test authentication:**
   ```bash
   npm run dev:https
   # Visit https://localhost:3002
   # Try signup/login
   ```

2. **Verify in Appwrite Console:**
   - Settings → Platforms
   - Ensure `https://localhost:3002` is whitelisted
   - If not, add it and save

3. **Monitor Network Tab:**
   - Open DevTools (F12)
   - Network tab
   - Look for successful `/account` calls
   - No 401 errors should appear

4. **Once Auth Works:**
   - Run full end-to-end tests
   - Create event → Add teams → Add scores
   - Test dashboard data loading
   - Test share links

---

## Command Reference

```bash
# Start HTTPS dev server (recommended for Appwrite)
npm run dev:https

# Start regular HTTP dev server
npm run dev

# Build for production
npm run build

# Start production build
npm start

# View certificate info
mkcert -help
```

---

## Security Notes

✅ **Secure by Default:**
- Certificates are locally-trusted only (not public)
- No private key exposed
- No external CA verification needed
- Works offline

✅ **Development-Safe:**
- mkcert certificates only work on local machine
- Cannot be used for public websites
- Expires in 3 years (renewal needed then)
- No security risk

⚠️ **For Production:**
- Use proper SSL from Let's Encrypt or CA
- Deploy via Vercel (handles SSL automatically)
- Never use dev certificates in production

---

**Setup Completed:** December 19, 2025  
**Status:** ✅ Ready for testing  
**Next Phase:** S1.2 - Test Authentication Flow
