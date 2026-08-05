# Phase 02 — Migrate schema + seed to cloud

**Priority:** High · **Status:** DEFERRED (run at deploy time) · **Depends on:** 01 · **Owner role:** deployer / be-developer

> ⏸️ **Deferred deliberately.** `saa2025-remaining-7-screens` still in progress → schema may change.
> `db push` is incremental so early migration isn't wasted, but pushing now risks drift if an existing
> migration file gets edited or `db reset` runs during dev. Run this phase once schema settles. Rule
> while deferred: **add new migration files, never edit already-shipped ones.** CLI ref: `ngsvtvfhgtarbzvlfyrz`.

## Goal
Replay the 13 migrations onto the cloud DB, then seed reference data (hashtags/config + auth users).
Reproducible from a clean project — no manual SQL.

## Context Links
- Migrations: `supabase/migrations/` (13 files, `20260730…` → `20260731110000`)
- Reference seed: `supabase/seed.sql` (hashtags, event/special-day config)
- Auth seed: `supabase/seed-auth-users.mjs` (GoTrue admin API — idempotent, fixed UUIDs)

## Steps
1. `supabase login` (if not already) → paste access token.
2. Link local project to cloud: `supabase link --project-ref <ref>` (enter DB password from Phase 01).
3. **Push schema:** `supabase db push` → applies all 13 migrations in order. Confirms the diff before applying.
4. **Verify realtime:** confirm migration `20260731090000_fix_kudos_select_rls_and_realtime.sql` applied and
   `kudos` is in the `supabase_realtime` publication (Supabase Studio → Database → Publications, or
   `select * from pg_publication_tables where pubname='supabase_realtime';`). Kudos live-updates depend on it.
5. **Seed reference data:** run `seed.sql` against cloud — Studio SQL editor (paste + run) **or**
   `psql "$SUPABASE_DB_URL" -f supabase/seed.sql`.
6. **Seed auth users** against cloud (NOT via `npm run seed:auth` — that loads `.env.local`/local):
   ```bash
   SUPABASE_URL="<cloud url>" SUPABASE_SERVICE_ROLE_KEY="<cloud service_role>" \
     node supabase/seed-auth-users.mjs
   ```
   Script is idempotent; `handle_new_user` trigger auto-creates `profiles` rows.
7. **Spot-check** in Studio: `auth.users` populated, `profiles` rows present, `hashtags` + config tables filled.

## Todo
- [ ] `supabase link` succeeded
- [ ] `supabase db push` applied all 13 migrations
- [ ] `supabase_realtime` publication includes `kudos`
- [ ] `seed.sql` run on cloud
- [ ] `seed-auth-users.mjs` run against cloud, users + profiles present

## Success Criteria
Cloud DB schema == local; reference tables seeded; seeded user can be found in `auth.users`; RLS policies present.

## Risks
- **Wrong target** — double-check env vars point at cloud, not local `127.0.0.1:54321`, before seeding.
- **`db push` on a non-empty DB** — cloud is fresh, so clean apply; if re-running, `push` only adds new migrations.
- **RLS/permissions** — `grant_kudos_privileges` + view-security migrations must apply, or anon reads break. Verify no push errors.

## Next
Phase 04 (auth wiring) after both this and Phase 03 land.
