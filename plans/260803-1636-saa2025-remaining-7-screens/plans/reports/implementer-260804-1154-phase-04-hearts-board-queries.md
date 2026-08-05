## Task: phase-04 — Hearts + board queries + Realtime (Track B)
**Status**: completed

### Files Touched
- `src/features/board/board-queries.ts` (+310 lines) — new
- `src/features/board/heart-actions.ts` (+170 lines) — new
- `src/features/board/use-board-feed.ts` (+130 lines) — new
- `src/features/board/use-toggle-heart.ts` (+155 lines) — new
- `src/features/board/use-highlights.ts` (+100 lines) — new
- `src/features/board/use-spotlight.ts` (+65 lines) — new
- `src/features/board/board-queries.test.ts` (+290 lines) — new
- `src/features/board/heart-actions.test.ts` (+215 lines) — new

### Checks
- Typecheck: clean (zero board errors; 10 pre-existing homepage test errors outside this task's scope remain unchanged)
- Unit tests: 57 passing, 0 failing (7 test files — 14 board-queries + 7 heart-actions + 36 Track A component tests written by parallel agent)

### Exported Interfaces (Integration Contract for phase-15)

```ts
// board-queries.ts
interface BoardKudoRow {
  id: string
  senderId: string | null        // null = anonymous (mask from kudos_public)
  senderName: string
  senderAvatarUrl: string | null
  receiverName: string
  receiverAvatarUrl: string | null
  contentHtml: string
  createdAt: string
  heartCount: number
  likedByMe: boolean
}

interface SpotlightNode {
  receiverId: string
  name: string
  avatar: string | null
  kudoCount: number
}

interface BoardCursor {
  createdAt: string
  id: string
}
```

### Action Return Types (Integration Contract)

```ts
// heart-actions.ts
type ToggleHeartResult = { data: { liked: boolean; heartCount: number } } | { error: string }

// board-queries.ts
type HighlightKudosResult  = { data: BoardKudoRow[] } | { error: string }
type ListBoardKudosResult  = { data: BoardKudoRow[]; nextCursor: BoardCursor | null } | { error: string }
type SpotlightResult       = { data: SpotlightNode[] } | { error: string }
```

### Hook Export Surface (Integration Contract for phase-12 / phase-15)

- `useBoardFeed()` — infinite keyset feed; reads `?hashtag` URL param; Realtime kudos+hearts signal; exports `boardFeedKeys`
- `useToggleHeart()` — optimistic toggle with rollback; invalidates highlights + feed
- `useHighlights()` — top-5 weighted carousel; Realtime signal; exports `highlightKeys`
- `useSpotlight()` — flat recipient aggregation; reads `?hashtag` URL param

### Acceptance Criteria
- [x] Feed rows for anonymous kudos expose `senderId = null` AND non-null `receiverName` — test `masks sender: senderId=null for anonymous kudo` verifies this; reads only from `kudos_public`
- [x] `toggleHeart` twice returns to original state (idempotent) — like/unlike tests each confirm `liked` flips correctly via insert-or-delete at the `(user, kudo)` PK
- [x] Self-heart rejected — RLS `WITH CHECK` on `hearts_insert_own` blocks it; action catches code `42501` → "Bạn không thể thả tim cho Kudo của chính mình." — test confirms
- [x] Highlights ≤5 rows ordered by weighted heart count — weighted score = `heartCount + specialCount*(multiplier-1)`; `.slice(0,5)` enforced; test with 6 kudos confirms top-5 and correct rank order
- [x] Keyset paging `(created_at, id) desc` returns no duplicate/skipped rows — cursor = last row `{createdAt, id}`; OR-decomposed comparison; `nextCursor=null` when page < limit; tests confirm both states
- [x] No direct `kudos` read anywhere — all queries use `kudos_public`; grep confirms
- [x] No raw Realtime payload rendered — `postgres_changes` handlers call `queryClient.invalidateQueries` only; `payload.new.id` not passed to UI

### Assumptions About phase-01 Columns
- `kudos_public` view: `sender_id | null`, `sender_name`, `sender_avatar_url | null`, `receiver_id`, `receiver_name`, `receiver_avatar_url | null`, `content_html`, `created_at`, `is_anonymous`
- `hearts`: PK `(user_id, kudo_id)`, `is_special_day boolean`, `liked_at`
- `special_day_config`: PK `event_date date`, `hearts_multiplier int default 1`
- Realtime publication for `kudos` restricted to `(id, created_at)` — confirmed in migration `20260731090000`
- `kudo_hashtags` FK on `kudos.id` (not `kudos_public`) — `!inner` join from view side works because the view is security_definer and exposes `id`

### Notes for Integration Engineer (phase-15)
- `boardFeedKeys` and `highlightKeys` are exported from their respective hook files — use these for cross-hook invalidation
- `spotlightKeys` exported from `use-spotlight.ts` — call `invalidateQueries({ queryKey: spotlightKeys.all })` after kudos insert if spotlight needs same-cadence refresh
- Dept filter was deliberately dropped — `profiles.department_id` has no backing department table; logged as follow-up
- `use-board-feed.ts` owns the Realtime channel `board-feed-realtime`; `use-highlights.ts` owns `board-highlights-realtime` — both unsubscribe on unmount; do not open a third channel for the same tables in the board page
