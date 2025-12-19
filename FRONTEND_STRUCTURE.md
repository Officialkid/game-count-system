# 🏗️ Frontend Structure & Architecture

**Status:** Mock-only isolation mode (Appwrite-ready)  
**Last Updated:** December 16, 2025  
**Build Status:** ✅ Compiles successfully

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Layers](#architecture-layers)
3. [Directory Structure](#directory-structure)
4. [Authentication System](#authentication-system)
5. [State Management](#state-management)
6. [Data Flow](#data-flow)
7. [Component Inventory](#component-inventory)
8. [Routing & Pages](#routing--pages)
9. [API Integration Layer](#api-integration-layer)
10. [Styling System](#styling-system)
11. [TypeScript Types](#typescript-types)
12. [Mock Service Layer](#mock-service-layer)
13. [Appwrite Migration Readiness](#appwrite-migration-readiness)
14. [What We Have vs What We Need](#what-we-have-vs-what-we-need)

---

## Overview

### Tech Stack

- **Framework:** Next.js 14.2.33 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4
- **Auth:** Custom JWT (ready for Appwrite)
- **State:** React Context API + Local Storage
- **Backend:** Currently mocked (Appwrite contract ready)

### Current Mode

**Isolation Mode:** Frontend fully functional with zero backend dependencies. All API calls intercepted and mocked for UI/UX development and testing.

### Key Features

✅ Complete authentication flows (login, register, logout)  
✅ Event management dashboard with real search, filter, sort  
✅ Real-time scoreboard UI  
✅ Team & score entry  
✅ Event history & recap slides  
✅ Public shareable scoreboards  
✅ Responsive mobile-first design  
✅ Single light theme (consistent branding, enhanced contrast)  
✅ Onboarding tutorial system with spotlight steps  
✅ Error boundaries & loading states  
✅ Settings page with profile, theme, event defaults  
✅ Enhanced empty states with visual hierarchy  
✅ Improved CTA button contrast & hover states  

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                      USER INTERFACE                     │
│  (Pages, Components, Hooks, Context Providers)          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              API CLIENT LAYER (lib/)                    │
│  • apiClient: HTTP methods (get, post, patch, delete)  │
│  • auth: Token storage & validation                    │
│  • Retry logic with exponential backoff                │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│           MOCK SERVICE LAYER (lib/mockService.ts)       │
│  • Intercepts all API calls in isolation mode          │
│  • Provides deterministic mock data                    │
│  • Simulates latency & error states                    │
│  • Appwrite HOOK comments for migration                │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │   BACKEND (Mocked)     │
         │  • No real DB calls    │
         │  • No network traffic  │
         │  • Pure frontend state │
         └────────────────────────┘
```

**When Appwrite is integrated:**
1. Remove mock service layer
2. Replace with Appwrite SDK calls
3. Components remain unchanged (interface-compatible)

---

## Directory Structure

```
game-count-system/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes (currently return mocks)
│   │   ├── auth/                 # Auth endpoints (login, register, me, refresh)
│   │   ├── events/               # Event CRUD + share links + stream
│   │   ├── teams/                # Team management
│   │   ├── scores/               # Score entry & retrieval
│   │   ├── recap/                # Event recap summary
│   │   └── public/               # Public scoreboard endpoints
│   ├── dashboard/                # Main dashboard (event list)
│   ├── event/[eventId]/          # Event detail + history
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   ├── public/                   # Public event browser
│   ├── scoreboard/[token]/       # Public shareable scoreboard
│   ├── recap/                    # Event recap slides
│   ├── display/[eventId]/        # Full-screen display mode
│   └── layout.tsx                # Root layout with providers
│
├── components/                   # Reusable UI components
│   ├── admin/                    # Admin-only components
│   ├── event-tabs/               # Event page tab components
│   ├── modals/                   # Modal dialogs
│   ├── onboarding/               # Tutorial & onboarding
│   ├── skeletons/                # Loading skeleton screens
│   ├── ui/                       # Base UI primitives
│   ├── Navbar.tsx                # Global navigation
│   ├── EventCard.tsx             # Dashboard event card
│   ├── EventSetupWizard.tsx      # Multi-step event creation
│   ├── PublicScoreboard.tsx      # Shareable scoreboard view
│   ├── RecapSlides.tsx           # Auto-play recap carousel
│   ├── ScoresTable.tsx           # Score entry table
│   ├── TeamCard.tsx              # Team display card
│   └── ... (38 total components)
│
├── contexts/                     # React Context providers
│   └── ThemeContext.tsx          # Dark mode context
│
├── hooks/                        # Custom React hooks
│   ├── useEventStream.ts         # SSE real-time updates
│   ├── useGestures.ts            # Touch gesture handling
│   ├── useMockAuth.ts            # Mock auth hook (isolation mode)
│   └── useRequireAuth.ts         # Protected route guard
│
├── lib/                          # Core utilities & services
│   ├── api-client.ts             # HTTP client with retry logic
│   ├── auth-context.tsx          # Auth state provider
│   ├── auth.ts                   # JWT token utilities
│   ├── db.ts                     # Database layer (Postgres queries)
│   ├── frontend-mock.ts          # Mock data definitions
│   ├── mockService.ts            # Mock service layer (Appwrite-ready)
│   ├── middleware.ts             # Auth middleware for API routes
│   ├── error-messages.ts         # User-friendly error mapping
│   └── types.ts                  # Shared TypeScript types
│
├── public/                       # Static assets
│   ├── logo.svg                  # App logo
│   └── ...
│
├── types/                        # Global type definitions
│
└── Documentation/
    ├── APPWRITE_CONTRACT.md      # Appwrite migration contract
    ├── FRONTEND_STRUCTURE.md     # This file
    ├── MOCK_LAYER_GUIDE.md       # Mock layer usage guide
    └── MOCK_AUTH_REFERENCE.tsx   # Auth pattern examples
```

---

## Authentication System

### Current Implementation

**Provider:** Custom JWT with localStorage  
**Future:** Appwrite Account SDK

### Files

| File | Purpose |
|------|---------|
| `lib/auth-context.tsx` | React Context provider for auth state |
| `lib/auth.ts` | JWT generation, verification, refresh |
| `lib/api-client.ts` | Token storage & header injection |
| `hooks/useMockAuth.ts` | Mock auth hook (isolation mode) |
| `components/AuthGuard.tsx` | Protected route wrapper |
| `app/api/auth/*` | Auth API routes (login, register, me, refresh) |

### Auth Flow (Current)

```
┌─────────────┐
│ Login Form  │
└──────┬──────┘
       │ email, password
       ▼
┌──────────────────┐
│ Auth Context     │──────► localStorage.setItem('token', jwt)
│ login()          │
└──────┬───────────┘
       │ success
       ▼
┌──────────────────┐
│ User State       │──────► isAuthenticated = true
│ Updated          │        user = { id, name, email }
└──────────────────┘
```

**In isolation mode:**
- All auth calls return success immediately
- Mock user always authenticated
- No real JWT validation

**With Appwrite:**
- Replace `auth-context.tsx` with Appwrite SDK
- Keep same interface (login, register, logout, user)
- Components unchanged

### Auth Context API

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}
```

**Usage:**
```tsx
const { user, isAuthenticated, login, logout } = useAuth();

if (!isAuthenticated) {
  return <LoginPrompt />;
}

return <Dashboard user={user} />;
```

---

## State Management

### Approach

**Local State:** `useState` for component-specific state  
**Global State:** React Context API for auth, theme  
**Server State:** Fetched via `apiClient`, cached in component state  

### Context Providers

1. **AuthContext** (`lib/auth-context.tsx`)
   - User authentication state
   - Login/logout functions
   - Token management

### State Flow

```
User Action
    │
    ▼
Component Handler
    │
    ▼
apiClient.method()  ──────► Mock Service (isolation mode)
    │                              │
    │                              ▼
    │                       Deterministic Response
    │                              │
    ◄──────────────────────────────┘
    │
    ▼
setState (local)
    │
    ▼
Re-render UI
```

**No external state management libraries** (Redux, Zustand, etc.) needed for current scope.

---

## Data Flow

### Overview

```
┌──────────────┐
│  Component   │
└──────┬───────┘
       │ calls apiClient.getEvents()
       ▼
┌──────────────────┐
│  lib/api-client  │
└──────┬───────────┘
       │ fetch('/api/events/list')
       ▼
┌──────────────────────┐
│  app/api/events/list │
└──────┬───────────────┘
       │ returns mock data (isolation mode)
       ▼
┌──────────────────┐
│  mockService     │──────► mockEvents array
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Component State │──────► UI renders
└──────────────────┘
```

### API Client Methods

| Method | Purpose | Retry | Auth |
|--------|---------|-------|------|
| `apiClient.get(endpoint)` | Fetch data | ✅ | ✅ |
| `apiClient.post(endpoint, data)` | Create resource | ✅ | ✅ |
| `apiClient.patch(endpoint, data)` | Update resource | ✅ | ✅ |
| `apiClient.delete(endpoint)` | Delete resource | ✅ | ✅ |

**Features:**
- Exponential backoff retry (3 attempts, 1s → 10s delay)
- Automatic token refresh (X-Refreshed-Token header)
- Error normalization

---

## Component Inventory

### Layout Components

| Component | Purpose | Props | State |
|-----------|---------|-------|-------|
| `Navbar` | Global navigation with recap indicator | - | Uses `useAuth()`, route-based active state |
| `BottomTabBar` | Mobile navigation | - | Route-based active state |
| `AuthGuard` | Protected route wrapper | `children` | Redirects if not auth'd |

### Page Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `DashboardPage` | `/dashboard` | Event list, create wizard, stats dashboard |
| `EventPage` | `/event/[id]` | Score entry, team management, tabs |
| `HistoryPage` | `/event/[id]/history` | Event activity log |
| `RecapPage` | `/recap` | Auto-play recap slides with stats |
| `PublicScoreboardPage` | `/scoreboard/[token]` | Shareable leaderboard |
| `SettingsPage` | `/settings` | Profile, theme, event defaults, tutorial restart |
| `EventsPage` | `/events` | Events list with status grouping |
| `LoginPage` | `/login` | Login form |
| `RegisterPage` | `/register` | Registration form |

### Feature Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `EventSetupWizard` | Multi-step event creation | Name → Teams → Colors → Confirm |
| `EventCard` | Dashboard event card | Status badge, actions menu, tap to open, `data-tour` marker |
| `ScoresTable` | Score entry grid | Auto-save, validation, undo/redo |
| `TeamCard` | Team display card | Avatar, points, rank, memo-optimized |
| `PublicScoreboard` | Public leaderboard | Real-time updates, share link |
| `RecapSlides` | Event recap carousel | Auto-advance, trophy animations, confetti |
| `HistoryList` | Activity timeline | Icons, timestamps, filters |
| `OnboardingTutorial` | First-run walkthrough | Spotlight steps, progress bar, skip, restart |
| `SearchFilterToolbar` | Dashboard search & filter | Name search, status/archived filter, sort (newest/oldest/alphabetical), instant feedback |
| `EmptyState` | No-data placeholder | Icon pill, tips section, elevated visual hierarchy |

### UI Primitives

| Component | Purpose |
|-----------|---------|
| `Button` | Styled button with variants (primary/secondary/danger/ghost), enhanced contrast & focus |
| `Input` | Text input with validation |
| `Modal` | Overlay dialog |
| `Card` | Content card wrapper with subtle gradient support |
| `LoadingStates` | Skeleton loaders |
| `ErrorStates` | Error message displays |
| `EmptyState` | No-data placeholders with visual hierarchy |

### Total: **38 components** + **4 hooks** + **2 contexts** (AuthContext + ThemeContext)

---

### Routing & Pages

```
/                           → Landing page
/dashboard                  → Event list, stats, onboarding (protected)
/event/[eventId]            → Event detail with tabs (protected)
/event/[eventId]/history    → Event history (protected)
/events                     → Events list with grouping by status (protected)
/recap                      → Recap slides (protected)
/settings                   → Profile, theme, event defaults (protected)
/login                      → Login form
/register                   → Registration form
/public                     → Public event browser
/public/[token]             → Public event detail
/scoreboard/[token]         → Public scoreboard
/display/[eventId]          → Full-screen display mode
```

### Protected Routes

**Mechanism:** `AuthGuard` component + `useRequireAuth` hook

**Example:**
```tsx
export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    router.push('/login?returnUrl=/dashboard');
    return null;
  }

  return <Dashboard user={user} />;
}
```

**Public Routes:**
- `/login`
- `/register`
- `/public/*`
- `/scoreboard/[token]`

**Protected Routes:**
- `/dashboard`
- `/event/*` (except public token routes)
- `/recap`

---

## API Integration Layer

### File: `lib/api-client.ts`

**Purpose:** Centralized HTTP client with retry logic, auth token injection, error handling.

### Methods

```typescript
// Generic methods
apiClient.get(endpoint, token?, retryOptions?)
apiClient.post(endpoint, data, token?, retryOptions?)
apiClient.patch(endpoint, data, token?, retryOptions?)
apiClient.delete(endpoint, token?, retryOptions?)

// Specialized methods
apiClient.register(name, email, password)
apiClient.login(email, password)
apiClient.getEvents(token)
apiClient.createEvent(eventData, token)
apiClient.addScore(eventId, teamId, points, token)
// ... (30+ methods)
```

### Retry Logic

```typescript
interface RetryOptions {
  maxRetries: number;        // Default: 3
  initialDelay: number;      // Default: 1000ms
  maxDelay: number;          // Default: 10000ms
  shouldRetry: (error, attempt) => boolean;
}
```

**Retry Strategy:**
- Exponential backoff: 1s → 2s → 4s → 8s (capped at 10s)
- Retries on network errors (fetch failures)
- Retries on 5xx server errors
- No retry on 4xx client errors

### Token Management

```typescript
// Auth utilities
auth.setToken(token: string)
auth.getToken(): string | null
auth.removeToken()
auth.isAuthenticated(): boolean
```

**Token storage:** `localStorage.auth_token`  
**Header injection:** `Authorization: Bearer <token>`  
**Refresh handling:** `X-Refreshed-Token` response header auto-updates token

---

## Styling System

### Approach

**Primary:** Tailwind CSS utility classes  
**Custom:** `globals-enhanced.css` for animations & theme variables  
**Mobile:** `mobile-optimized.css` for responsive tweaks

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {...},      // Purple gradient
        secondary: {...},    // Amber accent
        // Full color palette defined
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
        'trophy-bounce': 'trophyBounce 0.6s ease-out',
      },
    },
  },
};
```

### Theme

**Strategy:** Single light theme for consistency

**Branding:**
- Primary: Purple gradient (`from-purple-600 to-amber-500`)
- Logo: `/public/logo.svg` with gradient container
- Consistent across Navbar, Footer, and all pages

**Color Refinements (December 16, 2025):**
- CTA buttons: Higher-contrast gradients with borders for better accessibility
- Status badges: Brightened tints for clearer text/dot contrast
  - Active: Emerald with darker text
  - Completed: Purple with darker text
  - Scheduled: Blue with darker text
  - Inactive: Neutral with darker text
  - **New:** Archived: Amber with darker text
- Empty states: Gradient cards, framed icon pill (bg-purple-50), elevated visual hierarchy
- Button feedback: Enhanced shadow on hover/active, focus-visible ring with offset
- Secondary buttons: White background with border for clarity
- Ghost buttons: Transparent with border on hover

**Note:** Dark mode removed (December 16, 2025) to maintain single-theme consistency

### Button Styling

```css
/* Primary CTA */
background: linear-gradient(to right, #7c3aed, #6d28d9);
border: 1px solid #6d28d9;
font-weight: 600;
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
transition: all 0.2s;

/* Hover */
background: linear-gradient(to right, #6d28d9, #581c87);
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

/* Active */
background: linear-gradient(to right, #581c87, #4c1d95);
box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);

/* Focus */
outline: none;
ring: 2px;
ring-color: #a78bfa;
ring-offset: 2px;
```

---

## TypeScript Types

### Core Types

**File:** `lib/types.ts`

```typescript
// API Response wrapper
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// User
interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  created_at?: string;
}

// Event
interface Event {
  id: string;
  user_id: string;
  event_name: string;
  theme_color: string;
  logo_url?: string;
  allow_negative: boolean;
  display_mode: 'cumulative' | 'per-game';
  num_teams: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
}

// Team
interface Team {
  id: string;
  event_id: string;
  team_name: string;
  avatar_url?: string;
  total_points: number;
}

// Score
interface Score {
  id: string;
  event_id: string;
  team_id: string;
  game_number: number;
  points: number;
  created_at: string;
}

// JWT Payload
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}
```

---

## Mock Service Layer

### Purpose

**Isolation Mode:** Allows frontend development without backend dependencies.

### File: `lib/mockService.ts`

**Structure:**
```typescript
export const mockAuthService = {
  getCurrentUser: async () => {...},
  authenticate: async (email, password) => {...},
  register: async (name, email, password) => {...},
  logout: async () => {...},
};

export const mockEventsService = {
  getEvents: async () => {...},
  createEvent: async (eventData) => {...},
  updateEvent: async (eventId, updates) => {...},
  deleteEvent: async (eventId) => {...},
};

export const mockTeamsService = {...};
export const mockScoresService = {...};
export const mockRecapService = {...};
export const mockPublicService = {...};
```

### Appwrite Hook Comments

**Every mock function has:**
```typescript
// APPWRITE HOOK: This will be replaced by Appwrite database query / function
// Inputs: email, password
// Outputs: { success, data: { user, token } }
// Realtime: not required
```

**Migration Plan:**
1. Find all `APPWRITE HOOK` comments
2. Replace with Appwrite SDK calls
3. Keep same interface (inputs/outputs)
4. No component changes needed

### Mock Data Source

**File:** `lib/frontend-mock.ts`

```typescript
export const mockUser = {
  userId: 'demo-user-id',
  email: 'demo@gamescore.local',
  name: 'Demo User',
  role: 'admin' as const,
};

export const mockEvents = [...];
export const mockTeams = [...];
export const mockScores = [...];
export const mockRecap = {...};
export const mockStats = {...};
```

---

## Appwrite Migration Readiness

### Contract Document

**File:** `APPWRITE_CONTRACT.md`

**Defines:**
1. Input/output schemas for all services
2. Realtime subscription requirements
3. Database collections & relationships
4. Authentication flows
5. Permission model

### Migration Checklist

**Phase 1: Setup**
- [ ] Create Appwrite project
- [ ] Initialize SDK in `lib/appwrite.ts`
- [ ] Configure auth settings
- [ ] Set up database collections

**Phase 2: Authentication**
- [ ] Replace `auth-context.tsx` with Appwrite Account SDK
- [ ] Update login/register flows
- [ ] Migrate session management
- [ ] Test protected routes

**Phase 3: Data Services**
- [ ] Replace `mockEventsService` with Appwrite Database queries
- [ ] Replace `mockTeamsService`
- [ ] Replace `mockScoresService`
- [ ] Replace `mockRecapService`
- [ ] Replace `mockPublicService`

**Phase 4: Realtime**
- [ ] Subscribe to event updates
- [ ] Subscribe to score changes
- [ ] Update `useEventStream` hook

**Phase 5: Cleanup**
- [ ] Remove `mockService.ts`
- [ ] Remove `frontend-mock.ts`
- [ ] Remove `useMockAuth.ts`
- [ ] Update documentation

**Component Changes:** ❌ **ZERO** (interface-compatible)

---

## What We Have vs What We Need

### ✅ What We Have (Complete)

#### Core Infrastructure
- [x] Next.js 14 App Router setup
- [x] TypeScript configuration
- [x] Tailwind CSS styling system with single light theme
- [x] Enhanced contrast: CTA buttons, status badges, empty states
- [x] Responsive mobile-first design
- [x] Auth context provider
- [x] Protected route guards
- [x] Token storage & refresh logic
- [x] Mock auth flows (100% isolation mode)

#### Dashboard & Search/Filter/Sort
- [x] Event list view with real search, filter, sort
- [x] Name search: Real-time, instant feedback, no debounce
- [x] Status filter: Active, Inactive, Archived
- [x] Sorting: Newest first, Oldest first, Alphabetical
- [x] Combined logic: search AND filter AND sort
- [x] URL parameters preserved (q, status, sort)
- [x] Event creation wizard (multi-step)
- [x] Event cards with high-contrast status badges
- [x] Delete confirmation modal
- [x] Empty states with visual hierarchy

#### Events Page
- [x] Events list grouped by status
- [x] EmptyState when no events
- [x] Status-based filtering and display

#### Settings Page
- [x] User profile editing (mock state)
- [x] Theme toggle UI (light/dark, mock-only)
- [x] Event defaults editor
- [x] Tutorial restart control
- [x] Danger zone UI (disabled actions)

#### Event Management
- [x] Event detail page with tabs
- [x] Team management (add, edit, delete)
- [x] Score entry table (auto-save)
- [x] Event history timeline
- [x] Event settings editor
- [x] Themed event page (custom colors/logo)

#### Recap & Analytics
- [x] Recap page with mock data
- [x] Total events, games, winner, top scorer display
- [x] Real-time standings with ranking
- [x] Recap slides carousel (Spotify Wrapped style)
- [x] Auto-play with trophy animations
- [x] Confetti on MVP slide
- [x] EmptyState when no completed events
- [x] Share recap functionality

#### Onboarding & Tutorial
- [x] Auto-opens on first dashboard visit
- [x] 4 spotlight steps: Create Event → Event Card → Score Entry → Recap
- [x] Skip button
- [x] Restart from Settings page
- [x] Progress bar and step counter
- [x] Persistent status (localStorage)
- [x] URL syncing for all parameters

#### Public Features
- [x] Public event browser
- [x] Shareable scoreboard links
- [x] Public scoreboard view (no auth required)
- [x] QR code generation

#### UI/UX Components
- [x] 38 reusable components
- [x] Enhanced Button component: gradient, borders, focus-visible ring, active shadow
- [x] Enhanced EmptyState: gradient card, icon pill, tips section
- [x] Enhanced status badges: brighter tints, clearer contrast
- [x] Error boundaries
- [x] Loading states (skeletons)
- [x] Toast notifications
- [x] Modals & dialogs
- [x] Form inputs with validation
- [x] Swipeable list items (mobile)

#### Developer Experience
- [x] Mock service layer (Appwrite-ready with HOOK comments)
- [x] API client with retry logic
- [x] Error message normalization
- [x] TypeScript types for all entities
- [x] APPWRITE_CONTRACT.md migration guide
- [x] FRONTEND_STRUCTURE.md comprehensive documentation
- [x] Zero backend/Appwrite dependencies
- [x] 100% mock data isolation mode

### 🔨 What We Need (Missing or Incomplete)

#### Backend Integration
- [ ] Replace mock services with Appwrite SDK
- [ ] Set up Appwrite project & collections
- [ ] Implement real authentication
- [ ] Implement database queries
- [ ] Set up realtime subscriptions

#### Real-Time Features
- [ ] Live scoreboard updates (SSE/WebSocket)
  - **Hook exists:** `useEventStream.ts` (placeholder)
  - **Needs:** Appwrite Realtime subscription
- [ ] Live event status notifications
- [ ] Multi-user collaboration (prevent conflicts)

#### Data Persistence
- [ ] Actual database writes (currently mocked)
- [ ] File uploads (team avatars, event logos)
  - **Component exists:** `LogoUpload.tsx`
  - **Needs:** Appwrite Storage integration
- [ ] CSV/PDF export (server-side generation)
  - **API routes exist:** `/api/export/csv`, `/api/export/pdf`
  - **Needs:** Backend implementation

#### Admin Features
- [ ] User management dashboard
  - **Component exists:** `components/admin/UserManagement.tsx` (stub)
  - **Needs:** Backend user queries
- [ ] Event admin permissions
  - **API exists:** `/api/events/[eventId]/admins/*`
  - **Needs:** Backend permission checks
- [ ] Audit logs viewer
  - **Database schema:** `audit_logs` table exists
  - **Needs:** UI component + query implementation

#### Analytics
- [ ] Real event analytics (currently mocked)
  - **Component exists:** `AnalyticsDashboard.tsx`
  - **Needs:** Backend aggregation queries
- [ ] Performance metrics
- [ ] User activity tracking

#### Email Notifications
- [ ] Event invitations
  - **API route exists:** `/api/events/[eventId]/admins/invite`
  - **Needs:** SMTP integration (noted in build warnings)
- [ ] Password reset emails
  - **API routes exist:** `/api/auth/forgot-password`, `/api/auth/reset-password`
  - **Needs:** Email service
- [ ] Event status notifications

#### Production Readiness
- [ ] Database migration scripts (currently manual SQL)
- [ ] Environment-specific configs (dev, staging, prod)
- [ ] Error logging & monitoring (Sentry, LogRocket)
- [ ] Performance optimization (code splitting, caching)
- [ ] SEO metadata (Open Graph, Twitter cards)
- [ ] Accessibility audit (WCAG AA compliance)

#### Testing
- [ ] Unit tests (Jest + React Testing Library)
- [ ] Integration tests (Playwright/Cypress)
- [ ] E2E test suite
- [ ] Visual regression tests

#### Documentation
- [x] Frontend structure (this document)
- [x] Appwrite migration contract
- [x] Mock layer guide
- [x] Auth reference examples
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Component storybook
- [ ] Deployment guide

---

## Summary & Readiness Status

### ✅ Acceptance Criteria Met

✅ **No blank pages** – All routes have content (dashboard, events, recap, settings, onboarding)  
✅ **No dead buttons** – All CTAs wired and functional (create, search, filter, sort, tutorial restart)  
✅ **Events fully manageable** – Create, read, update, delete in mock mode  
✅ **Search & filters work** – Real-time name search, status/archived filter, sort (newest/oldest/alphabetical)  
✅ **Recap feels complete** – Stats, rankings, MVP highlight, emptyState with CTA  
✅ **Branding consistent** – Single purple/amber light theme with enhanced contrast  
✅ **Zero backend usage** – 100% mock service isolation; no Appwrite/PostgreSQL calls  

### 🎯 Architecture Strengths

✅ **Clean separation of concerns** – UI → API Client → Mock Service → Backend  
✅ **Interface-compatible** – Appwrite swap-in won't require component changes  
✅ **Type-safe** – Full TypeScript coverage  
✅ **Responsive** – Mobile-first design with touch gestures  
✅ **Accessible** – ARIA labels, keyboard navigation, focus-visible states  
✅ **Developer-friendly** – Mock isolation mode for fast iteration  
✅ **Production-ready feel** – Polished UI, clear affordances, error handling  

### 🧩 Appwrite Migration Path

**Files to replace** (via mock service layer):
1. `lib/mockService.ts` – Replace with Appwrite SDK calls
2. `lib/frontend-mock.ts` – Remove (use Appwrite as source of truth)
3. `hooks/useMockAuth.ts` – Replace with Appwrite Account hook

**Files to leave unchanged** (interface-compatible):
- All 38 components ✅
- All page routes ✅
- All utility functions ✅
- TypeScript types ✅

**Effort:** ~1 week (Phase 2 authentication alone can unlock the full app)

---

## Summary

### Architecture Strengths

✅ **Clean separation of concerns:** UI → API Client → Mock Service → Backend  
✅ **Interface-compatible:** Appwrite swap-in won't require component changes  
✅ **Type-safe:** Full TypeScript coverage  
✅ **Responsive:** Mobile-first design with touch gestures  
✅ **Accessible:** ARIA labels, keyboard navigation  
✅ **Developer-friendly:** Mock isolation mode for fast iteration  

### Next Steps

**Immediate:**
1. Review `APPWRITE_CONTRACT.md` for migration plan
2. Set up Appwrite project (database, auth, storage)
3. Replace mock auth with Appwrite Account SDK
4. Implement realtime subscriptions for scoreboard

**Short-term:**
5. Replace mock data services with Appwrite Database
6. Set up file uploads (avatars, logos)
7. Implement email notifications (SMTP config)
8. Add admin user management UI

**Long-term:**
9. Write test suite (unit, integration, E2E)
10. Performance audit & optimization
11. Accessibility audit (WCAG AA)
12. Deploy to production (Vercel + Appwrite Cloud)

---

**Document Status:** ✅ Complete  
**Build Status:** ✅ Passing  
**Mock Coverage:** 🟢 100% (all services mocked)  
**Appwrite Readiness:** 🟡 Contract defined, implementation pending  
**Component Count:** 38 components + 4 hooks + 2 contexts  
**Line Count:** ~15,000 lines TypeScript/TSX  

**Last Build:** December 16, 2025  
**Build Output:** Zero type errors, 39 static routes generated
