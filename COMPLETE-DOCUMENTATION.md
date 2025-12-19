# Complete Documentation

## Overview
Game Count System is a Next.js 14 application that manages competitive event scoring end-to-end. It includes authenticated dashboards for creating events, onboarding teams, recording scores, and publishing a public scoreboard via share tokens. The stack uses React (app router), PostgreSQL, and secure JWT-based auth.

## Architecture
- **Frontend**: Next.js app router with protected dashboard pages, event views, public/embedded scoreboard, and auth (login/register). Styling via Tailwind; client-side data via fetch/api client.
- **API**: Next.js route handlers under `app/api` for auth, events, teams, scores, and public scoreboard access.
- **Data**: PostgreSQL with UUID primary keys, cascades, indexes, and triggers to maintain `total_points` rollups.
- **Auth**: JWT tokens (7-day expiry) with middleware-based protection and Zod validation on inputs.

## Features Built
- **Authentication**: User registration and login endpoints issue JWTs; protected routes enforce ownership.
- **Event Management**: Create/list events, duplicate/delete endpoints (per UI), and share-token generation for public viewing.
- **Team Management**: Add/list teams per event with optional avatar URLs; totals maintained via DB triggers.
- **Scoring**: Add scores per game number; server returns updated team totals; fetch scores per event.
- **Public Scoreboard**: Token-based read-only view returning event details, teams, and score rows for embedding or sharing.
- **Dashboard UX**: Auth-guarded dashboard that lists events, supports search/filter, create wizard, duplication, and delete confirmation with loading skeletons and greeting header.
- **Security & Validation**: bcrypt password hashing, prepared statements via `@vercel/postgres`, Zod schemas for input validation, nanoid-generated share tokens.

## API Surface (current)
- `POST /api/auth/register` – create user and issue token.
- `POST /api/auth/login` – authenticate and issue token.
- `GET /api/auth/me` – fetch authenticated user profile.
- `POST /api/events/create` – create event and share token.
- `GET /api/events/list` – list events for the authenticated owner.
- `POST /api/events/{id}/duplicate` – duplicate an event (used by dashboard action).
- `DELETE /api/events/{id}` – delete an event (used by dashboard action).
- `POST /api/teams/add` – add team to an event.
- `GET /api/teams/list?event_id=` – list teams for an event.
- `POST /api/scores/add` – record a score for a team/game number.
- `GET /api/scores/by-event?event_id=` – fetch scores for an event.
- `GET /api/public/{share-token}` – public scoreboard payload for embedding/sharing.

## Data Model
- **Users**: Auth principals storing name/email/password hash, JWT secret rotation supported via script.
- **Events**: Owned by users; share token for public view; cascade deletes to teams/scores.
- **Teams**: Belong to an event; optional avatar URL; `total_points` maintained by trigger.
- **Scores**: Belong to team/event with `game_number`, `points`; used to recompute team totals.

## Frontend Flows
- **Register/Login**: Capture credentials, obtain JWT, and store for authenticated calls.
- **Dashboard**: Lists events with search/filter; supports creation (setup wizard), view/edit navigation, duplication, and deletion with confirmation.
- **Event View**: Navigate to `/event/{id}` for team/score operations (per UI components).
- **Public Scoreboard**: `/scoreboard/{token}` or embedded public view powered by the public API route.

## Security & Compliance
- bcrypt (10 rounds) for password hashing.
- JWT auth with 7-day expiry; `Authorization: Bearer <token>` required on protected endpoints.
- Zod validation on request bodies; sanitized SQL via prepared statements.
- Cascade deletes and indexes to preserve integrity and performance.

## Setup & Operations
- Install dependencies: `npm install`.
- Configure environment: copy `.env.example` to `.env` and set `POSTGRES_URL`, `JWT_SECRET`.
- Database schema: apply `schema.sql` to PostgreSQL; triggers handle total recalculation.
- Local dev: `npm run dev`.
- Build/start: `npm run build` then `npm start`.
- Utilities: `npm run generate-secret` (JWT secret), `npm run check-db` (db health), `npm run migrate` (run migrations script).

## Deployment
- Deployable to Vercel; set env vars (`POSTGRES_URL`, `JWT_SECRET`, `NODE_ENV`) in hosting environment.
- Serverless-friendly route handlers; uses `@vercel/postgres` for managed Postgres.

## Known Gaps & Next Steps
- See `UNDONE-AND-RECOMMENDATIONS.md` for outstanding items (seed data isolation, audit trail, accessibility pass, mobile polish, automated smoke tests, optimistic updates, backup runbook, caching strategy, feature flags, instrumentation, performance budgets, role expansion, design tokens, release checklist).
