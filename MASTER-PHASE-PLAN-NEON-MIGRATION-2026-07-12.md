# Game Count System Master Phase Plan

Date: July 12, 2026

Related document: [CTO-PRODUCT-PROPOSAL-2026-07-12.md](C:/Users/DANIEL/Documents/WebApp Projects/game-count-system/CTO-PRODUCT-PROPOSAL-2026-07-12.md)

## Purpose

This document turns the CTO proposal into an execution plan. It also proposes the backend migration away from Firebase and Render, with a recommended target architecture built around Node.js and Neon.

This is the operating document we should use to move phase by phase until the entire platform is complete.

## Current-State Audit Summary

The repository is not yet fully off Firebase or Render, but the active Phase 1 backend migration is now well underway and most core event operations have been moved onto Prisma + Neon.

### Evidence from the current codebase

- `prisma/schema.prisma` now contains the application domain model for events, tokens, event days, teams, scores, score batches, audit logs, templates, organizations, and waitlist signups.
- `lib/server/prisma.ts` and the `lib/server/*` service layer are now the primary backend foundation for migrated routes.
- The public, lifecycle, team, score, finalize, history, and bulk-ops route families have been progressively moved to Prisma-backed services.
- Some Firebase libraries and legacy routes still exist in the repository and remain Phase 1 cleanup targets.
- Some older deployment and environment assumptions still reference Render/Firebase and must continue to be removed until no active runtime path depends on them.

### Key technical observations

1. The data model had drift across generations of the app.
   Examples:
   - `eventMode` vs `mode`
   - `eventStatus` vs `status`
   - `start_at` vs `startDate`
   - direct public token fetches vs hashed token lookup

2. The migration is succeeding best when done by route family plus service layer, instead of partial dual-runtime patches.

3. The product surface is rich enough now that a relational backend is the correct long-term foundation for analytics, auditing, lifecycle control, and export features.

4. Phase 1 is no longer theoretical work. It now includes real migrated runtime slices, route parity work, and verification checkpoints.

## Strategic Backend Decision

## Recommendation

Use this target architecture:

- Frontend: Next.js 14 App Router
- Backend runtime: Node.js through Next.js route handlers and server actions first
- Database: Neon Postgres
- ORM and schema management: Prisma
- File/object storage: Cloudflare R2
- Cron and scheduled jobs: GitHub Actions initially
- Hosting: Vercel for the main app
- Monitoring: Sentry + Vercel observability first

## Why this is the best choice

This is the fastest and most affordable path to a fully functional production platform without introducing unnecessary system sprawl.

### Why not keep Firebase

- The current repo already shows domain-model inconsistency and migration drift.
- Firestore is workable, but the product now wants stronger relational structure:
  events, teams, scores, days, tokens, audit logs, templates, organizations.
- SQL is a better fit for analytics, integrity, reporting, and future org-level features.
- Prisma + Postgres will make the data layer easier to reason about and test.

### Why not keep Render

- Render is no longer aligned with the desired target.
- The repo already contains mixed deployment assumptions.
- For this product shape, Vercel + Neon gives a cleaner default platform.

### Why keep the backend inside the Next.js app first

This matters for speed.

The fastest path is:

1. keep one repository
2. keep one deployment artifact
3. migrate data and server logic from Firebase to Neon/Postgres
4. refactor route handlers into clean service modules
5. only extract a separate Node API later if scale or team boundaries demand it

This still satisfies the requirement of using Node.js for the backend, because Next.js route handlers run on Node.js. It also reduces deployment complexity and shortens time to completion.

## Alternative Deployment Options

### Option A: Recommended

- Next.js app on Vercel
- Neon Postgres
- R2 for storage
- GitHub Actions for cleanup jobs

Why recommend it:

- fastest migration path
- least moving parts
- strong DX
- clean fit for Next.js
- affordable starting point

### Option B: Split backend service

- Next.js frontend on Vercel
- Fastify or NestJS API on Railway
- Neon Postgres
- R2 for storage

Use this if:

- you want strict frontend/backend separation now
- you expect mobile clients or third-party API consumers soon
- you want long-running worker patterns earlier

Why I do not recommend it first:

- slower to finish
- more deployment and environment management
- more code movement before value

### Option C: Full custom infra path

- Next.js frontend on Vercel or self-hosted
- Node API on Fly.io
- Neon Postgres
- R2

Use this only if:

- you want infra-level control
- the team is comfortable owning more DevOps now

Why I do not recommend it first:

- more operational complexity than the product currently needs

## Recommended Architecture

## Phase-Target Architecture

### Application layer

- Next.js App Router for UI
- route handlers for API
- server-side domain services under `lib/server`
- Zod validation for request contracts

### Data layer

- Neon Postgres
- Prisma schema as the source of truth
- explicit relational models for:
  - events
  - event_days
  - teams
  - scores
  - access_tokens
  - score_batches
  - event_templates
  - audit_logs
  - organizations

### Storage layer

- Cloudflare R2 for:
  - team avatars
  - event logos
  - exported PDFs
  - recap media

### Operational services

- GitHub Actions for:
  - cleanup jobs
  - scheduled archival
  - backup verification
- Sentry for errors
- Vercel analytics/observability for runtime behavior

## What We Should Migrate

### Remove completely

- Firebase client usage from active runtime paths
- Firebase admin usage from active runtime paths
- Firestore helper usage from active runtime paths
- Render deployment blueprint assumptions
- Firebase-specific env assumptions for active development/runtime

### Replace

- Firestore collections with relational Postgres tables
- token lookup queries with hashed-token SQL lookups
- subcollection score structures with normalized score tables
- Render-based fetches with local Next/server service access
- Render cron approach with GitHub Actions scheduled job or Vercel cron equivalent if chosen later

## Phase Plan

## Phase 1: Backend Foundation And Data Consolidation

Objective:
Move the platform onto a trustworthy relational backend and remove architecture drift.

### Scope

- define Prisma schema
- define canonical domain types
- define token strategy in SQL
- define event lifecycle states
- create Neon connection and Prisma client setup
- implement initial migrations
- remove Firebase from the active runtime path
- remove Render-specific deployment assumptions

### Deliverables

- production-ready Prisma schema
- `DATABASE_URL`-based backend configuration
- new SQL-backed service layer
- migrated API route foundation
- env templates updated for Neon/Vercel/R2
- migration script plan from Firestore export to Postgres import

### Completion criteria

- no production runtime route depends on Firebase
- no active deployment path depends on Render
- event create, read, update, finalize, archive, and token validation work on Neon
- app builds successfully with the new environment model

## Phase 2: Core User Flow Stabilization

Objective:
Ensure the platform is fully functional end to end after backend migration.

### Scope

- create event flow
- event success/share links
- admin team management
- scorer entry flow
- public scoreboard
- history
- recap/results
- PDF export

### Deliverables

- all primary user journeys working against Neon
- consistent request/response contracts
- clear loading/error states
- smoke-test checklist for every flow

### Completion criteria

- one event can be created, scored, displayed, finalized, exported, and reviewed without Firebase
- no broken token flows
- no route still using old data assumptions

## Phase 3: UX And Product Consolidation

Objective:
Turn the app into one coherent product instead of a set of strong but inconsistent screens.

### Scope

- unify visual system
- simplify navigation and information architecture
- redesign admin into sections
- clean up disabled legacy surfaces
- improve onboarding and link-saving flows

### Deliverables

- shared design tokens
- standardized cards, buttons, alerts, and forms
- unified event status language
- coherent cross-screen UI patterns

### Completion criteria

- all first-class screens follow the same product language
- legacy-disabled pages are either removed or clearly replaced
- the admin/scorer/public surfaces feel intentionally related

## Phase 4: Reliability And Operational Hardening

Objective:
Make live event operation trustworthy.

### Scope

- stronger offline queue behavior
- idempotent score submission
- conflict handling
- retry-safe bulk scoring
- logging and monitoring
- scheduled cleanup and archival
- backup/export discipline

### Deliverables

- robust queue sync logic
- submission idempotency key model
- audit logging
- scheduled cleanup job
- operational dashboards

### Completion criteria

- scoring is safe under refresh, retries, and reconnects
- cleanup/archival is automated and observable
- errors are traceable

## Phase 5: Product Expansion Features

Objective:
Add the next-wave features after the platform is stable.

### Scope

- event templates
- branded themes
- better analytics
- organization support
- optional account recovery or organizer verification
- richer recap/displays

### Completion criteria

- platform is no longer only event-by-event
- recurring organizer value is clearly supported

## Immediate Build Order

1. Create the canonical Prisma schema
2. Add Neon configuration and Prisma client
3. Model token storage and verification in SQL
4. Migrate event creation route
5. Migrate event lookup by token
6. Migrate teams and scores APIs
7. Migrate finalize/archive/history/public scoreboard APIs
8. Remove Firebase runtime dependencies
9. Replace env and deployment setup
10. Run full flow QA
11. Start UX consolidation
12. Start reliability hardening

## Risks We Must Control During Migration

### Risk 1: Breaking token access

Mitigation:

- move token validation early
- hash tokens consistently
- add route-level tests for admin/scorer/public access

### Risk 2: Mixed runtime during migration

Mitigation:

- migrate route families in slices
- avoid partial dual-source logic staying too long
- use a controlled cutover plan

### Risk 3: Data loss from Firebase exit

Mitigation:

- run Firestore backup first
- preserve export snapshots
- write import scripts with verification
- compare counts before cutover

### Risk 4: Slow completion due to over-architecture

Mitigation:

- keep one repository
- do not split backend service first
- prioritize functional parity over premature abstractions

## Status Tracker

### Phase 1

Status: In progress

Completed so far:

- created the Phase 1 master migration plan
- defined the target backend stack:
  Next.js + Node.js + Neon + Prisma + R2 + Vercel
- added the full Prisma domain schema for the product
- added a reusable Prisma client foundation for server runtime
- added the SQL-backed service layer for events, teams, scores, and lifecycle operations
- migrated token validation to Prisma-backed hashed token lookup
- migrated event creation and event lookup by token
- migrated team listing and score submission
- migrated finalize/reopen, public scoreboard data, and past events
- migrated quick-create, bulk team creation, bulk score submission, and event history
- migrated score editing and score deletion
- migrated event archive, event status, day-lock, CSV export, cleanup, health, public redirect, recap, and scoreboard slices to Prisma-oriented runtime paths
- migrated the remaining legacy compatibility routes now still present in the app surface:
  `GET/PATCH /api/events/[event_id]`, `POST /api/teams/add`, and `POST /api/scores/add`
- removed the active Render-based recap fetch path
- redirected the old public path to the new scoreboard path
- updated local environment assumptions toward localhost:3002 and Prisma/Neon runtime usage
- removed the unsupported legacy event settings controls from the active edit flow so the UI now matches the current Prisma-backed schema truthfully
- removed the remaining live Render-era URL defaults from email and CORS helpers
- removed the dead Firebase runtime helper modules from `lib/` so the active app no longer carries the old Firebase admin/client helper layer
- updated the root env templates away from Firebase/Render-era assumptions and toward the Prisma + localhost:3002 contract
- removed the obsolete Firestore backup, restore, cleanup, and Firebase/Render env generation scripts from the repository
- removed the old Render blueprint file and Firebase package declarations from the application manifest
- rewrote the environment checker script so it validates the Prisma/Neon contract instead of Firebase credentials
- replaced the remaining active Firebase-branded shared helper/type modules with backend-neutral domain and client helper modules
- updated active local test scripts and route fallbacks from `localhost:3000` to `localhost:3002`
- added the backend approval proposal for the Node.js + Neon + Prisma production direction
- validated the codebase with production build checks and post-build TypeScript verification after each migration slice

Verified current Phase 1 gaps still remaining:

- the current database runtime still does not point at a reachable Neon instance;
  build and health checks report an unreachable Postgres host at `dpg-d5i78eumcj7s73bdrfi0-a:5432`
- some legacy Firebase-oriented documentation and historical test assets still exist in the repo even though the active runtime helper layer, package dependencies, and shared app modules have now been removed or renamed

Remaining Phase 1 targets:

- remove the remaining Firebase libraries and any still-live Firebase-backed routes from active runtime use
- replace any remaining Render-specific deployment/runtime assumptions
- connect the app to the real Neon database target and verify live Prisma reads/writes end to end
- run complete end-to-end flow QA across create, score, history, public scoreboard, finalize, archive, export, and cleanup

### Phase 2

Status: Not started

### Phase 3

Status: Not started

### Phase 4

Status: Not started

### Phase 5

Status: Not started

## Next Deliverable

The next concrete technical deliverable should be:

- full Phase 1 parity validation and removal of the last Firebase/Render runtime dependencies
