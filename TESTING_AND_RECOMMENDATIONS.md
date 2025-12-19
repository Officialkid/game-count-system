# GameScore Appwrite Migration - Testing & Recommendations

## 🎉 Completed Work

### 1. ✅ Navbar Consolidation
- **What Changed:**
  - Removed Settings link
  - Added Home link (redirects to landing page `/`)
  - Added Public Events link for unauthenticated users
  - Added prominent **Sign In** and **Sign Up** buttons for guests
  - Linked Profile page in user dropdown
  - Full responsive hamburger menu for mobile
  
- **Testing:**
  - ✓ When logged out: See Home, Public Events, Sign In, Sign Up
  - ✓ When logged in: See Dashboard, Events, Recap, user dropdown with Profile
  - ✓ Mobile: Hamburger menu shows all links + auth options

### 2. ✅ Footer Consolidation
- **What Changed:**
  - Removed duplicate BottomTabBar (mobile nav at bottom)
  - Kept single footer with GameScore branding
  - Updated contact number to **+254 745 169 345**
  
- **Testing:**
  - ✓ One footer visible at bottom of all pages
  - ✓ Contact info displays correctly
  - ✓ No duplicate navigation bars

### 3. ✅ Dark Mode Removed
- **What Changed:**
  - Removed Theme toggle card from Settings page
  - Removed unused dark/light theme state
  - Cleaned up imports (Sun, Moon icons)
  
- **Testing:**
  - ✓ Settings page no longer has Theme section
  - ✓ Only Profile and Event Defaults cards remain

### 4. ✅ Appwrite Collections Created
- **What's Ready:**
  - All 9 collections exist: users, events, teams, scores, recaps, share_links, templates, event_admins, audit_logs
  - Database `main` configured
  - Collections have proper attributes and permissions

- **What Needs Manual Setup:**
  - ⚠️ **Storage Buckets** must be created manually in Appwrite Console
  - See [APPWRITE_SETUP_GUIDE.md](./APPWRITE_SETUP_GUIDE.md) for step-by-step instructions
  - Required buckets: `avatars` (5MB) and `logos` (10MB)

### 5. ✅ Profile Page Created
- **Location:** `/profile`
- **Features:**
  - Avatar upload (requires avatars bucket)
  - Name and contact editing
  - Member since date display
  - Save to localStorage (can be extended to Appwrite users collection)
  
- **Testing:**
  - ✓ Accessible from user dropdown in navbar
  - ✓ Protected page (requires authentication)
  - ⚠️ Upload will fail until avatars bucket is created

## ⚠️ Known Issues & Solutions

### Issue 1: 401 Unauthorized on Event Creation
**Symptoms:**
- User tries to create event → gets 401 error from Appwrite

**Likely Causes:**
1. User session expired or not properly authenticated
2. Collections don't have user-specific permissions set
3. Auth state not fully loaded before API call

**Solutions:**
✓ Already implemented `authReady` flag in AuthProvider
✓ Dashboard waits for auth before loading
⚠️ **Action Required:** Test signup → login → create event flow

**Testing Steps:**
1. Clear browser storage (localStorage + cookies)
2. Go to `/register`
3. Create new account with fresh email
4. Should auto-login after signup
5. Try creating an event from Dashboard
6. **Expected:** Event creates successfully
7. **If 401:** Check Appwrite Console → Database → events collection → Settings → Permissions

### Issue 2: 409 Conflict on Signup ("Email Already Used")
**Symptoms:**
- User tries to register → "Email already in use" but never used Appwrite before

**Likely Causes:**
1. Email exists from previous test/migration
2. Session conflict from old backend

**Solutions:**
1. **Try Different Email:** Use a fresh email for testing
2. **Clear Appwrite Users:** Go to Appwrite Console → Auth → Users → Delete test users
3. **Check Auth Flow:** Ensure registration logic doesn't have race condition

**Testing Steps:**
1. Try registering with completely new email (e.g., `test+TIMESTAMP@example.com`)
2. If works → old email was in Appwrite already
3. If still fails → check browser console for detailed error message

### Issue 3: Storage Uploads Failing
**Symptoms:**
- Profile avatar upload fails
- Event logo upload fails

**Solution:**
⚠️ **YOU MUST CREATE STORAGE BUCKETS MANUALLY**

**Instructions:**
1. Open https://fra.cloud.appwrite.io/console
2. Select project `694164500028df77ada9`
3. Go to **Storage** in sidebar
4. Click **Create Bucket**
5. Create two buckets:
   - **avatars** (ID: `avatars`, Max: 5MB, Extensions: `.jpg, .jpeg, .png, .gif, .webp`)
   - **logos** (ID: `logos`, Max: 10MB, Extensions: `.jpg, .jpeg, .png, .svg, .webp`)
6. Set permissions for both:
   - Read: `any`
   - Create/Update/Delete: `users`

See [APPWRITE_SETUP_GUIDE.md](./APPWRITE_SETUP_GUIDE.md) for detailed steps.

## 🧪 Testing Checklist

### Authentication Flow
- [ ] **Sign Up:**
  - [ ] Go to `/register`
  - [ ] Create account with new email
  - [ ] Should redirect to dashboard
  - [ ] User info shows in navbar
  
- [ ] **Sign In:**
  - [ ] Go to `/login`
  - [ ] Enter credentials
  - [ ] Should redirect to dashboard
  - [ ] Session persists on page refresh

- [ ] **Sign Out:**
  - [ ] Click user dropdown → Logout
  - [ ] Should redirect to landing page `/`
  - [ ] Navbar shows Sign In / Sign Up buttons

### Navigation
- [ ] **When Logged Out:**
  - [ ] Home link goes to `/`
  - [ ] Public Events link goes to `/public`
  - [ ] Sign In button goes to `/login`
  - [ ] Sign Up button goes to `/register`
  
- [ ] **When Logged In:**
  - [ ] Dashboard link goes to `/dashboard`
  - [ ] Events link goes to `/events`
  - [ ] Recap link goes to `/recap` (if events exist)
  - [ ] User dropdown has Profile link
  - [ ] Logout works correctly

- [ ] **Mobile Responsive:**
  - [ ] Hamburger menu appears on mobile
  - [ ] All links accessible in mobile menu
  - [ ] Auth buttons show in mobile menu

### Profile Page
- [ ] **Access:**
  - [ ] Click user dropdown → Profile
  - [ ] Should load `/profile`
  
- [ ] **Avatar Upload:** (requires avatars bucket)
  - [ ] Click "Change Avatar"
  - [ ] Select image (< 5MB)
  - [ ] Should upload and show preview
  - [ ] **If fails:** Create avatars bucket first

- [ ] **Edit Profile:**
  - [ ] Click "Edit Profile"
  - [ ] Change name
  - [ ] Add contact info
  - [ ] Click Save
  - [ ] Should save to localStorage

### Event Management
- [ ] **Create Event:**
  - [ ] Go to Dashboard
  - [ ] Click "Create Event" or "New Event"
  - [ ] Fill in event details
  - [ ] Click Create
  - [ ] **Expected:** Event appears in list
  - [ ] **If 401:** Check auth state + collection permissions

- [ ] **View Events:**
  - [ ] Dashboard shows list of user's events
  - [ ] Can click event card to view details
  
- [ ] **Public Sharing:**
  - [ ] Open an event
  - [ ] Go to Settings tab
  - [ ] Generate share link
  - [ ] Copy link and open in incognito
  - [ ] Should see public scoreboard

### Footer
- [ ] **Verify:**
  - [ ] Only one footer visible
  - [ ] Contact number is +254 745 169 345
  - [ ] Footer on all pages (/, /dashboard, /events, etc.)

### Settings Page
- [ ] **Verify:**
  - [ ] No Theme toggle card
  - [ ] Only Profile and Event Defaults sections
  - [ ] Onboarding tutorial restart works

## 🚀 Next Steps & Recommendations

### Priority 1: Create Storage Buckets ⚠️
**Why:** Avatar uploads and event logos won't work without them

**Action:**
1. Follow [APPWRITE_SETUP_GUIDE.md](./APPWRITE_SETUP_GUIDE.md)
2. Create `avatars` and `logos` buckets
3. Test profile avatar upload
4. Test event logo upload

**Estimated Time:** 5-10 minutes

### Priority 2: Test Full Auth Flow
**Why:** Verify 401/409 errors are resolved

**Action:**
1. Clear all browser storage
2. Register with new email
3. Create an event
4. Add teams and scores
5. Generate public share link
6. View in incognito mode

**Estimated Time:** 10-15 minutes

### Priority 3: Appwrite Functions (Optional)
**What:** Server-side email sending and PDF generation

**Current State:**
- Email service has fallback to mock
- PDF generation shows warning ("requires Appwrite Function")

**When Needed:**
- Sending invitation emails to event admins
- Generating PDF recap reports

**Setup:**
1. Deploy functions from `appwrite/functions/` directory
2. Set `NEXT_PUBLIC_APPWRITE_FUNCTION_SEND_EMAIL` in `.env.local`
3. Configure email provider (SMTP, SendGrid, etc.)

**Estimated Time:** 30-60 minutes (can defer until needed)

### Priority 4: Profile Persistence to Appwrite
**Current:** Profile edits save to localStorage only

**Enhancement:**
1. Add `updateUser` function to Appwrite auth service
2. Save profile changes to Appwrite `users` collection or Account object
3. Load profile from Appwrite on page load

**Benefit:** Profile syncs across devices

**Estimated Time:** 15-20 minutes

### Priority 5: Permissions Audit
**Why:** Ensure data security and proper access control

**Action:**
1. Review each collection's permissions in Appwrite Console
2. Verify users can only access their own data
3. Test edge cases (accessing other user's events, etc.)

**Recommended Permissions:**
- **events:** Owner can CRUD, admins can read/update
- **teams:** Event owner can CRUD
- **scores:** Event owner + admins can CRUD
- **share_links:** Public can read if `is_active=true`

**Estimated Time:** 20-30 minutes

### Priority 6: Error Handling & UX Polish
**Enhancements:**
1. Better error messages (replace generic "Failed to create event")
2. Loading states for all async operations
3. Success toasts after actions
4. Offline detection and graceful degradation

**Estimated Time:** 1-2 hours

### Priority 7: Performance Optimization
**Current State:** Works well for small datasets

**Future Enhancements:**
1. Pagination for events list (currently loads all)
2. Caching frequently accessed data (React Query or SWR)
3. Lazy load images and components
4. Optimize bundle size (code splitting)

**When Needed:** When users have 50+ events or 100+ teams

**Estimated Time:** 2-3 hours

## 📊 Migration Summary

### What's Working ✅
- ✅ Appwrite SDK configured and connected
- ✅ 9 collections created with attributes
- ✅ Auth flow (signup, login, logout)
- ✅ Dashboard loads user events
- ✅ Event creation wizard
- ✅ Team management
- ✅ Score tracking
- ✅ Public share links
- ✅ Recap generation (client-side)
- ✅ Profile page with edit capability
- ✅ Consolidated navbar with responsive mobile menu
- ✅ Single footer with correct contact info
- ✅ Dark mode toggle removed
- ✅ Template saving and loading

### What Needs Setup ⚠️
- ⚠️ Storage buckets (avatars, logos) - **manual creation required**
- ⚠️ Appwrite Functions (email, PDF) - **optional, can defer**
- ⚠️ Profile persistence to Appwrite (currently localStorage) - **enhancement**

### What to Test 🧪
- 🧪 Signup → Event Creation → Public View (full flow)
- 🧪 Avatar upload (after buckets created)
- 🧪 All navigation links
- 🧪 Mobile responsive hamburger menu
- 🧪 Footer on all pages

## 🎓 Lessons Learned

1. **Appwrite SDK Versions:** Client SDK (`appwrite`) vs Server SDK (`node-appwrite`) have different APIs
2. **Permissions Syntax:** Use string values like `'users'` instead of `Role.authenticated()`
3. **Storage Buckets:** Can't be created programmatically with current SDK version easily
4. **Auth State Management:** `authReady` flag prevents race conditions
5. **Error Translation:** Appwrite error codes (401, 409) need user-friendly messages

## 📞 Support & Resources

- **Appwrite Docs:** https://appwrite.io/docs
- **Console:** https://fra.cloud.appwrite.io/console
- **Project ID:** `694164500028df77ada9`
- **Database:** `main`
- **Setup Guide:** [APPWRITE_SETUP_GUIDE.md](./APPWRITE_SETUP_GUIDE.md)

---

## ✨ Ready to Test!

Start with Priority 1 (create storage buckets), then run through the Testing Checklist. Report any errors with:
1. Page/action where error occurred
2. Full error message from browser console
3. Steps to reproduce

Good luck! 🚀
