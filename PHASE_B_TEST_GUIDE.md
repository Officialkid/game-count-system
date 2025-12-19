/**
 * Phase B - Authentication Manual Test Guide
 *
 * Prerequisites:
 * 1. Database and collections created in Appwrite
 * 2. Users collection permissions allow "Create: Users"
 * 3. NEXT_PUBLIC_USE_APPWRITE=true in .env.local
 * 4. Dev server running: npm run dev
 */

// Test 1: Register a new user via UI
// ===================================
// 1. Navigate to http://localhost:3000/register
// 2. Fill form:
//    - Name: "Test User"
//    - Email: "test@example.com"
//    - Password: "SecurePassword123"
// 3. Click "Register"
// Expected: ✅ Success, redirect to /dashboard, user displayed in Navbar

// Test 2: Login with registered user
// ====================================
// 1. Click "Logout" in navbar (or navigate to /login)
// 2. Fill form:
//    - Email: "test@example.com"
//    - Password: "SecurePassword123"
// 3. Click "Login"
// Expected: ✅ Success, redirect to /dashboard

// Test 3: Session persistence on page refresh
// =============================================
// 1. After login, refresh the page (Cmd+R or Ctrl+R)
// 2. Wait for authReady flag to be true
// Expected: ✅ Still logged in, user visible in navbar (no loading flash)

// Test 4: Logout clears session
// ==============================
// 1. Click "Logout" in navbar
// Expected: ✅ Logged out, redirect to /login

// Test 5: Protected route access
// ===============================
// 1. Try to navigate to /dashboard without logging in
// Expected: ✅ Redirected to /login

// Test 6: Error handling (invalid credentials)
// =============================================
// 1. Navigate to /login
// 2. Enter invalid email or password
// 3. Click "Login"
// Expected: ✅ Error message displayed (e.g., "Invalid email or password")

// Test 7: Error handling (duplicate email on register)
// =====================================================
// 1. Register with an existing email
// Expected: ✅ Error message displayed (e.g., "Email already in use")

// Integration Test: User object shape matches expectations
// =========================================================
// In browser console after login:
// > const { user } = useAuth();
// > console.log(user);
// Expected output shape:
// { id: "...", name: "Test User", email: "test@example.com" }

// Security Checklist
// ==================
// ✅ No localStorage.auth_token (Appwrite session-based)
// ✅ No JWT token exposed in JS console
// ✅ Session cookie HttpOnly (Appwrite default)
// ✅ No "Authorization: Bearer" headers in network requests
// ✅ AuthContext.token === null in Appwrite mode (mock mode uses JWT token)

// Debugging Tips
// ==============
// 1. Check if NEXT_PUBLIC_USE_APPWRITE=true in browser devtools → Console
//    > process.env.NEXT_PUBLIC_USE_APPWRITE
// 2. Verify Appwrite endpoint in network tab (no CORS errors expected)
// 3. Check Appwrite Console → Auth for created users
// 4. Use browser devtools → Application → Cookies to inspect session cookie

// Expected Differences vs Mock Mode
// ==================================
// Mock Mode:
// - Logs in instantly, no network delay
// - No email validation
// - User always "Demo User"
// - Session in localStorage + cookie
//
// Appwrite Mode:
// - Network request to Appwrite (slight delay)
// - Email validation enforced
// - Custom user name from registration
// - Session in httpOnly cookie (secure)
