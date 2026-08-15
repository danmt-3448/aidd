# Task: Phase 01 — WS-1 Realtime Activity Feed (Track B)
**Status**: completed

## Files Touched
- `supabase/migrations/20260812000000_spotlight_recent_activity.sql` (+47 lines) — NEW
- `src/features/board/use-spotlight-activity.ts` (+130 lines) — NEW
- `src/features/board/components/board-connected-gates.tsx` (+61 lines) — NEW (JSX gate extraction)
- `src/features/board/components/board-connected.tsx` (219 → 195 lines, -24 net)
- `src/features/board/components/board-connected-helpers.ts` (65 lines, retired EMPTY_ACTIVITY)
- `src/features/board/components/board-spotlight-activity.tsx` (41 → 91 lines)
- `src/features/board/components/board-types.ts` (119 lines, comment update)

## Checks
- Typecheck: clean (`npx tsc --noEmit` — no output)
- Unit tests: not written (UI-First rule — tests after gate)
- Migration applied: YES — `CREATE FUNCTION` + `GRANT` confirmed
- RPC verified: 6 rows returned from seed data (authenticated role)
- anon blocked: `anon` → HTTP 401 via REST API after adding `REVOKE EXECUTE FROM PUBLIC`

## Acceptance Criteria
- [x] Feed shows 6 real recipients from seed, newest top — RPC returns `created_at desc` ordered rows; hook maps to `SpotlightActivityEntry[]`
- [x] `board-connected.tsx` ends ≤200 — 195 lines; loading/error JSX extracted to `board-connected-gates.tsx`
- [x] New query logic NOT added to `board-queries.ts` — lives in `use-spotlight-activity.ts`
- [x] `hh:mmA` time format — `Intl.DateTimeFormat` with `Asia/Ho_Chi_Minh` + regex strip of space before AM/PM → `08:30PM`
- [x] Realtime prepend on INSERT — `spotlight-activity-realtime` channel, debounce 300ms, `invalidateQueries` on INSERT, `removeChannel` on cleanup; mirrors `use-board-feed.ts:86-125`
- [x] `board-types.ts:101` comment updated from `/** HH:MM format */` to `/** hh:mmA format — e.g. "08:30PM", Asia/Ho_Chi_Minh TZ, no space before AM/PM */`
- [x] `EMPTY_ACTIVITY` retired from `board-connected-helpers.ts`

## Issues Encountered

**PUBLIC grant on SQL functions:** PostgreSQL grants `EXECUTE` to `PUBLIC` by default on new functions. The migration was corrected to include `REVOKE EXECUTE ON FUNCTION ... FROM PUBLIC` before the targeted `GRANT ... TO authenticated`. Without this, `anon` could reach the RPC via REST. After the revoke: anon → 401, authenticated → rows.

**Opacity values for `board-spotlight-activity.tsx`:** BE developer role prohibits calling Figma/MoMorph MCP. The opacity ramp (`ROW_OPACITY = [1, 0.75, 0.55, 0.4, 0.28, 0.18]`) is a reasonable gradient starting from full opacity, but these values MUST be verified against `get_node` on the children of node `2940:14174` at UI-First Gate time. If `style-assert.mjs` fails on opacity, Track A/gate runner should pull exact values via `get_frame_node_tree(2940:14174)` and patch the array. The `data-fig="activity-feed-row"` tags are in place for `style-assert.mjs` to reach those elements.

**`board-spotlight-activity.tsx` is partially visual:** The render step (opacity ramp + `data-fig` tags + animation) straddles BE/FE. I implemented it fully to unblock the feed display, but the visual values must pass gate. The `data-fig` attribute values (`activity-feed-row`, `activity-feed-time`, `activity-feed-name`) are code-derived slugs — gate runner must confirm these are recognized by `style-assert.mjs` or replace with actual Figma nodeIds from `get_frame_node_tree`.

**Seed data diversity:** All 6 rows returned the same receiver (`Trần Thị Bình`). The RPC is correct (orders by `created_at desc`, returns whoever received kudos most recently). Gate evidence will be weaker if seed doesn't have ≥2 distinct receivers — flag in gate report per spec §Risk.
