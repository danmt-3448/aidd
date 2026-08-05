# BE Performance Audit — AIDD (SAA 2025)
**Date:** 2026-08-04  
**Auditor:** debugger agent  
**Scope:** Static analysis (migrations + RLS + views + RPC) + live EXPLAIN on local Supabase  
**Standard:** `docs/performance-guidelines.md` §1 budgets + §3 BE checklist

---

## Summary — Worst 3

| # | Finding | Why it hurts at event scale |
|---|---------|----------------------------|
| 1 | **`getHighlightKudos` pulls up to 2 000 kudos + all hearts into JS for ranking** | Full Seq Scan on `kudos` + Seq Scan on `hearts` + client-side sort. With 500 kudos and 5 hearts each = 2 500 rows over the wire every highlight refresh (triggered by every realtime heart event). EXPLAIN confirms `Seq Scan on kudos` + `Seq Scan on profiles` for the 2 000-row variant. |
| 2 | **`kudos.sender_id` has no index** — Seq Scan on every "sent" profile feed query and every `profile_stats` `sent` subplan | EXPLAIN: `Seq Scan on kudos … Filter: (sender_id = …)`. Grows linearly with kudos table size. Also affects `profile_stats` SubPlan 2 and the `notify_on_kudo_insert` trigger's implicit sender lookup. |
| 3 | **`profile_stats` view runs 5 correlated subqueries per row** — two of them Seq Scan (`kudos` by `sender_id`, `secret_box_badges` by `user_id`) | EXPLAIN SubPlan 2: `Seq Scan on kudos … Filter: sender_id`. SubPlan 4: `Seq Scan on secret_box_badges … Filter: user_id`. These fire on every profile page load and every `getProfileStats` call. |

---

## Findings Table

| Sev | Table / Query | Issue | EXPLAIN evidence | Fix |
|-----|--------------|-------|-----------------|-----|
| **Critical** | `board-queries.ts getHighlightKudos` | Fetches ≤ 2 000 kudos rows + all nested hearts into Node.js for JS-side weighted sort. EXPLAIN (2 000-row variant): `Seq Scan on kudos` + `Seq Scan on profiles sp/rp`. At event scale (hundreds of kudos, thousands of hearts) this is O(kudos × hearts) data over the wire per highlight refresh, which fires on every realtime heart event. | `Seq Scan on kudos k … rows=540` (planner estimate for full table); Hash Left Join pulls all profiles rows. | Replace with a single SQL RPC that does the weighted aggregate server-side and returns only 5 rows (see migration SQL below). |
| **Critical** | `kudos.sender_id` | No index. Used in: (a) profile "sent" feed `WHERE sender_id = ?`, (b) `profile_stats` SubPlan 2 `sent` count, (c) `hearts_insert_own` RLS subquery `k.sender_id = auth.uid()`, (d) `kudo_hashtags_insert_via_owned_kudo` RLS subquery. All degrade to Seq Scan as kudos grows. | `Seq Scan on kudos … Filter: (sender_id = '…')` | `CREATE INDEX idx_kudos_sender_id ON kudos(sender_id);` |
| **Critical** | `profile_stats` view — SubPlan 4 `secret_box_badges` | `Seq Scan on secret_box_badges … Filter: (user_id = p.id)` — no index on `user_id`. Fires on every `getProfileStats` call. | EXPLAIN SubPlan 4: `Seq Scan on secret_box_badges b … Filter: (user_id = p.id)` | `CREATE INDEX idx_secret_box_badges_user_id ON secret_box_badges(user_id);` |
| **Warning** | `profiles.full_name` — `searchRecipients` ILIKE | `ILIKE '%query%'` is a leading-wildcard pattern; a standard B-tree index cannot accelerate it. EXPLAIN: `Seq Scan on profiles … Filter: (full_name ~~* '%nguyen%')`. At 200+ profiles (typical event) this is a full table scan on every keystroke in the recipient autocomplete. | `Seq Scan on profiles … Rows Removed by Filter: 10` | Add `pg_trgm` trigram index: `CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE INDEX idx_profiles_full_name_trgm ON profiles USING gin(full_name gin_trgm_ops);` Accelerates `ILIKE '%…%'`. |
| **Warning** | `profile_stats` view — 5 correlated subqueries | View computes `received`, `sent`, `hearts_received`, `boxes_opened`, `boxes_remaining` as 5 independent subqueries per profile row. Two are Seq Scans (`sender_id`, `secret_box_badges.user_id`). Even after adding the missing indexes, 5 round-trips per profile load is wasteful; if called for many profiles (leaderboard) it will N+1. | EXPLAIN SubPlan 1–5 all run independently; SubPlan 2 + 4 are Seq Scans today. | Short term: fix the two missing indexes (above). Medium term: replace with a single aggregating RPC or materialized view refreshed on kudo/heart insert triggers. |
| **Warning** | RLS policies — bare `auth.uid()` calls | `profiles_update_own`, `kudos_insert_own`, `kudos_select_own`, `hearts_insert_own`, `hearts_delete_own`, `notifications_select_own`, `notifications_update_own`, `secret_box_select_own`, `secret_box_badges_select_own` all call `auth.uid()` directly in `USING`/`WITH CHECK`. Postgres evaluates `auth.uid()` once per row when it is not wrapped in a sub-select, causing unnecessary re-evaluation overhead. | Static analysis of pg_policies output — `qual` column shows bare `(auth.uid() = user_id)` on all per-row policies. | Wrap in a sub-select: `(select auth.uid()) = user_id`. This lets the planner hoist the call and evaluate it once per statement. |
| **Warning** | `hearts_insert_own` RLS — correlated subquery on `kudos` | `WITH CHECK` contains `NOT EXISTS (SELECT 1 FROM kudos k WHERE k.id = kudo_id AND k.sender_id = auth.uid())`. The `k.id` lookup hits the PK index (fast), but `k.sender_id = auth.uid()` is an additional filter with no index — after adding `idx_kudos_sender_id` this is resolved. | Static: `with_check` column in pg_policies. | Fixed by `idx_kudos_sender_id` (Critical fix #2 above). Also wrap `auth.uid()` per Warning above. |
| **Warning** | `getHighlightKudos` — `special_day_config` fetched separately | `toggleHeart` and `getHighlightKudos` each issue a separate `SELECT` on `special_day_config` before the main query. `special_day_config` is a tiny singleton-ish table (PK on `event_date`); the extra round-trip is low cost today but adds latency on every heart toggle. | Code: `board-queries.ts:107`, `heart-actions.ts:136`. | Cache the result in-process (e.g. `unstable_cache` with 60 s TTL) or join it into the main query. |
| **Suggestion** | `secret_box_badges` — ORDER BY `opened_at DESC` | `Seq Scan on secret_box_badges … Sort Key: opened_at DESC`. No index on `(user_id, opened_at)`. With the missing `user_id` index added, the planner may still sort in memory; a composite index covers both filter and sort. | EXPLAIN: `Sort … Seq Scan on secret_box_badges`. | Composite: `CREATE INDEX idx_secret_box_badges_user_opened ON secret_box_badges(user_id, opened_at DESC);` (supersedes the single-column `user_id` index if both are created). |
| **Suggestion** | `kudos` — no composite index for keyset pagination | Board and profile feeds order by `(created_at DESC, id DESC)`. The existing `kudos_created_at_idx` covers the first sort key (planner uses it for Incremental Sort in the 20-row feed). Adding `id` to the index makes the sort fully index-covered and avoids the incremental sort step under load. | EXPLAIN feed: `Incremental Sort … Presorted Key: k.created_at` — `id` not in the index. | `CREATE INDEX idx_kudos_created_at_id ON kudos(created_at DESC, id DESC);` (drop `kudos_created_at_idx` once this is in place, or keep both). |
| **Suggestion** | `notifications` — `ORDER BY created_at DESC` not covered by composite index | `notifications_user_id_is_read_idx` covers `(user_id, is_read)`. `listNotifications` filters on `user_id` only and orders by `created_at DESC`. Planner uses the composite index for the bitmap scan then sorts — adding `created_at` to the index makes the list query index-only. | EXPLAIN: `Bitmap Heap Scan … Sort Key: created_at DESC` (extra sort step). | `CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);` For the unread-count query, the existing `(user_id, is_read)` index is already Index Only Scan — keep it. |

---

## Root-Cause Analysis

### Finding 1 — `getHighlightKudos` 2 000-row JS-side ranking
**Evidence chain:**  
- `board-queries.ts:130–135`: `.limit(2000)` with comment `// TODO(correctness): server-side ranking RPC`.  
- EXPLAIN (2 000-row): `Seq Scan on kudos k … rows=540`; `Hash Left Join` pulls entire `profiles` table twice.  
- The query then fetches nested `hearts(user_id, is_special_day)` for all 2 000 rows — that is a second round-trip or embedded join that grows with hearts table.  
- Realtime invalidation fires on every `hearts INSERT/DELETE` (debounced 300 ms). At a live event with concurrent hearting, this query runs every ~300 ms on the server for each connected client.

**Root cause:** Ranking logic not pushed to the database. The `TODO` comment in the code acknowledges this.

### Finding 2 — Missing `kudos.sender_id` index
**Evidence chain:**  
- Migration `20260731000000_create_kudos.sql`: only `kudos_receiver_id_idx` and `kudos_created_at_idx` created. No index on `sender_id`.  
- EXPLAIN `kudos sender_id filter`: `Seq Scan on kudos … Filter: (sender_id = '…')`.  
- `profile-queries.ts:253`: `filterColumn = direction === 'received' ? 'receiver_id' : 'sender_id'` — both paths go to the same query; only `receiver_id` is indexed.  
- `profile_stats` view SubPlan 2 (EXPLAIN): `Seq Scan on kudos k_1 … Filter: (sender_id = p.id)`.

### Finding 3 — Missing `secret_box_badges.user_id` index
**Evidence chain:**  
- Migration `20260731050000_create_secret_box.sql`: only PK on `id`. No index on `user_id`.  
- EXPLAIN SubPlan 4 in `profile_stats`: `Seq Scan on secret_box_badges b … Filter: (user_id = p.id)`.  
- `secret-box-actions.ts:68`: `SELECT badge_key, opened_at FROM secret_box_badges WHERE user_id = ? ORDER BY opened_at DESC` — also Seq Scan.

---

## Suggested New Migration SQL

> Apply as a **new migration file** — never edit shipped migrations.  
> Suggested name: `supabase/migrations/20260804000000_perf_indexes_and_rpc.sql`

```sql
-- ============================================================
-- Performance indexes (2026-08-04 audit)
-- ============================================================

-- 1. kudos.sender_id — used in profile sent feed, profile_stats sent subplan,
--    hearts_insert_own RLS subquery, kudo_hashtags_insert RLS subquery.
create index if not exists idx_kudos_sender_id
  on public.kudos (sender_id);

-- 2. secret_box_badges — composite covers user_id filter + opened_at sort.
--    Supersedes a plain user_id index; used by getSecretBoxState and profile_stats.
create index if not exists idx_secret_box_badges_user_opened
  on public.secret_box_badges (user_id, opened_at desc);

-- 3. profiles full_name trigram — enables ILIKE '%…%' autocomplete.
--    Requires pg_trgm (bundled with Postgres, safe to create on Supabase free tier).
create extension if not exists pg_trgm;
create index if not exists idx_profiles_full_name_trgm
  on public.profiles using gin (full_name gin_trgm_ops);

-- 4. kudos composite keyset — covers (created_at DESC, id DESC) for board + profile feeds.
create index if not exists idx_kudos_created_at_id
  on public.kudos (created_at desc, id desc);
-- Note: kudos_created_at_idx (single col) can be dropped once this is confirmed working.
-- Do NOT drop in this migration — do it in a follow-up after verifying query plans.

-- 5. notifications list sort — covers user_id filter + created_at sort for listNotifications.
create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

-- ============================================================
-- RLS auth.uid() hoisting — wrap bare auth.uid() in sub-select
-- so the planner evaluates it once per statement, not once per row.
-- ============================================================

-- profiles
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- kudos
drop policy if exists "kudos_insert_own" on public.kudos;
create policy "kudos_insert_own"
  on public.kudos for insert to authenticated
  with check ((select auth.uid()) = sender_id);

drop policy if exists "kudos_select_own" on public.kudos;
create policy "kudos_select_own"
  on public.kudos for select to authenticated
  using (sender_id = (select auth.uid()) or receiver_id = (select auth.uid()));

-- hearts
drop policy if exists "hearts_insert_own" on public.hearts;
create policy "hearts_insert_own"
  on public.hearts for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and not exists (
      select 1 from public.kudos k
      where k.id = kudo_id and k.sender_id = (select auth.uid())
    )
  );

drop policy if exists "hearts_delete_own" on public.hearts;
create policy "hearts_delete_own"
  on public.hearts for delete to authenticated
  using ((select auth.uid()) = user_id);

-- notifications
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- secret_box / secret_box_badges
drop policy if exists "secret_box_select_own" on public.secret_box;
create policy "secret_box_select_own"
  on public.secret_box for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "secret_box_badges_select_own" on public.secret_box_badges;
create policy "secret_box_badges_select_own"
  on public.secret_box_badges for select to authenticated
  using ((select auth.uid()) = user_id);

-- ============================================================
-- RPC: get_highlight_kudos(p_today date, p_multiplier int)
-- Replaces the 2000-row JS-side ranking in getHighlightKudos.
-- Returns the top 5 kudos by weighted heart score in one query.
-- ============================================================
create or replace function public.get_highlight_kudos(
  p_today      date,
  p_multiplier int default 1
)
returns table (
  id               uuid,
  receiver_id      uuid,
  content_html     text,
  created_at       timestamptz,
  is_anonymous     boolean,
  sender_id        uuid,
  sender_name      text,
  sender_avatar_url text,
  receiver_name    text,
  receiver_avatar_url text,
  heart_count      bigint,
  weighted_score   bigint
)
language sql
security definer
set search_path = public
as $$
  select
    k.id,
    k.receiver_id,
    k.content_html,
    k.created_at,
    k.is_anonymous,
    case when k.is_anonymous then null else k.sender_id end,
    case when k.is_anonymous
         then coalesce(k.anonymous_name, 'Ẩn danh')
         else sp.full_name end,
    case when k.is_anonymous then null else sp.avatar_url end,
    rp.full_name,
    rp.avatar_url,
    count(h.kudo_id)                                                      as heart_count,
    count(h.kudo_id)
      + count(h.kudo_id) filter (where h.is_special_day)
        * greatest(p_multiplier - 1, 0)                                   as weighted_score
  from public.kudos k
  left join public.profiles sp on sp.id = k.sender_id
  left join public.profiles rp on rp.id = k.receiver_id
  left join public.hearts   h  on h.kudo_id = k.id
  group by k.id, k.is_anonymous, k.anonymous_name,
           k.sender_id, sp.full_name, sp.avatar_url,
           rp.full_name, rp.avatar_url
  order by weighted_score desc, k.created_at desc
  limit 5;
$$;

grant execute on function public.get_highlight_kudos(date, int) to authenticated;
```

**Caller change required** (after migration applied):  
Replace `board-queries.ts getHighlightKudos()` to call `.rpc('get_highlight_kudos', { p_today: today, p_multiplier: multiplier })` instead of the 2 000-row select + JS sort. The `p_multiplier` value still comes from the `special_day_config` lookup (keep that small fetch).

---

## Evidence — Raw EXPLAIN Output

### Board feed first page (kudos_public shape, LIMIT 20)
```
Limit … actual time=0.047ms rows=0
  Index Scan using kudos_created_at_idx on kudos k
  Incremental Sort … Presorted Key: k.created_at   ← id not covered
  Nested Loop Left Join → Index Scan profiles_pkey (both joins indexed)
Execution Time: 0.155 ms  ← fast (empty DB); plan degrades under load
```

### getHighlightKudos — 2 000-row variant (the critical path)
```
Sort … Sort Key: k.created_at DESC
  Hash Left Join (k.receiver_id = rp.id)
    Hash Left Join (k.sender_id = sp.id)
      Seq Scan on kudos k          ← FULL TABLE SCAN
      Seq Scan on profiles sp      ← FULL TABLE SCAN
    Seq Scan on profiles rp        ← FULL TABLE SCAN
Execution Time: 0.077 ms (empty); grows O(N) with data
```

### kudos sender_id filter (profile sent feed)
```
Seq Scan on kudos
  Filter: (sender_id = '…')
Execution Time: 0.179 ms (10 rows); Seq Scan confirmed
```

### profile_stats SubPlan 2 + 4
```
SubPlan 2 (sent count): Seq Scan on kudos k_1 … Filter: sender_id = p.id
SubPlan 4 (boxes_opened): Seq Scan on secret_box_badges b … Filter: user_id = p.id
```

### secret_box_badges ORDER BY opened_at
```
Sort … Sort Key: opened_at DESC
  Seq Scan on secret_box_badges … Filter: user_id = '…'
```

### searchRecipients ILIKE
```
Seq Scan on profiles
  Filter: (full_name ~~* '%nguyen%') AND (id <> '…')
  Rows Removed by Filter: 10
Execution Time: 0.408 ms (10 rows); grows O(N) with profiles
```

### Queries confirmed index-covered (no action needed)
- `getUnreadCount`: Index Only Scan on `notifications_user_id_is_read_idx` — optimal.
- `hearts fetchHeartCount`: Bitmap Index Scan on `hearts_kudo_id_idx` — optimal.
- `listNotifications` user_id filter: Bitmap Index Scan on `notifications_user_id_is_read_idx` — OK; sort coverage improvement is a suggestion only.
- `profile feed received`: Bitmap Index Scan on `kudos_receiver_id_idx` — optimal.
- `kudo_hashtags hashtag_id filter`: Bitmap Index Scan on composite PK `(kudo_id, hashtag_id)` — the PK is `(kudo_id, hashtag_id)` which does NOT lead with `hashtag_id`, but Postgres is using it via bitmap scan (small table). Acceptable for now; a dedicated index on `hashtag_id` would be cleaner at scale.
- `open_secret_box` RLS lookup `WHERE user_id = v_uid FOR UPDATE`: uses `secret_box_pkey` (PK on `user_id`) — optimal.
- `hearts RLS subquery` (`k.id = ? AND k.sender_id = ?`): Index Scan on `kudos_pkey` — fast; sender_id is a post-filter. After `idx_kudos_sender_id` is added, planner may prefer it for the `sender_id` filter; the PK lookup for `k.id` remains the better entry point here.

---

## Open Questions

1. **`get_highlight_kudos` RPC caller change** — the RPC SQL is in the migration but `board-queries.ts` still needs updating. This is a code change, not just a migration; scope it to a separate task or include in the migration PR.
2. **`kudos_created_at_idx` retirement** — once `idx_kudos_created_at_id` is confirmed by re-running EXPLAIN, the single-column index should be dropped to avoid write amplification. Flag for a follow-up migration.
3. **`profile_stats` materialization** — if the profile page is called for many users simultaneously (leaderboard use case), the 5-subquery view will N+1. Consider a materialized view + trigger-based refresh on kudos/hearts insert. Left open pending measured load.
4. **Realtime scope** — `hearts` and `notifications` are both in the `supabase_realtime` publication with no column filter. Consider restricting to `(user_id, kudo_id)` for hearts (invalidation signal only) to reduce Realtime payload size.
