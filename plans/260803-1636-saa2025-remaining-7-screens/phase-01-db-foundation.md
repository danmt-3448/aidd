---
title: DB foundation migrations
work_type: feature
track: B
status: completed
blockedBy: []
blocks: [02, 03, 04, 05, 06, 15]
spec_source: momorph:MaZUn5xHXZ
---

# Phase 01 — DB foundation migrations (Track B · DB)

## Context Links
- Recon: `plans/reports/check-progress-260803-1636-remaining-screens.md` (§ Data model delta)
- Existing model: `supabase/migrations/20260731000000_create_kudos.sql`, `20260730062749_create_profiles.sql`
- **GRANT precedent (READ THIS):** `supabase/migrations/20260731010000_grant_kudos_privileges.sql` — RLS gates
  WHICH rows; a `GRANT` gates whether the role may touch the table AT ALL. Live login testing already
  hit "permission denied" once; every new table below MUST ship its GRANT in the same migration.
- Schema doc: `docs/database-schema.md`
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Confirmed disk facts (do not re-derive)
- `kudos` base cols: `id, sender_id, receiver_id, content_html, is_anonymous, anonymous_name, created_at`.
- `profiles` cols: `id, email, full_name, avatar_url, department_id (int, nullable, no FK), title,
  kudos_received_count, kudos_sent_count, hearts_received, star_level, is_admin (bool), created_at`.
- Admin flag is **`profiles.is_admin`** (NOT `profiles.role` — that column does not exist).
- `20260731000000_create_kudos.sql` ~line 67: `kudos_select_authenticated USING(true)` — this is the leak.

## Overview
- **Priority:** P1 (root of Track B — every logic phase depends on it)
- **Status:** planned
- One migration file per concern (revert independently). Each new table ships **RLS + GRANT together**.

## Key Insights
- **CRITICAL (M3 carried from Viết Kudo):** `kudos_select_authenticated USING(true)` leaks `sender_id`
  of anonymous rows. This phase **DROPS** that policy and replaces it with `kudos_select_own` (owner/
  receiver only). Third-party reads of the feed go through the **sender-masked view `kudos_public`** —
  which is now the *enforced* (only) read path for board/profile, not merely a convention.
- **Realtime leak (C-RT):** Supabase Realtime broadcasts full base-table rows → an anon kudo's
  `sender_id` would leak over the wire even with `kudos_public` in place. Fix at the publication level:
  `ALTER PUBLICATION supabase_realtime SET TABLE kudos (id, created_at)` so only non-identifying columns
  broadcast. Consumers (phase-04/03) use the event as an *invalidation signal only* and re-fetch via `kudos_public`.
- `profile_stats` is a **caller-scoped SQL VIEW**, computed live. It does NOT trust the denormalized
  `profiles.*_count` columns; `hearts_received` = live `count(*)` from `hearts`. `sent` is null for non-callers.

## Requirements

### Tables (each = own migration, RLS + GRANT in the same file)
1. `event_config` — `id smallint pk default 1 check (id=1)`, `event_start_at timestamptz not null`,
   `hearts_special_multiplier int not null default 1`, `updated_at timestamptz not null default now()`. Seed one row.
2. `hearts` — `user_id uuid not null → profiles`, `kudo_id uuid not null → kudos on delete cascade`,
   `liked_at timestamptz not null default now()`, `is_special_day boolean not null default false`,
   **PK `(user_id, kudo_id)`** (1 heart / user / kudo — also serves as the unique guard).
3. `special_day_config` — `event_date date primary key`, `hearts_multiplier int not null default 1`.
4. `secret_box` — `user_id uuid primary key → profiles`, `unopened_box_count int not null default 0
   check (unopened_box_count >= 0)`, `updated_at timestamptz not null default now()`. Seed manually.
5. `secret_box_badges` — `id uuid pk default gen_random_uuid()`, `user_id uuid not null → profiles`,
   `badge_key text not null`, `opened_at timestamptz not null default now()`.
6. `notifications` — `id uuid pk default gen_random_uuid()`, `user_id uuid not null → profiles`,
   `type text`, `title text`, `body text`, `link text`, `is_read boolean not null default false`,
   `created_at timestamptz not null default now()`. Index `(user_id, is_read)`.
   > **Ordering note:** this migration's timestamp MUST precede phase-03's `notify_on_kudo_insert`
   > trigger migration (trigger inserts into this table). Keep phase-03 strictly later on the clock.

### Indexes
7. `CREATE INDEX IF NOT EXISTS hearts_kudo_id_idx ON public.hearts (kudo_id);` (heart-count aggregation by kudo).

### Views (both `security_invoker = true`)
8. `kudos_public` — masked read path. Join `profiles` LEFT on both sides. Blueprint DDL:
```sql
create view public.kudos_public with (security_invoker = true) as
select
  k.id,
  k.receiver_id,
  k.content_html,
  k.created_at,
  k.is_anonymous,
  -- sender masked for anon rows
  case when k.is_anonymous then null else k.sender_id end            as sender_id,
  case when k.is_anonymous
       then coalesce(k.anonymous_name, 'Ẩn danh')
       else sp.full_name end                                          as sender_name,
  case when k.is_anonymous then null else sp.avatar_url end           as sender_avatar_url,
  -- receiver ALWAYS visible (board/profile need the recipient)
  rp.full_name                                                        as receiver_name,
  rp.avatar_url                                                       as receiver_avatar_url
from public.kudos k
left join public.profiles sp on sp.id = k.sender_id
left join public.profiles rp on rp.id = k.receiver_id;
```
   > `security_invoker` means the view runs under the caller's RLS. With `kudos_select_own` on the base
   > table, a bare `select * from kudos` returns only the caller's own/received rows — but the view is
   > **granted broad SELECT** (step below) so third parties read the feed *through the mask only*. Confirm
   > the invoker semantics allow the view's own grant to govern feed reads (test in Success Criteria).
9. `profile_stats` — caller-scoped VIEW. Blueprint DDL:
```sql
create view public.profile_stats with (security_invoker = true) as
select
  p.id as user_id,
  (select count(*) from public.kudos k where k.receiver_id = p.id)             as received,
  case when p.id = auth.uid()
       then (select count(*) from public.kudos k where k.sender_id = p.id)
       else null end                                                            as sent,
  (select count(*) from public.hearts h                                         -- LIVE, not profiles col
     join public.kudos k on k.id = h.kudo_id where k.receiver_id = p.id)        as hearts_received,
  (select count(*) from public.secret_box_badges b where b.user_id = p.id)      as boxes_opened,
  coalesce((select sb.unopened_box_count from public.secret_box sb where sb.user_id = p.id), 0)
                                                                                as boxes_remaining
from public.profiles p;
```

### RLS (per table)
- `kudos` (MODIFY existing migration or add a new one): **DROP** `kudos_select_authenticated`;
  **ADD** `kudos_select_own` — `for select to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid())`.
  (INSERT policy `kudos_insert_own` stays untouched.) `kudos_public` becomes the enforced third-party read path.
- `hearts`: INSERT own + self-heart guard —
  `for insert with check (auth.uid() = user_id and not exists (select 1 from public.kudos k where k.id = kudo_id and k.sender_id = auth.uid()))`;
  DELETE own (`auth.uid() = user_id`); SELECT authenticated.
- `secret_box` / `secret_box_badges`: SELECT own only; **no** client INSERT/UPDATE (mutated by DEFINER RPC, phase 06).
- `notifications`: SELECT own; UPDATE own (`is_read`); **no** client INSERT (trigger only, phase 03).
- `event_config` / `special_day_config`: SELECT authenticated; no client write.

### GRANTs (one block; mirrors the `20260731010000` precedent)
```sql
grant select on public.event_config          to authenticated;
grant select on public.special_day_config    to authenticated;
grant select, insert, delete on public.hearts to authenticated;   -- RLS still gates rows
grant select on public.secret_box            to authenticated;    -- read-own; writes via RPC
grant select on public.secret_box_badges     to authenticated;
grant select, update on public.notifications to authenticated;    -- update = mark-read only (RLS)
grant select on public.kudos_public          to authenticated;    -- the masked feed read path
grant select on public.profile_stats         to authenticated;
```

### Realtime publication (strip identity from broadcast)
```sql
alter publication supabase_realtime set table public.kudos (id, created_at);
alter publication supabase_realtime add table public.hearts;          -- id/user/kudo only, no sender
alter publication supabase_realtime add table public.notifications;   -- consumer filters user_id
```
> `kudos` broadcast is limited to `(id, created_at)` — a pure invalidation signal. `sender_id`/`content_html`
> never cross the wire. Phase-04/03 re-fetch through `kudos_public` on signal.

## Architecture — data flow
```
kudos (sender present, RLS=own) ──view kudos_public (masks anon sender, receiver always shown)──▶ board/profile feeds (04,05)
Realtime pub kudos(id,created_at) ──signal only──▶ phase-04/03 re-fetch via kudos_public
hearts ──▶ ranking + count (04) ; PK(user,kudo)+self-heart CHECK enforce integrity
secret_box(+badges) ──RPC open_secret_box (06)──▶ decrement + badge
event_config ──▶ countdown (02) + homepage ; profile_stats (caller-scoped) ──▶ stats card (05)
notifications ──trigger on kudos insert (03)──▶ unread badge + Realtime
```

## Related Code Files
- **Create:** `supabase/migrations/2026XXXX0001_create_event_config.sql`, `..._create_hearts.sql`,
  `..._create_special_day_config.sql`, `..._create_secret_box.sql`, `..._create_notifications.sql`,
  `..._create_kudos_public_view.sql`, `..._create_profile_stats_view.sql`,
  `..._fix_kudos_select_rls_and_realtime.sql` (drop `kudos_select_authenticated`, add `kudos_select_own`, publication).
- **Modify:** `docs/database-schema.md` (append — done in phase 17).
- **Delete:** none.

## Implementation Steps
1. One migration per table/view/RLS-fix above; timestamps sequential after `20260731010000`.
   notifications-table migration **before** the phase-03 trigger clock.
2. Every new table: enable RLS + its policies + its GRANT in the same file.
3. `kudos_public` (invoker) with anon-mask CASE + receiver_name/avatar; GRANT SELECT to `authenticated`.
4. Drop `kudos_select_authenticated`; add `kudos_select_own`.
5. `profile_stats` (invoker) keyed to `auth.uid()`; `sent` null-guarded, `hearts_received` live from `hearts`.
6. `alter publication supabase_realtime` — kudos to `(id, created_at)`; add hearts, notifications.
7. `hearts_kudo_id_idx`; seed one `event_config` row (placeholder datetime, TZ note Asia/Ho_Chi_Minh); no secret_box seed.
8. `supabase db reset` — all migrations apply clean + idempotent (`if not exists` on tables/indexes).

## Rollback (per migration)
- Table migrations: `drop table if exists public.<t> cascade;` (drops its policies + grants with it).
- View migrations: `drop view if exists public.<v>;`.
- RLS-fix migration: reverse = re-create `kudos_select_authenticated USING(true)`, drop `kudos_select_own`,
  `alter publication supabase_realtime set table public.kudos;` (all cols). Documented in the file header.

## Todo
- [ ] event_config table + RLS + GRANT + seed row
- [ ] hearts table + PK(user,kudo) + self-heart CHECK + `hearts_kudo_id_idx` + RLS + GRANT
- [ ] special_day_config table + RLS + GRANT
- [ ] secret_box + secret_box_badges tables + RLS (SELECT-own) + GRANT (SELECT only)
- [ ] notifications table + index + RLS (SELECT/UPDATE own) + GRANT (SELECT,UPDATE) — timestamp before phase-03
- [ ] kudos_public view (anon sender masked, receiver_name/avatar always) + GRANT SELECT
- [ ] profile_stats view (caller-scoped, sent null for others, hearts live from hearts) + GRANT SELECT
- [ ] DROP kudos_select_authenticated + ADD kudos_select_own
- [ ] ALTER PUBLICATION supabase_realtime: kudos (id, created_at) + add hearts + notifications
- [ ] db reset applies clean + idempotent

## Success Criteria (binary)
- [ ] `supabase db reset` applies all new migrations with zero errors.
- [ ] As user C (neither sender nor receiver): `select sender_id, receiver_name from kudos_public` for an
      anon kudo returns `sender_id = NULL` and a non-null `receiver_name`.
- [ ] As user C: `select * from kudos where <anon kudo>` returns 0 rows (base RLS = own/receiver only).
- [ ] `profile_stats` for user A queried as user B returns `sent = NULL`; `hearts_received` equals live `count(hearts)`.
- [ ] Direct client INSERT into `secret_box` / `notifications` rejected by RLS.
- [ ] `hearts` rejects a 2nd row for same `(user_id, kudo_id)` (PK) and rejects a self-heart (CHECK subquery).
- [ ] `supabase_realtime` publication for `kudos` exposes only `id, created_at` (verify pg_publication_tables).

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| View leaks sender for anon rows | Med | **High** | Anon-mask binary test above; block ship on failure |
| Realtime broadcasts anon sender_id | Med | **High** | Publication column-list restricts kudos to `(id, created_at)`; verify test |
| profile_stats exposes other's sent | Med | **High** | Caller-scoped null-guard + explicit test |
| Missing GRANT → "permission denied" | **High** | Med | GRANT block shipped with every table (precedent 20260731010000) |
| Migration ordering conflict | Low | Med | Sequential timestamps; notifications-before-trigger note; `if not exists` |

## Security Considerations
- Anon masking is DB-enforced (RLS `kudos_select_own` + `kudos_public` view + Realtime column-list), not app-layer.
- All mutating box/notification paths are DEFINER RPC / trigger only; no client write policy.

## Next Steps
- Unblocks 02 (event config), 03 (notifications), 04 (hearts/board), 05 (profile), 06 (secret box).

## MoMorph refs:
- Live board (uses hearts + kudos_public): https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
