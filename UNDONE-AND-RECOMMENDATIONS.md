# Undone Items & Recommendations

## Outstanding Work
- Finalize production-ready seed/test data flow to keep environments isolated without manual resets.
- Harden admin audit trail (persisted history + download) and expose a minimal read-only view for compliance.
- Add automated accessibility pass (axe + keyboard traps) across dashboard, admin, and public views.
- Build a lightweight status/uptime banner fed by a health endpoint to surface DB/API issues quickly.
- Improve mobile breakpoints for admin tables and scoreboard to avoid horizontal scroll at small widths.
- Complete smoke-test automation (Playwright/Cypress) for add/reset points, scoreboard rendering, and token-protected flows.
- Add optimistic UI + retry queue for point submissions to survive brief network blips.
- Finalize database backup/restore runbook and include roll-forward/roll-back instructions.

## Recommendations
- Introduce per-route caching strategy (ISR for public scoreboard, short SWR for dashboard) with clear invalidation on scoring events.
- Centralize API error taxonomy (401/403/500/network) into a shared helper to keep UI handling consistent.
- Add feature flags for risky changes (scoring algorithm, history visibility) using an environment-driven toggle library.
- Instrument with metrics and structured logs (request timing, mutation failures, auth anomalies) and wire to dashboards/alerts.
- Define a performance budget (TTFB, LCP, CLS) and add a CI check using Lighthouse CI against key pages.
- Expand role model to support temporary tournament volunteers with expiring access tokens.
- Ship a design pass: consistent spacing scale, typography tokens, and reusable button/table primitives to reduce drift.
- Create a release checklist (schema migration order, seed data validation, post-deploy smoke tests) and keep it version-controlled.
