# DEPLOYMENT ENVIRONMENT SETUP GUIDE

## ✅ COMPLETED
- ✓ Database (POSTGRES_URL) - Connected to Render PostgreSQL
- ✓ JWT Secret (JWT_SECRET) - 86 character secure key
- ✓ Cookie Secret (COOKIE_SECRET) - 64 character secure key  
- ✓ App URL (NEXT_PUBLIC_URL) - Set to localhost (update for production)
- ✓ Email Server (EMAIL_SERVER) - smtp.gmail.com
- ✓ Email Port (EMAIL_PORT) - 587
- ✓ Email Security (EMAIL_SECURE) - STARTTLS

## ❌ REQUIRED FOR DEPLOYMENT

You need to add these 3 email variables to your `.env` file:

### 1. EMAIL_USER
Your Gmail address that will send emails.
```env
EMAIL_USER="your-email@gmail.com"
```

### 2. EMAIL_PASSWORD
**NOT your regular Gmail password!** Generate an app-specific password:

**Steps to get Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-Factor Authentication if not already enabled
3. Click "Generate app password"
4. Select "Mail" and "Other (Custom name)"
5. Name it "Game Count System"
6. Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

```env
EMAIL_PASSWORD="your-16-char-app-password"
```

### 3. EMAIL_FROM
The "From" address users will see in their emails.
```env
EMAIL_FROM="Game Count System <noreply@yourdomain.com>"
```
Or simply:
```env
EMAIL_FROM="your-email@gmail.com"
```

## ⚠️ FOR PRODUCTION DEPLOYMENT

When deploying to production, also update:

### 4. NEXT_PUBLIC_URL
Change from localhost to your actual domain:
```env
NEXT_PUBLIC_URL="https://yourdomain.com"
```

### 5. NODE_ENV
Set to production:
```env
NODE_ENV="production"
```

## 📝 CURRENT .ENV STATUS

Your `.env` file currently has:
```
✓ POSTGRES_URL - Configured
✓ JWT_SECRET - Configured (86 chars)
✓ COOKIE_SECRET - Configured (64 chars)
✓ NEXT_PUBLIC_URL - Set to localhost
✓ EMAIL_SERVER - smtp.gmail.com
✓ EMAIL_PORT - 587
✓ EMAIL_SECURE - false
✗ EMAIL_USER - MISSING
✗ EMAIL_PASSWORD - MISSING
✗ EMAIL_FROM - MISSING
```

## 🔒 SECURITY REMINDERS

1. **Never commit `.env` to git** - Already in .gitignore ✓
2. **Use different secrets** - JWT_SECRET ≠ COOKIE_SECRET ✓
3. **Minimum 32 characters** - All secrets meet requirement ✓
4. **Enable 2FA for Gmail** - Required for app passwords
5. **Use HTTPS in production** - Update NEXT_PUBLIC_URL

## 🧪 TESTING AFTER SETUP

Once you add the email credentials, run:
```bash
node test-environment.js
```

You should see:
- ✅ All 28 tests passing (100%)
- ✅ "READY FOR DEPLOYMENT" message

## 📊 TEST RESULTS (Current)

```
Tests Passed:  25/28 (89.3%)
Tests Failed:  3/28
Status:        DEPLOYMENT BLOCKED
```

**Blocking Issues:**
1. EMAIL_USER not configured
2. EMAIL_PASSWORD not configured  
3. EMAIL_FROM not configured

## 🚀 DEPLOYMENT CHECKLIST

Before deploying to production:

- [ ] Add EMAIL_USER to .env
- [ ] Add EMAIL_PASSWORD to .env (app password, not regular password)
- [ ] Add EMAIL_FROM to .env
- [ ] Change NEXT_PUBLIC_URL to production domain
- [ ] Set NODE_ENV="production"
- [ ] Run `node test-environment.js` (should pass 100%)
- [ ] Run `node test-comprehensive-diagnostics.js` (database validation)
- [ ] Set environment variables in your hosting platform (Vercel/Render)
- [ ] Test email functionality after deployment

## 📚 DOCUMENTATION

All database documentation is in:
- `DATABASE-COMPLETE.md` - Comprehensive database docs
- `test-comprehensive-diagnostics.js` - Database testing
- `test-environment.js` - Environment validation

## ❓ NEED HELP?

**Gmail App Password Issues?**
- Ensure 2FA is enabled on your Google account
- Use https://myaccount.google.com/apppasswords (not regular Gmail settings)
- The password is 16 characters with no spaces when you copy it

**Alternative Email Providers:**
- SendGrid: Free tier 100 emails/day
- Mailgun: Free tier 5,000 emails/month
- AWS SES: Very low cost, reliable

**Database Slow?**
- First connection is slow (cold start) - normal for Render free tier
- Subsequent queries will be faster
- Consider upgrading database plan if needed
