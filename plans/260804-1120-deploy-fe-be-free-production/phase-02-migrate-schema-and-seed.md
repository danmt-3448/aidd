# Phase 02 — Migrate schema + seed to cloud

**Priority:** High · **Status:** ✅ DONE (2026-08-15) · **Depends on:** 01 · **Owner role:** deployer / be-developer

> ✅ **Done 2026-08-15.** Pushed via **session pooler** (`aws-0-ap-northeast-1.pooler.supabase.com:5432`) because the
> direct host `db.<ref>.supabase.co` is **IPv6-only** (Mac IPv4 couldn't reach it) — used `supabase db push --db-url <pooler>`.
> Verified on cloud: **31/31 migrations**, 30 auth users, 30 profiles, 12 hashtags, 7 departments, event_config=1,
> **all 12 tables RLS on**, realtime publication includes `kudos`. Reference seed via `psql -f seed.sql` (INSERT 12);
> auth users via `seed-auth-users.mjs` (30 created, secret_box grants). Demo data NOT seeded (prod-safe).
> `event_config.event_start_at` adjusted to `2026-08-15 20:00+07` per request (countdown target).

> ⏸️ **Deferred deliberately.** `db push` is incremental so early migration isn't wasted, but pushing now
> risks drift if an existing migration file gets edited or `db reset` runs during dev. Run this phase once
> schema settles. Rule while deferred: **add new migration files, never edit already-shipped ones.** CLI ref: `ngsvtvfhgtarbzvlfyrz`.

> 🔄 **Cập nhật 2026-08-15 (schema-deploy-readiness audit).** Số migration đã tăng **13 → 31**. Audit kết luận
> schema **SẴN SÀNG**: 31 migration apply sạch lên DB trống (`db:reset` exit 0, `schema_migrations` 31/31, no drift);
> 12 bảng đều bật RLS; mọi `SECURITY DEFINER` function set `search_path = public`; realtime publication + trigger
> `handle_new_user` trên `auth.users` + storage bucket/policy + `pg_trgm` đều tương thích cloud. Chi tiết:
> `plans/reports/schema-deploy-readiness-260815-1446.md`.

## Goal
Replay **31 migrations** onto the cloud DB, then seed **reference data only** (hashtags/config + auth users).
Reproducible from a clean project — no manual SQL. **KHÔNG seed demo data lên prod.**

## Context Links
- Migrations: `supabase/migrations/` (**31 files**, `20260730062749_create_profiles` → `20260812000000_spotlight_recent_activity`)
- Reference seed (prod-safe, idempotent): `supabase/seed.sql` (hashtag catalog + event/special-day config)
- Auth seed: `supabase/seed-auth-users.mjs` (GoTrue admin API — idempotent, fixed UUIDs)
- ⚠️ **KHÔNG chạy** `supabase/seed-demo-data.sql` trên prod (30 user + 71 kudo demo — chỉ để dev/gate). `config.toml [db.seed]` chỉ load `seed.sql` nên `db push`/`db reset` không tự đẩy demo lên.
- **Cloud precondition:** project phải **Postgres 17** (khớp `config.toml major_version = 17`).

## Steps
1. `supabase login` (if not already) → paste access token.
2. Link local project to cloud: `supabase link --project-ref <ref>` (enter DB password from Phase 01).
3. **Push schema:** `supabase db push` → applies all **31 migrations** in order. Confirms the diff before applying.
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
- [ ] Cloud project là **Postgres 17**
- [ ] `supabase link` succeeded
- [ ] `supabase db push` applied all **31 migrations** (không lỗi)
- [ ] `supabase_realtime` publication includes `kudos` (+ `hearts`, `notifications`)
- [ ] `seed.sql` run on cloud (hashtags + config) — **KHÔNG chạy seed-demo-data.sql**
- [ ] `seed-auth-users.mjs` run against cloud, users + profiles present
- [ ] Spot-check RLS: `select tablename from pg_tables t join pg_class c ...` — cả 12 bảng `rowsecurity = true`

## Success Criteria
Cloud DB schema == local (31 migration applied); reference tables seeded; seeded user tìm thấy trong `auth.users`;
RLS bật đủ 12 bảng; realtime publication có `kudos`; không có demo data trên prod.

## Risks
- **Wrong target** — double-check env vars point at cloud, not local `127.0.0.1:54321`, before seeding.
- **`db push` on a non-empty DB** — cloud is fresh, so clean apply; if re-running, `push` only adds new migrations.
- **RLS/permissions** — `grant_kudos_privileges` + view-security migrations must apply, or anon reads break. Verify no push errors.
- **`pg_trgm` in public** — migration `20260804000000` tạo `pg_trgm` không kèm `SCHEMA extensions` → advisor cảnh báo "extension in public" (cosmetic, không chặn).
- **Auth redirect** — `config.toml site_url = localhost:3001` chỉ local; prod phải set site_url + Google OAuth redirect trong Dashboard (Phase 04), nếu không login/OAuth fail.

## Next
Phase 04 (auth wiring) after both this and Phase 03 land.
