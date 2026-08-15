# Phase 05 — Re-measure + full test + report (barrier)

**Depends on:** 02, 03, 04 complete. No src edits here except reverts.

## Steps
1. **Final after-build & bundle** (same machine/state as before):
   - `/usr/bin/time -p npx next build` (Turbopack) → `evidence/after/build-after-turbopack.log`.
   - Turbopack chunk totals raw+gzip → `evidence/after/bundle-after-turbopack.txt`.
   - `ANALYZE=true npx next build --webpack` → copy treemap HTML into `evidence/after/`.
2. **Final Lighthouse** (median≥3, cold, same seed via `npm run db:reset` — **requires Supabase up**, same authed mechanism as phase-01, `npx next start -p 3001`) on the same routes as before → `evidence/after/lighthouse-summary.md`.
3. **DB timing after** (if any query touched — none planned; capture only if changed).
4. **Full feature test (user's explicit request — evidence not required here):**
   - **Prereqs (review F6):** local Supabase up (`supabase status`; else `supabase start`) + `npm run db:reset`;
     **`npx next start -p 3001` running in background** (Playwright has `webServer: undefined` → does NOT auto-start;
     wrong/missing server = silent connection-refused hang).
   - `npm run test` (vitest, all) → green.
   - **e2e — avoid the countdown/event_config race (review F6):** `countdown.spec.ts` runs serial and mutates
     `event_config.event_start_at` (pre-launch), which races the authed board/homepage/profile suites (expect LIVE).
     Run countdown first & isolated: `npx playwright test e2e/countdown.spec.ts --project=public` → then ensure event
     restored to past/LIVE → then `npm run test:e2e` for the rest (or run `--project=authed` and `--project=admin` after).
   - Gate UI sanity: `/aidd-ui-gate` re-pass on touched screens (countdown, board); spot-check other screens didn't regress.
5. **Write report** `plans/reports/performance-report.md`:
   - Before→after table: Turbopack bundle total raw+gzip, per-key-chunk, build time, Lighthouse median per route, DB timing.
   - **Per-candidate verdict** (kept / reverted / neutral-kept) + delta + Vercel-validity note.
   - **The compression-on-Vercel answer** with numbers (spec §7): state plainly whether "build nén source" helped, and that on Vercel the real lever was client-bundle reduction.
   - Deploy note: every kept change is a net-win-or-neutral on Vercel; nothing self-host-only shipped.

## Success criteria (Definition of Done)
- Complete before/after evidence for bundle + build time + Lighthouse.
- All unit + e2e green; UI-First Gate re-passed on touched screens; no console errors.
- Report written with honest per-candidate verdicts and the compression answer.
- **No commit / no push.** Working tree holds the kept changes; reverted candidates fully backed out.

## If tests fail
- Locate offending candidate via `git diff` → revert only that hunk → re-measure → re-test.
- Max 3 fix loops per spec workflow; if still failing → stop and surface to user (do not force-green).
