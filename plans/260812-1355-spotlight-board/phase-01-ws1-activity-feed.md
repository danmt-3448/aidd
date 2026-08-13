# Phase 01 — WS-1 Realtime Activity Feed (Track B: backend/data)

**Context:** [spec.md §WS-1](./spec.md) · [clarifications.md](./clarifications.md)
**Priority:** P2 · **Status:** pending · **Track:** B (backend/data — parallel with Track A 02/03/04, no cross-block)

## Overview
Populate the Spotlight activity feed (currently hardcoded `EMPTY_ACTIVITY`) with the 6 most-recent kudos from DB + realtime prepend on new INSERT. Signal-only realtime (payload can't carry names) → refetch on signal.

## Files to create
- `supabase/migrations/20260812000000_spotlight_recent_activity.sql` — `list_recent_activity` RPC
- `src/features/board/use-spotlight-activity.ts` — TanStack query + realtime hook + `getRecentActivity` query fn + `spotlightActivityKeys` (keep query logic HERE, not in the already-oversized `board-queries.ts` (542 lines))

## Files to modify
- `src/features/board/components/board-connected.tsx` (219 → must end ≤200) — call hook, pass `spotlightActivity={activity}`; **extract ~20 lines** to a helper/sub-component to drop under 200
- `src/features/board/components/board-connected-helpers.ts` — retire `EMPTY_ACTIVITY` (L59)
- `src/features/board/components/board-spotlight-activity.tsx` (41) — render newest-top, opacity ramp per Figma, prepend fade/slide-in
- `src/features/board/components/board-types.ts` — L101 comment `/** HH:MM format */` → `hh:mmA`

## Data flow
`kudos_public` view → `list_recent_activity(p_limit=6)` RPC (order by created_at desc) → `getRecentActivity()` maps rows → `SpotlightActivityEntry[] {time,name}` → `use-spotlight-activity` (query key `spotlightActivityKeys.list()`, staleTime 15s) → `board-connected` → `BoardSpotlight` → `board-spotlight-activity`. Realtime channel INSERT on `kudos` → debounce300 → `invalidateQueries` → refetch.

## Implementation steps
1. Migration: `create function list_recent_activity(p_limit int default 6) returns table(receiver_id uuid, receiver_name text, created_at timestamptz)` — body `select receiver_id, receiver_name, created_at from kudos_public order by created_at desc limit p_limit`; `security definer`; `grant execute to authenticated`. Mirror `get_spotlight_aggregation` pattern.
   - **Grant note:** grant `list_recent_activity` to `authenticated` only (board is authed-only; `anon` intentionally excluded, unlike `get_spotlight_aggregation`).
2. `getRecentActivity(limit=6)`: call RPC via server-appropriate supabase client; map each row → `{ name: receiver_name, time: formatTime(created_at) }`.
3. **Pin the time formatter — NO date library is installed (`package.json` has none); do NOT add one.** Use `Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Ho_Chi_Minh' }).format(date)` then strip the space before AM/PM with a regex (e.g. `.replace(/\s(AM|PM)/, '$1')`) → yields `08:30PM`. Do NOT use bare `toLocaleTimeString`. Extract formatter to a tiny testable fn.
4. Hook `use-spotlight-activity`: TanStack `useQuery` + `.channel('spotlight-activity-realtime').on('postgres_changes',{event:'INSERT',table:'kudos'}, debounce300 → invalidate).subscribe()`, cleanup `removeChannel`. Mirror `use-board-feed.ts:86-125`.
5. Wire in `board-connected.tsx`; extract ~20 lines to satisfy ≤200.
6. `board-spotlight-activity.tsx`: opacity ramp + text style from `get_node` on the feed layer (**not guessed**); prepend animation. **WS-1 must add `data-fig` to the feed text elements** so `style-assert.mjs` covers feed opacity (Figma node under `2940:14174` — builder confirms exact child node via `get_frame_node_tree`).
7. `npx tsc --noEmit` after each file.

## Acceptance criteria
- [ ] Feed shows 6 real recipients from seed, newest top, `time` = `hh:mmA` Asia/Saigon (no space).
- [ ] New kudo INSERT (2nd session/seed) → feed prepends live within ~300ms debounce.
- [ ] `NNN KUDOS` unaffected (still Σ kudoCount).
- [ ] `board-connected.tsx` ends ≤200; new query logic not added to `board-queries.ts`.
- [ ] No console error/warning.

## Risks
- **Seed <6 kudos** → feed shows fewer rows (spec §8 open Q). Verify `supabase/seed-demo-data.sql`/`seed.sql` has ≥6 distinct kudos on `db:reset`; if not, feed still valid but gate evidence weaker — flag in gate report.
- **`kudos_public` security-definer semantics** — confirm RPC as `security definer` reads the view correctly under `authenticated`. Recipient name is public → no privacy leak (only sender can be anonymous).
- **Formatter drift** — locale/TZ env differences; pinned formatter + unit test (phase 07) mitigate.
- **Debounce vs realtime storm** — 300ms debounce mirrors existing feed; safe.
