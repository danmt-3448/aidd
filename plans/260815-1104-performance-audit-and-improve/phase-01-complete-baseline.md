# Phase 01 — Complete baseline (before-evidence)

**Goal:** finish the "before" evidence that's still missing so improvements are measurable.
Bundle baselines already captured (Turbopack + webpack). Missing: Lighthouse + DB timing.

## Steps
1. **Ensure real seeded data + authed session** (same state used for after-measure):
   - `npm run db:reset` (schema + seed:auth + seed:demo)
   - ensure `e2e/.auth/user.json` exists (else `npx playwright test e2e/auth-check.spec.ts`)
2. **Prod runtime for Lighthouse** (the shipped Turbopack build): `npx next build` then **`npx next start -p 3001`** (background).
   - ⚠️ **Port trap (review F1):** `npm run start` binds **3000**; Playwright + this plan expect **3001**. Always use `npx next start -p 3001`.
3. **Lighthouse, median of ≥3 runs**, mobile throttle (guideline default), authed session, per route:
   `/board`, `/` (homepage), `/kudos` (+ optionally `/profile`, `/countdown`).
   - **Authed-session mechanism (review — was unresolved):** most routes are behind the auth guard. Drive
     Lighthouse through a Playwright-launched Chromium that loads `e2e/.auth/user.json` storageState, then
     point Lighthouse at that browser's remote-debugging port (`chrome-launcher`/`lighthouse` node API against
     the existing page). Simpler fallback: extract the Supabase auth cookies from `e2e/.auth/user.json` and pass
     via Lighthouse CLI `--extra-headers '{"Cookie":"sb-...=..."}'`. Verify the run actually rendered authed
     content (not a redirect to /login) before trusting numbers. If neither works headlessly, measure `/login`
     + `/countdown` (public) for CWV and note authed routes as "bundle-only baseline" honestly.
   - Save raw JSON → `evidence/before/lighthouse-{route}-run{n}.json`; record median LCP/FCP/TBT/CLS/Perf-score → `evidence/before/lighthouse-summary.md`.
   - Cold cache: fresh `next start` before the set; same seed state.
4. **DB timing** (hot queries from `board-queries.ts`, `profile-queries.ts`, leaderboard RPCs):
   `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres` → `EXPLAIN (ANALYZE, BUFFERS)` on the
   actual queries/RPCs the app runs → `evidence/before/db-baseline.txt`. Flag any `Seq Scan` on hot tables.

## Success criteria
- `evidence/before/lighthouse-summary.md` has median CWV for ≥3 routes.
- `evidence/before/db-baseline.txt` has EXPLAIN plans for board feed, profile feed, leaderboard/spotlight RPC.
- No code changed in this phase.

## Notes
- If Lighthouse can't run headless reliably (Turbopack dev hydration issue noted in memory), use the **prod
  `next start`** build (not dev) — memory `ui-gate-turbopack-headless-hydration` says prod build is required
  for behavior/interactive measurement. Property/CWV on prod build is valid.
