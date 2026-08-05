# Phase 05 — Smoke test + keep-warm

**Priority:** High · **Status:** pending · **Depends on:** 04 · **Owner role:** tester / deployer

## Goal
Prove every core flow works in prod, then decide the free-tier keep-warm strategy. Record the SEALED
verdict the evidence gate requires before deploy is called done.

## Steps — smoke test (against the `*.vercel.app` URL)
1. **Auth — Google:** click Google login → consent → land authenticated in app.
2. **Auth — email/password:** log in as a seeded user (e.g. `nguyen.van.an@sun-asterisk.com` / `TestPass123!`).
3. **Kudos realtime:** create a kudo → appears without reload; open a 2nd tab/user → sees it live.
4. **Hearts:** send/receive a heart; count updates.
5. **Secret box:** open the box RPC path → reward flow works.
6. **Event countdown:** reflects `EVENT_START_AT`.
7. **RLS / security:** logged-out user cannot read protected data; `/dev-login` → 404.
8. Check Vercel function logs + Supabase logs for errors during the run.

## Steps — keep-warm decision (free tier pauses after ~7 days idle)
9. **Decision (internal use): cron ping if trivial, else manual resume.** Simplest zero-code option:
   - **cron-job.org** (free) → add a job GET-ing the `*.vercel.app` home page every ~3 days. 1-min setup, no repo change. ← recommended trivial path
   - Alt: GitHub Actions scheduled workflow curl-ing the URL (free, lives in repo).
   - Fallback: manual resume in Supabase Studio before the event (zero setup).
10. Note the 500MB DB cap — fine for this app's data volume; revisit only if storage grows.

## Todo
- [ ] All 8 smoke checks pass, screenshots/notes captured
- [ ] Keep-warm strategy chosen and (if A) configured
- [ ] SEALED verdict written to `evidence/`

## Success Criteria
Every flow green in prod; no error-level logs; keep-warm decided; evidence recorded → deploy officially done.

## Risks
- **Realtime silent-fail** — if kudos don't live-update, re-check Phase 02 step 4 (publication).
- **OAuth works local but not prod** — re-verify Phase 04 three-places alignment.
- **Free-tier pause mid-event** — mitigated by chosen keep-warm (step 9).

## Next
Deploy complete. Update `docs/` (system-architecture + changelog: production deployment) via doc-writer.
