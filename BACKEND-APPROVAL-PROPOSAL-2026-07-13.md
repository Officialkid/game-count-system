# Backend Approval Proposal

Date: 2026-07-13
Project: Game Count System
Status: Approval requested

## Executive Decision

Approve a Node.js-first backend built on Next.js route handlers, Prisma ORM, and Neon Postgres.

This replaces the legacy Firebase and Render runtime assumptions with a simpler, cheaper, and more maintainable stack that fits the current product shape:

- Frontend and backend: Next.js 14 on Node.js
- Primary database: Neon Postgres
- ORM and schema management: Prisma
- Hosting: Vercel
- Scheduled jobs: Vercel Cron
- File/report storage if needed later: Cloudflare R2
- Monitoring: Sentry

## What We Are Approving

We are approving the backend direction for the production version of the system:

1. Remove Firebase from the live runtime completely.
2. Remove Render-specific deployment assumptions.
3. Standardize all app APIs on Node.js route handlers inside the Next.js app.
4. Use Neon as the single source of truth for event, team, score, token, lifecycle, and cleanup data.
5. Use Prisma for schema evolution, query consistency, and type-safe data access.

## Why This Stack Fits This Project

The current system is a transactional scoring platform, not a chat-style realtime platform that depends on Firebase-specific primitives. The core needs are:

- fast event creation
- reliable score submission
- strong data consistency
- lifecycle management
- token-based access control
- exports, history, recap, and archive workflows

Neon plus Prisma fits this better than Firebase because:

- relational data maps naturally to events, teams, scores, users, and lifecycle state
- consistency is stronger for scoring and lock/finalize flows
- querying recap, history, export, and admin cleanup is simpler
- local development and production behavior are easier to align
- vendor sprawl is reduced

## Cost View

This is the recommended low-cost path that still scales cleanly.

### Recommended starting stack

- Vercel: host the Next.js app and cron jobs
- Neon: managed Postgres for production data
- Sentry: error monitoring on a free or low-cost starter plan

### Why it is cost-effective

- one app platform instead of splitting web and API across extra services
- one database instead of maintaining Firebase plus additional logic layers
- Prisma reduces maintenance cost by making migrations and data access predictable
- Neon offers a strong entry-level managed Postgres option for early-stage production

### Expected cost posture

- lowest cost during rollout: Vercel + Neon starter/free tiers where possible
- first paid upgrade likely comes from database scale, connection limits, or production traffic
- this is still typically more predictable than keeping mixed Firebase and Render-era architecture

## Alternatives Considered

### Firebase

Not recommended for the future target architecture.

Reasons:

- runtime has already been substantially migrated away from Firebase
- document-oriented patterns are a poor fit for the growing relational reporting surface
- it adds complexity for lifecycle, recap, export, and token enforcement logic

### Render

Not recommended for the active deployment target.

Reasons:

- the app is already naturally aligned with Vercel as a Next.js deployment target
- Render-specific assumptions have been removed from runtime planning
- keeping a separate Render path adds operational overhead without clear advantage here

### Separate Express API

Not recommended right now.

Reasons:

- it increases surface area, hosting complexity, and deployment coordination
- current app requirements can be served well by Next.js route handlers on Node.js
- we should only split into a separate service if scale or team boundaries justify it later

## Approved Architecture Target

### Application layer

- Next.js 14 app router
- Node.js runtime for route handlers and server logic
- shared server domain services under `lib/server/*`

### Data layer

- Neon Postgres
- Prisma schema and generated client
- environment-managed connection strings

### Operations layer

- Vercel deployments
- Vercel cron for cleanup and maintenance jobs
- Sentry for backend and frontend monitoring

### Security layer

- token-based event access
- admin/scorer/viewer separation
- environment secrets for cron and admin cleanup endpoints
- move toward audited production secrets and least-privilege configuration

## Current Evidence From The Codebase

The codebase already supports this direction and much of Phase 1 is in place:

- Prisma schema exists in `prisma/schema.prisma`
- Prisma service layer exists in `lib/server/`
- key event, score, team, lifecycle, archive, export, cleanup, and health routes have already been migrated
- public scoreboard flow now uses Prisma-backed APIs
- old public route redirects to the new scoreboard path
- Firebase runtime helpers and dependencies have been removed from the active app runtime
- Render config has been removed from the repo

## What Still Needs To Be Done

These are the remaining approval-to-execution items:

1. Replace the old placeholder or legacy `DATABASE_URL` with a real Neon connection string.
2. Optionally add `DIRECT_DATABASE_URL` for Prisma administrative operations if needed.
3. Run end-to-end verification against the real Neon target.
4. Finalize Phase 1 cleanup documentation and mark completed items in the master phase plan.
5. Confirm the production deployment path on Vercel and provision required environment secrets.

## Short Action Plan

1. Confirm Neon as the approved production database.
2. Provision the real Neon database and credentials.
3. Apply Prisma validation and migrations against Neon.
4. Re-run typecheck, build, and live flow verification.
5. Finish Phase 1 documentation and then move phase-by-phase through the remaining CTO proposal items.

## Recommendation

Approve the following production backend stack now:

- Node.js on Next.js route handlers
- Neon Postgres
- Prisma
- Vercel
- Sentry

This is the best balance of affordability, development speed, operational simplicity, and long-term maintainability for the current project.

## Approval Statement

Proposed approval:

"We approve the Game Count System backend to run on Node.js using Next.js server routes, Prisma, and Neon Postgres, with Vercel as the primary deployment platform and Firebase and Render removed from the production runtime."
