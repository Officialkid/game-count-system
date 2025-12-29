# GameScore System Explanation

> **Deep, technical documentation for Project Owners, Developers, and Auditors.**  
> **Last Updated:** December 28, 2025 (Post-Cleanup)  
> This explains what exists, why it exists, and how it works after removing all redundant, backend-like, and non-Appwrite-BaaS-compliant files.


## 1️⃣ System Overview

**Purpose:** GameScore is a real‑time game scoring and presentation system for multi‑team events. It supports live score updates, team rankings, day-based aggregation, and a Recap ("Wrapped") presentation with animations.

**Architecture Philosophy:** Pure Appwrite BaaS. No custom backend server. No client-side rate limiting. No custom session/JWT management. Frontend trusts Appwrite for all backend responsibilities.

**Modes:**
- **Live mode:** Hosts/admins create events and teams, enter scores, and share a live public scoreboard.
- **Recap/Wrapped mode:** Generates a sequenced, animated story (slides) revealing highlights, rankings, and end‑of‑event insights.
- **Admin/Host controls:** Authenticated users access a dashboard to manage events, teams, and scoring.

**User interaction (simplified):**
- Unauthenticated visitors can view public scoreboards and marketing/public pages.
- Authenticated users (hosts) manage events and scores via the dashboard.
- The recap mode is viewable post‑event or on demand via recap routes or within event views.


## 2️⃣ Architecture Overview

**Frontend (Next.js 14 + React 18 + TypeScript + Tailwind):**
- Pages under `app/` implement routing for dashboard, events, displays, recap, and public scoreboards.
- Components under `components/` implement UI, modals, recap players, inputs, and reusable primitives.
- State and domain logic live under `lib/` (auth context, services, score logic, utils, and hooks).
- Real‑time updates are handled by **Appwrite Realtime** and exposed through services/hooks.

**Backend (Appwrite Cloud):**
- **Authentication and sessions** (`Account` SDK) — Appwrite manages all sessions, tokens, and user identity.
- **Databases and collections** for events, teams, scores, share links, recaps.
- **Storage** for images (team logos, assets).
- **Functions** for server-side tasks: `submitScoreHandler`, `generateRecap`, `logAudit`.
- **Realtime** for broadcasting document changes to clients.

**Data flow (scores → realtime → UI → recap):**
1. Host submits or updates a score (Dashboard/Scoring UI → Appwrite Databases).
2. Appwrite emits realtime events for changed documents.
3. Frontend services subscribe and update local state via hooks.
4. UI re‑renders, recomputing rankings via `lib/score-logic.ts`.
5. Recap builds slides from historical and summary data for presentation.

**Why Appwrite:**
- Single managed backend: auth, DB, storage, functions, and realtime fit the use‑case without running custom servers.
- SDK available for browser; clean integration with Next.js.
- **Eliminates need for:** custom rate limiting, JWT verification, session management, monitoring infrastructure.

**Realtime (conceptual):**
- Client subscribes to collections (e.g., scores for an event).
- On `create/update/delete`, services transform payloads into domain updates.
- UI state is kept consistent with backend; no manual refresh required.


## 3️⃣ Project Root Structure

Below is the root of `game-count-system` and each item’s role:

### /app
- Type: Frontend
- Purpose: Next.js App Router pages, global styles, and layout.
- Why: Routing and page composition for dashboard, events, public views, recap, etc.

### /components
- Type: Frontend
- Purpose: UI components (inputs, cards, modals), feature components (recap player), and guard wrappers.
- Why: Reusable, composable building blocks for pages and features.

### /lib
- Type: Frontend Utility + Backend integration client side
- Purpose: Appwrite client setup, auth context, services, score logic, utilities, hooks.
- Why: Encapsulate domain logic and external APIs cleanly away from UI.

### /appwrite
- Type: Appwrite Config/Backend Functions
- Purpose: Appwrite project configuration (`appwrite.json`) and Cloud Functions (score submission, recap generation, audit logging).
- Why: Server‑side capabilities living inside Appwrite.

### /public
- Type: Frontend Assets
- Purpose: Static assets (images, icons).
- Why: Delivered by Next.js for branding and UI.

### /tests
- Type: Testing (Unit + E2E)
- Purpose: Jest unit tests for services; Playwright E2E for flows.
- Why: Ensure quality of domain logic and critical flows (login, dashboard).

### Key Configs
- `package.json`: scripts and deps.
- `next.config.js`: Next.js configuration.
- `jest.config.js`, `jest.setup.js`: Unit testing setup.
- `playwright.config.ts`: E2E config; starts dev server locally.
- `.env.local`: Active environment variables (Appwrite endpoint, project id, etc.).


## 4️⃣ Frontend Folder Breakdown

### app/
- `layout.tsx`: Root layout; wraps pages in `AuthProvider`, `ToastProvider`, `Navbar`, and global UI. Applies global styles.
- Global CSS: `animations.css`, `globals-enhanced.css`, `mobile-optimized.css`.
- Pages:
  - `page.tsx`: Landing page.
  - `dashboard/page.tsx`: Auth‑protected dashboard to manage events and scoring.
  - `events/page.tsx`, `events/create/page.tsx`: Event listing and creation wizard.
  - `event/[eventId]/page.tsx`, `event/[eventId]/history/page.tsx`: Event detail and historical scores.
  - `display/[eventId]/page.tsx`: Presentation/projector mode per event.
  - `public/page.tsx`, `public/[token]/page.tsx`: Public scoreboard entry/share link resolution and tokenized view.
  - `scoreboard/[token]/page.tsx`: Alternate public scoreboard by token.
  - `recap/page.tsx`: Recap/Wrapped entry point.
  - `settings/page.tsx`, `profile/page.tsx`: User/app settings and profile.
  - `debug/auth/page.tsx`, `debug/appwrite/page.tsx`: Diagnostics pages for auth/appwrite.
  - `error.tsx`: Global error boundary page.

### components/
- Feature components: `EventSetupWizard.tsx`, `RecapPlayer*.tsx`, `ScoresTable.tsx`, `PublicScoreboard.tsx`, `DashboardCard.tsx`, `EventCard.tsx`.
- UI primitives: `ui/Button.tsx`, `ui/Card.tsx`, `ui/Tabs.tsx`, `ui/Modal.tsx`, etc.
- Guards: `AuthGuard.tsx`, `ProtectedRoute.tsx`, `Public`/`ProtectedPage` variants.
- Inputs: `AutosaveScoreInput.tsx`, `NumberInput.tsx`, `PasswordInput.tsx`, `FormInput.tsx`.
- Modals: under `components/modals/` (edit/save template/scoring).
- Skeletons/Loading: under `components/skeletons/`.
- Onboarding: `onboarding/OnboardingTutorial.tsx`.
- Admin management: `components/admin/AdminManagement.tsx`.

### lib/
- Appwrite integration: `appwrite.ts` (client init), `appwriteAuth.ts` (auth ops), `services/*` (CRUD for events/teams/scores/share links/templates/storage/recaps, email service), `appwriteHealth.ts`.
- Auth state: `auth-context.tsx` (React Context managing session state).
- Domain logic: `score-logic.ts` (ranking, aggregation), `event-utils.ts`.
- Utilities: `error-handler.ts`, `error-messages.ts`, `sanitize.ts`, `toast.ts`, `dateUtils.ts`, `color-palettes.ts`, `theme.ts`.
- Hooks: `lib/hooks/*` (submission lock, event stream, diagnostics, error toast, browser safety).
- Misc: `analytics.ts`, `logger.ts`, `notifications.ts`, `pagination.ts`, `password-validator.ts`, `sound.ts`, `sharecard-generator.ts`, `theme-recommendations.ts`.

**Removed (no longer needed with Appwrite BaaS):**
- ❌ `rate-limit.ts`, `rate-limiter.ts` — Appwrite handles rate limiting server-side.
- ❌ `sse.ts` — Replaced by Appwrite Realtime.
- ❌ `monitoring/uptime.config.ts` — Appwrite provides monitoring; no custom uptime needed.
- ❌ `request-logger.ts` — Appwrite logs all API requests; no custom logging needed.
- ❌ `*.bak` files — Backup files removed.


## 5️⃣ File‑by‑File Explanation

Below lists each notable file with its role. If a file is config/primitives, it’s grouped; functional files are called out individually.

### app/layout.tsx
- Type: Frontend
- Purpose: Global wrapper for all routes; sets metadata and viewport, injects providers (`AuthProvider`, `ToastProvider`), global navbar and footer.
- Function in GameScore: Ensures auth state, UI toasts, and default chrome are available to every page, including dashboard and public views.
- Key Responsibilities:
  - Wrap children in providers.
  - Include `Navbar`, `OnboardingTutorial`, and page layout structure.
  - Apply global styles.
- Important Notes: Critical; breaking changes can affect all routes and auth initialization.

### app/page.tsx (Landing)
- Type: Frontend
- Purpose: Public landing/home.
- Function: Entry for unauthenticated users; links to login/register or public areas.
- Importance: Auxiliary (not critical for scoring logic).

### app/dashboard/page.tsx
- Type: Frontend
- Purpose: Main authenticated dashboard for event management and scoring.
- Function: Fetches user’s events via services; renders cards, modals, and scoring workflows.
- Key Responsibilities:
  - Load events for the authenticated user.
  - Open create/edit modals, delete (soft‑delete) events.
  - Provide navigation to detailed event screens and recap.
- Important Notes: Critical. Depends on `useAuth()` and `services/appwriteEvents.ts` et al.

### app/events/page.tsx, app/events/create/page.tsx
- Type: Frontend
- Purpose: List and create events.
- Function: Manges event lifecycle creation; uses `EventSetupWizard`.
- Importance: Core for initial setup.

### app/event/[eventId]/page.tsx, app/event/[eventId]/history/page.tsx
- Type: Frontend
- Purpose: Event detail and history views.
- Function: Surface event metadata, scoring tabs, history tab.
- Importance: Core; feed recap and display with canonical data.

### app/display/[eventId]/page.tsx
- Type: Frontend (Presentation)
- Purpose: Projector/presentation mode for the event.
- Function: Render large display, theming with `ThemedEventPage`, live updates.
- Importance: High for on‑site presentation.

### app/public/page.tsx, app/public/[token]/page.tsx and app/scoreboard/[token]/page.tsx
- Type: Frontend (Public)
- Purpose: Public scoreboard routing and tokenized access.
- Function: Resolve shared links to a readonly scoreboard view.
- Importance: Critical for spectators.

### app/recap/page.tsx
- Type: Frontend (Presentation)
- Purpose: Recap/Wrapped entry page.
- Function: Assembles recap components; triggers slide generation via services.
- Importance: High; not required for live scoring but key to value.

### app/debug/auth/page.tsx, app/debug/appwrite/page.tsx
- Type: Frontend (Diagnostics)
- Purpose: Manual diagnostics for auth and Appwrite connectivity.
- Function: Show session state, run ping checks.
- Importance: Auxiliary but essential for troubleshooting.

### app/error.tsx
- Type: Frontend
- Purpose: Error boundary page for App Router.
- Function: Render fallback UI on errors.
- Importance: Auxiliary.

### components/AuthGuard.tsx
- Type: Frontend Utility
- Purpose: Route protection and redirect logic.
- Function: Prevent unauthenticated access to protected pages; redirect authenticated users away from login/register.
- Key Responsibilities:
  - Wait for `authReady` then evaluate `isAuthenticated`.
  - Push to `/login?returnUrl=...` or `/dashboard` accordingly.
  - Guard against redirect loops.
- Important Notes: Critical. We added per‑route redirect counter reset and periodic checks.

### components/RecapPlayer.tsx, RecapPlayerNew.tsx, RecapSlides.tsx, RecapSlideComponents.tsx
- Type: Frontend (Presentation)
- Purpose: Recap player implementation (legacy/new), slide sequencing, and slide atoms.
- Function: Builds Recap experience: ranking reveals, transitions, and timed autoplay.
- Key Responsibilities:
  - Consume recap data from services.
  - Control animation flow, navigation, autoplay.
- Important Notes: High complexity; depends on animation settings and recap data shape.

### components/PublicScoreboard.tsx, ScoresTable.tsx, ScoreInputRow.tsx, AutosaveScoreInput.tsx
- Type: Frontend Feature
- Purpose: Live scoreboard and scoring inputs.
- Function: Render/update scores, accept host inputs, autosave on change.
- Key Responsibilities:
  - Bind to service methods for submitting scores.
  - Normalize input and prevent invalid states.
- Important Notes: Mission critical for live events.

### components/EventSetupWizard.tsx, EventCard.tsx, DashboardCard.tsx
- Type: Frontend Feature
- Purpose: Event creation/editing and dashboard summaries.
- Function: Provide UX to create/update events; show statuses and counts.

### components/modals/* (EditEventModal, ScoringModal, SaveTemplateModal, UseTemplateModal)
- Type: Frontend Feature
- Purpose: Structured user flows for editing or templating event data.

### components/ui/*, components/skeletons/*, components/* inputs
- Type: Frontend UI primitives
- Purpose: Design system atoms: `Button`, `Card`, `Tabs`, `Modal`, `TeamCard`, skeletons.
- Notes: Auxiliary; widely used.

### lib/appwrite.ts
- Type: Appwrite Integration
- Purpose: Initialize Appwrite `Client`, `Account`, `Databases`, `Storage`, `Functions` using env vars.
- Function: Exposes configured clients to services and auth.
- Important Notes: Requires `NEXT_PUBLIC_APPWRITE_ENDPOINT` and `NEXT_PUBLIC_APPWRITE_PROJECT_ID`.

### lib/appwriteAuth.ts
- Type: Appwrite Integration
- Purpose: Encapsulate auth: register, login, logout, recovery, MFA (stubs or disabled), and `getCurrentUser()`.
- Function: Bridges UI and Appwrite Account SDK.
- Notes: Returns normalized `AuthUser`. Handles 401s by returning null user deterministically.

### lib/auth-context.tsx
- Type: State Management
- Purpose: Central auth state provider (React Context) with `useAuth()`.
- Function: `checkAuth()`, `login()`, `logout()`, registration and recovery; maintains `isAuthenticated`, `user`, `authReady`.
- Notes: Periodic re‑check and focus/visibility triggers ensure session expiry is detected.

### lib/services/*
- Type: Domain Services (Appwrite)
- Purpose: CRUD and queries for `events`, `teams`, `scores`, `share_links`, `templates`, `storage`, `recaps`, and `email`.
- Function: Provide typed, domain‑level operations and response shapes; often use `api-response.ts` and `error-handler.ts`.
- Important Notes: Critical; all app flows go through these for data access.

### lib/score-logic.ts
- Type: Domain Logic
- Purpose: Ranking, aggregation, and TLM count system computation.
- Function: Aggregates per‑day or per‑round scores; computes standings; resolves ties per configured rules.
- Notes: Core of “how scores become rankings”.

### lib/hooks/*
- `useSubmissionLock.ts`: Prevent duplicate form submits.
- `useEventStream.ts`: Subscribe to realtime updates; surface as React state.
- `useAuthDiagnostics.ts`: Utilities for debug/auth pages.
- `useErrorToast.ts`, `useBrowserSafe.ts`: UX/stability helpers.

### lib/error-handler.ts, error-messages.ts
- Purpose: Normalize errors, handle 401 by redirecting to `/login?returnUrl=...`, user‑friendly messaging.

### appwrite/appwrite.json, appwrite/functions/*
- Type: Appwrite Config + Functions
- Purpose: Define collections/permissions (via Appwrite console/project) and functions:
  - `submitScoreHandler/`: Validates and writes score updates atomically.
  - `generateRecap/`: Builds recap artifacts (aggregate stats and narratives).
  - `logAudit/`: Records admin actions, score changes, deletions.
- Notes: Functions are Node.js projects with minimal `index.js` and `package.json`.

### tests/
- Unit: `tests/unit/services/*` mocking `lib/appwrite` to test services (events/teams/scores) success/error paths.
- E2E: `tests/e2e/*` including `auth-smoke.spec.ts` (login → dashboard → refresh stays logged in), plus feature/smoke.

### Config and Tooling
- `next.config.js`, `tailwind.config.js`, `postcss.config.js`: Build and styling pipeline.
- `playwright.config.ts`: Starts `npm run dev` locally, sets base URL, devices.
- `jest.config.js`, `jest.setup.js`: JSDOM environment, alias mapping, and coverage config.


## 6️⃣ Appwrite Integration Explanation

**Authentication (Production):**
- GameScore uses **real Appwrite sessions** (no demo mode).
- On first load, the app attempts to restore an existing session via `account.getSession('current')`.
- If no session exists, an **anonymous session** is created automatically via `account.createAnonymousSession()`.
- Anonymous users get a real Appwrite user ID and can create/view events (perfect for event-based scoring).
- Users can optionally register/login for persistent accounts across devices.
- Sessions are checked periodically (every 60s) and on window focus/visibility changes.
- **No session clearing on mount** — sessions persist across reloads.

**Sessions:**
- Browser session cookie set by Appwrite `createEmailPasswordSession` or `createAnonymousSession`.
- On 401 during API calls, error-handler redirects to login with returnUrl.
- `auth-context.tsx` manages `authReady`, `isAuthenticated`, `user` state globally.

**Databases/Collections:**
- Services under `lib/services/*` assume collections like `events`, `teams`, `scores`, `share_links`, `recaps`.
- CRUD via `Databases` SDK; permissions are enforced by Appwrite.

**Permissions:**
- **Events:** Creator can read/update/delete; `any` can read (for public scoreboards).
- **Teams:** Creator can read/update/delete; `any` can read (for public scoreboards).
- **Scores:** Creator can read/update/delete; `any` can read (for public scoreboards).
- **Share links** provide tokenized public access without authentication.

**Realtime:**
- `useEventStream.ts` and services subscribe to collection channels for event scope (e.g., scores of a given event).
- On score change, UI state updates and standings recompute via `score-logic.ts`.

**Functions:**
- `submitScoreHandler`: Server‑side validation/normalization to prevent bad writes/race conditions.
- `generateRecap`: Aggregates results and builds a recap structure.
- `logAudit`: Records mutation actions for traceability (auditors).


## 7️⃣ Scoring & TLM System Explanation

- TLM Count System:
  - TLM (Total/League/Match) refers to a flexible counting model used across events. Implementation consolidates per‑round/per‑day inputs into event totals and supports different display/aggregation modes.
  - `lib/score-logic.ts`:
    - Input: raw score documents `{ event_id, team_id, value, round/day, timestamp }`.
    - Aggregation: sums or applies rules per mode (e.g., cumulative vs. per‑day standings).
    - Rankings: sorts teams; tie‑breakers can use recent performance, most wins, or deterministic ordering.
    - Edge cases: missing team scores treated as zero or excluded based on mode; ties are preserved or broken per configuration.

- Data Model (conceptual):
  - `events`: event metadata, status, theme.
  - `teams`: team roster, avatar/logo references.
  - `scores`: atomic increments/entries with relations to event/team.
  - `share_links`: tokenized public views.
  - `recaps`: generated summary content.


## 8️⃣ Live Scoreboard Flow

1. Score submission (host/admin): `ScoresTable`/`ScoreInputRow`/`AutosaveScoreInput` → call service (or function `submitScoreHandler`).
2. Backend update: Appwrite database writes; audit entry logged via `logAudit`.
3. Realtime broadcast: Appwrite emits change events for `scores` collection.
4. Frontend update: `useEventStream`/services receive event → UI state updates.
5. Re-render: standings recomputed via `score-logic.ts`; `PublicScoreboard`/`ScoresTable` reflect changes.

Relevant files:
- Frontend: `components/PublicScoreboard.tsx`, `components/ScoresTable.tsx`, `components/AutosaveScoreInput.tsx`.
- Services: `lib/services/appwriteScores.ts`, `lib/services/appwriteEvents.ts`, `lib/hooks/useEventStream.ts`.
- Logic: `lib/score-logic.ts`.
- Backend: `appwrite/functions/submitScoreHandler/*`.


## 9️⃣ Recap / Wrapped / Presentation Mode Flow

- Trigger: From dashboard or recap page (`app/recap/page.tsx`).
- Data assembly: `lib/services/appwriteRecaps.ts` (and events/scores) produce a recap data model (top teams, totals, highlights).
- Slides: `components/RecapSlides.tsx` and `RecapSlideComponents.tsx` build a sequence (#4 → #1 reveal, highlights, MVP moments).
- Player/Animation: `components/RecapPlayer*.tsx` control autoplay/manual navigation, timings, transitions; can trigger confetti/fireworks via `lib/confetti.ts` and sounds via `lib/sound.ts`.
- Presentation: Projector pages (`app/display/[eventId]/page.tsx`) render large display, optionally tied to recap player.

Notes:
- Ranking reveal: sorted from bottom to top with per‑slide transitions.
- Effects: confetti on winner, optional fireworks/sounds; theming applied via event theme/color settings (`lib/theme.ts`, `lib/color-palettes.ts`).


## 🔟 Error Handling & Edge Cases

- `lib/error-handler.ts` centralizes common error normalization.
  - **401** → redirect to `/login?returnUrl=...` (session expired or unauthorized).
  - **429** → friendly backoff message (rate limited).
  - **404/403** → readable messages.

- Missing data:
  - Components render `EmptyState` or skeletons.
  - Services return `{ success: false, error }` which pages interpret.

- Backend failure:
  - Display toasts via `lib/toast.ts` and `components/ui/Toast.tsx`.
  - Some operations retried or gated by submission locks.

- Offline/reconnect:
  - Realtime subscriptions attempt to reconnect via Appwrite SDK; on reconnect, a refresh of critical queries is recommended.

- **No demo mode error masking** — all errors are logged and handled gracefully for production.


## 1️⃣1️⃣ Security & Permissions Overview

- Write access (scores/events/teams): Authenticated users; often event owner or admin checked server‑side (Appwrite rules/Functions).
- Read access:
  - Dashboard: authenticated only.
  - Public scoreboard: Any, via `share_links` token constraints.

- Frontend trust boundaries:
  - UI never trusts client-only validation; server/Function validates inputs.
  - Public pages are readonly; mutations require auth and appropriate permissions.


## 1️⃣2️⃣ What Is Not Used / Not Relevant (Current)

- **MFA flows** in UI are present but currently disabled/stubbed in `auth-context.tsx` (by design to simplify initial rollout).
- Some advanced **admin/analytics components** may be auxiliary depending on event needs (`components/AnalyticsDashboard.tsx`).
- **Debug pages** under `app/debug/*` are not required for production usage; retained for troubleshooting.

**Files removed during cleanup (December 28, 2025):**

**BaaS Cleanup:**
- ❌ `lib/auth-context.tsx.bak` — Backup file; no longer needed.
- ❌ `appwrite/appwrite.json.bak` — Backup file; no longer needed.
- ❌ `lib/rate-limit.ts` and `lib/rate-limiter.ts` — Client-side rate limiting is an anti-pattern with Appwrite BaaS.
- ❌ `lib/sse.ts` — SSE-based pub/sub replaced by Appwrite Realtime.
- ❌ `lib/monitoring/uptime.config.ts` (and entire `monitoring/` directory) — Appwrite provides monitoring; custom uptime checks are redundant.
- ❌ `lib/request-logger.ts` — Appwrite logs all API requests; custom request logging duplicates backend functionality.

**Production Migration (Go-Live, December 28, 2025):**
- ❌ **Demo mode completely removed** — No fake users, no demo@example.com, no fallback IDs.
- ❌ **Session clearing on mount removed** — Sessions now persist across reloads.
- ❌ **Demo error masking removed** — Real 401 errors trigger proper redirects.
- ❌ **Demo event creation removed** — Dashboard no longer has "Create Demo Event" button.
- ❌ **Demo banner removed** — No localStorage-based demo mode indicators.

If a file appears and isn’t wired into imports/exports or routes, treat it as auxiliary or future-facing; verify before removal.


## 1️⃣3️⃣ Final System Summary

GameScore is a Next.js + Appwrite based live scoring platform with:
- Authenticated dashboard for managing events, teams, and scores.
- Realtime, tokenized public scoreboards for spectators.
- Robust scoring logic that aggregates and ranks teams, including per‑day summaries (TLM model).
- Presentation layers: projector display and animated Recap/Wrapped with slide sequencing and effects.

**Key strengths:**
- **Pure Appwrite BaaS architecture** — No custom backend server; no client-side rate limiting; no JWT verification.
- Strong separation of concerns (components vs services vs logic).
- Deterministic auth and error handling; resilient to session expiry.
- Appwrite provides an integrated backend (auth, DB, realtime, functions, monitoring) reducing ops overhead.

**Extensibility:**
- The recap player and theme system are designed to add new slide types/effects.
- Services can be extended to support new collections or permissions.
- Functions can encapsulate heavier server logic (e.g., advanced tie‑breakers, analytics).

**Assumptions called out:**
- Specific collection IDs/rules are configured in Appwrite Console; services imply their presence.
- The TLM system refers to a flexible aggregation pattern as implemented in `lib/score-logic.ts`.
- Some components are feature‑complete but optional for minimal deployments (debug/admin/analytics).


---

## ✅ Cleanup Verification (December 28, 2025)

**Objective:** Audit and remove all files that violate Appwrite BaaS best practices or duplicate backend functionality.

### Files Removed
1. **Backup/Duplicate Files:**
   - ✅ `lib/auth-context.tsx.bak`
   - ✅ `appwrite/appwrite.json.bak`

2. **Client-Side Rate Limiting:**
   - ✅ `lib/rate-limit.ts`
   - ✅ `lib/rate-limiter.ts`
   - **Reason:** Appwrite handles rate limiting server-side via API keys and project settings. Client-side rate limiting is unreliable and violates BaaS principles.

3. **Monitoring/Uptime Configuration:**
   - ✅ `lib/monitoring/uptime.config.ts` (directory removed)
   - **Reason:** Appwrite provides built-in monitoring, health checks, and uptime tracking. Custom uptime configs are redundant.

4. **Unused Streaming System (SSE):**
   - ✅ `lib/sse.ts`
   - **Reason:** Replaced by Appwrite Realtime. SSE pub/sub was an earlier pattern before full Appwrite Realtime integration.

5. **Redundant Backend-Like Logic:**
   - ✅ `lib/request-logger.ts`
   - **Reason:** Appwrite logs all API requests automatically. Custom request logging duplicates backend functionality and references unused `JWTPayload` type. Frontend should not attempt to log/audit requests—this is a backend responsibility.

### Files Reviewed and Kept
1. **`appwrite/functions/logAudit/index.js`:**
   - ✅ **KEPT** — Provides server-side, immutable audit logging. This is a legitimate Appwrite Function that ensures trust and traceability. It writes to an `audit_logs` collection and is called by backend operations only.
   - **Why it's valid:** Server-side audit logs provide non-repudiable records for compliance. This is NOT client-side logging.

2. **`lib/types.ts` (JWTPayload interface):**
   - ✅ **KEPT** — May be used for TypeScript type safety in auth context or future integrations. Not actively creating/verifying JWTs client-side.

### Verification Checklist
- ✅ **Removed backup and redundant files**
- ✅ **No custom backend logic remains** (client-side rate limiting, request logging, SSE pub/sub removed)
- ✅ **Auth relies fully on Appwrite sessions** (no JWT verification client-side; no custom session management)
- ✅ **Realtime relies fully on Appwrite Realtime** (SSE removed)
- ✅ **Scoring logic preserved and untouched** (`lib/score-logic.ts`, TLM system intact)
- ✅ **Functions kept where server-side trust is required** (`submitScoreHandler`, `generateRecap`, `logAudit`)

### Post-Cleanup Architecture
```
Frontend (Next.js)
   ├── UI Components (app/, components/)
   ├── Services (lib/services/* — Appwrite SDK calls only)
   ├── Hooks (lib/hooks/* — Realtime, auth state)
   └── Domain Logic (lib/score-logic.ts, event-utils.ts)

Appwrite Cloud
   ├── Auth & Sessions (Account SDK)
   ├── Database (Collections: events, teams, scores, recaps, share_links)
   ├── Realtime (Subscriptions for live updates)
   ├── Storage (Team logos, assets)
   ├── Functions (submitScoreHandler, generateRecap, logAudit)
   └── Monitoring & Rate Limiting (Built-in)
```

**No custom backend server. No client-side rate limiting. No JWT verification. No SSE. No redundant monitoring.**

### Summary
The GameScore system now adheres strictly to Appwrite BaaS principles:
- Frontend consumes Appwrite APIs via SDK.
- Backend logic lives in Appwrite Functions (where atomicity/trust is required).
- All removed files were either backups, client-side duplications of server-side features, or patterns replaced by Appwrite native capabilities.

**The system is cleaner, simpler, and aligned with modern BaaS best practices.**
