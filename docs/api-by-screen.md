# API Reference — APIs by Screen

Per-screen server actions, queries, and hooks. Shared APIs (auth guard, `kudos_public` view,
`profile_stats` view, `create_kudo` RPC, `toggle_heart` RPC, notifications, `event_config`)
are documented in [api-shared.md](./api-shared.md).

---

## /board — Live Kudos Board

### `listBoardKudos` — infinite feed

**File:** `src/features/board/board-queries.ts:191`

```ts
listBoardKudos(input?: ListBoardKudosInput): Promise<ListBoardKudosResult>

type ListBoardKudosInput = {
  cursor?: { createdAt: string; id: string } | null  // ISO8601 + UUID
  hashtagId?: string | null                           // UUID filter
  departmentId?: string | null                        // UUID filter
  limit?: number                                      // 1–50, default 20
}

type ListBoardKudosResult =
  | { data: BoardKudoRow[]; nextCursor: BoardCursor | null }
  | { error: string }

interface BoardKudoRow {
  id: string
  senderId: string | null          // null when anonymous
  senderName: string               // fallback 'Ẩn danh'
  senderAvatarUrl: string | null
  receiverId: string
  receiverName: string
  receiverAvatarUrl: string | null
  contentHtml: string
  createdAt: string                // ISO8601
  heartCount: number               // length of hearts join
  likedByMe: boolean               // true if auth.uid() is in hearts
}
```

Reads `kudos_public` (sender masking always applied). Department filter resolves receiver UUIDs from `profiles.department_ref` in a separate query first (PostgREST cannot traverse FK from a view column). Keyset cursor: `(created_at < cursor.createdAt) OR (created_at = cursor.createdAt AND id < cursor.id)`.

**Security:** reads `kudos_public` view — anonymous sender identity never exposed.

### `getHighlightKudos` — top-5 weighted by hearts

**File:** `src/features/board/board-queries.ts:102`

```ts
getHighlightKudos(): Promise<HighlightKudosResult>
// HighlightKudosResult = { data: BoardKudoRow[] } | { error: string }
```

Fetches today's `hearts_multiplier` from `special_day_config`. Calls `get_highlight_kudos(p_today, p_multiplier)` RPC (migration `20260804000000`). Returns up to 5 rows, ordered by `weighted_score DESC, created_at DESC`.

**RPC `get_highlight_kudos(p_today date, p_multiplier int)`** (SECURITY DEFINER):
- Returns: `id, receiver_id, content_html, created_at, is_anonymous, sender_id, sender_name, sender_avatar_url, receiver_name, receiver_avatar_url, heart_count, weighted_score, liked_by_me`
- `weighted_score = count(hearts) + count(special-day hearts) * max(p_multiplier - 1, 0)`
- `liked_by_me = bool_or(h.user_id = auth.uid())`, false for unauthenticated
- GRANT: `authenticated`

### `getSpotlightAggregation` — word-cloud data (JS-side GROUP BY)

**File:** `src/features/board/board-queries.ts:378`

```ts
getSpotlightAggregation(input?: { hashtagId?: string | null })
  : Promise<SpotlightResult>

type SpotlightResult = { data: SpotlightNode[] } | { error: string }
interface SpotlightNode {
  receiverId: string
  name: string
  avatar: string | null
  kudoCount: number
}
```

Reads `kudos_public` (limit 1000), aggregates receiver counts client-side. Superseded by `getSpotlightAggregationRpc` (see below) in the `useSpotlight` hook.

### `getSpotlightAggregationRpc` — server-side GROUP BY (preferred)

**File:** `src/features/board/board-leaderboard-queries.ts:122`

```ts
getSpotlightAggregationRpc(input?: { hashtagId?: string | null })
  : Promise<GetSpotlightRpcResult>
// GetSpotlightRpcResult = { data: SpotlightRpcNode[] } | { error: string }
// SpotlightRpcNode = { receiverId, name, avatar, kudoCount }
```

Calls `get_spotlight_aggregation(p_hashtag_id uuid)` RPC (migration `20260804020000`, SECURITY DEFINER):
- Reads `kudos_public`, groups by `receiver_id`, returns sorted by `kudo_count DESC`.
- `p_hashtag_id = null` → no hashtag filter.
- GRANT: `authenticated, anon`.

### `getRankingLeaderboard` — top-10 by kudos received

**File:** `src/features/board/board-leaderboard-queries.ts:41`

```ts
getRankingLeaderboard(): Promise<GetRankingLeaderboardResult>
// GetRankingLeaderboardResult = { data: LeaderboardEntry[] } | { error: string }
// LeaderboardEntry = { rank: number; id: string; name: string; avatarUrl: string | null; score: number }
```

Calls `get_ranking_leaderboard()` RPC (migration `20260804020000`, SECURITY DEFINER). Returns top-10 by kudos received count. GRANT: `authenticated, anon`.

### `getGiftLeaderboard` — top-10 by boxes opened

**File:** `src/features/board/board-leaderboard-queries.ts:66`

```ts
getGiftLeaderboard(): Promise<GetGiftLeaderboardResult>
// same shape as GetRankingLeaderboardResult
```

Calls `get_gift_leaderboard()` RPC (migration `20260804020000`, SECURITY DEFINER). Returns top-10 by `secret_box_badges` count. GRANT: `authenticated, anon`.

### Board hooks (TanStack Query)

| Hook | File | queryKey | staleTime | Notes |
|---|---|---|---|---|
| `useBoardFeed()` | `use-board-feed.ts:46` | `['board','feed',{hashtagId,departmentId}]` | 30 s | `useInfiniteQuery`; Realtime: kudos+hearts INSERT/DELETE, debounced 300 ms |
| `useHighlights()` | `use-highlights.ts:36` | `['board','highlights']` | 30 s | Realtime same channel pattern |
| `useSpotlight()` | `use-spotlight.ts:45` | `['board','spotlight',{hashtagId}]` | 60 s | Reads `?hashtag` URL param; calls `getSpotlightAggregationRpc` |
| `useRankingLeaderboard()` | `use-board-leaderboards.ts:43` | `['board','leaderboard','ranking']` | 5 min | |
| `useGiftLeaderboard()` | `use-board-leaderboards.ts:66` | `['board','leaderboard','gift']` | 5 min | |
| `useBoardUserStats(uid)` | `use-board-user-stats.ts:51` | `['board','userStats',uid]` | 60 s | Wraps `getProfileStats`; maps `boxesRemaining` → `secretBoxCount` |
| `useToggleHeart()` | `use-toggle-heart.ts:56` | mutation | — | Optimistic update on feed + highlights; rolls back on error; invalidates on settle |
| `useDepartmentList()` | `use-department-list.ts` | — | 5 min | Wraps `listDepartments` |
| `useHashtagList()` | `use-hashtag-list.ts` | — | — | Wraps `listHashtags` |

---

## /kudos — Viết Kudo compose modal

### `createKudo` server action

See [api-shared.md — `create_kudo` RPC](./api-shared.md#create_kudo-rpc) for full docs.

**File:** `src/features/kudos/kudo-actions.ts:67`

```ts
createKudo(input: CreateKudoInput): Promise<CreateKudoResult>
// CreateKudoResult = { ok: true; kudoId: string } | { ok: false; errors: Record<string, string[]> }
```

### `listHashtags` — hashtag catalog

See [api-shared.md](./api-shared.md#hashtag-actionsts--listhashtags).

### `searchRecipients` — recipient autocomplete

See [api-shared.md](./api-shared.md#recipient-actionsts--searchrecipients).

### Kudos hooks

| Hook | File | Notes |
|---|---|---|
| `useCreateKudo()` | `kudos/hooks/use-create-kudo.ts:36` | `useMutation` wrapping `createKudo`. Returns `{ submit, isPending, fieldErrors, isSuccess, kudoId, rootError, reset }` |
| `useHashtags(query?)` | `kudos/hooks/use-hashtags.ts` | Wraps `listHashtags` |
| `useRecipientSearch(query)` | `kudos/hooks/use-recipient-search.ts` | Wraps `searchRecipients` |
| `useCurrentUserId()` | `kudos/hooks/use-current-user-id.ts` | Browser-side `supabase.auth.getUser()` |

---

## /profile — Own profile

### `getProfileStats`

**File:** `src/features/profile/profile-queries.ts:147`

```ts
getProfileStats(profileId: string): Promise<GetProfileStatsResult>

type GetProfileStatsResult = { data: ProfileStats } | { error: string }

interface ProfileStats {
  received: number
  sent: number | null     // null when profileId ≠ auth.uid()
  hearts: number          // weighted hearts_received from profile_stats view
  boxesOpened: number
  boxesRemaining: number
  tier: string | null     // null when received < 10
  stars: number | null    // 1–3, null when received < 10
}
```

Reads `profile_stats` view. Derives tier/stars client-side using `TIER_TABLE`:
Bronze (10/20/30) → Silver (40/60/80) → Gold (100/150/200) → Diamond (250+).

### `listProfileKudos`

**File:** `src/features/profile/profile-queries.ts:220`

```ts
listProfileKudos(input: ListProfileKudosInput): Promise<ListProfileKudosResult>

type ListProfileKudosInput = {
  profileId: string
  direction: 'received' | 'sent'
  cursor?: { createdAt: string; id: string } | null
  limit?: number  // 1–50, default 20
}

type ListProfileKudosResult =
  | { data: ProfileKudoRow[]; nextCursor: ProfileCursor | null }
  | { error: string }
```

**Security:** `direction='sent'` is HARD DENIED when `profileId ≠ auth.uid()` — server-side, not delegated to RLS. Reads `kudos_public`.

### `getProfileHeader`

**File:** `src/features/profile/profile-queries.ts:326`

```ts
getProfileHeader(profileId: string): Promise<GetProfileHeaderResult>

interface ProfileHeader {
  id: string
  full_name: string | null
  avatar_url: string | null
  department_id: string | null
  title: string | null
}
```

Explicit 5-column allowlist from `profiles` — no email, no `auth.uid` reference.

### Profile hooks

| Hook | File | queryKey | staleTime |
|---|---|---|---|
| `useProfileStats(profileId)` | `use-profile-stats.ts:41` | `['profile','stats',profileId]` | 60 s |
| `useProfileHeader(profileId)` | `use-profile-stats.ts:67` | `['profile','header',profileId]` | 60 s |
| `useProfileFeed(profileId, direction)` | `use-profile-feed.ts:49` | `['profile','feed',profileId,direction]` | 30 s |
| `useToggleHeart()` | re-exported from `use-profile-feed.ts:7` | — | — |

---

## /secret-box — Secret box open flow

### `getSecretBoxState`

**File:** `src/features/secret-box/secret-box-actions.ts:46`

```ts
getSecretBoxState(): Promise<{ data: SecretBoxState } | { error: string }>

interface SecretBoxState {
  unopened: number       // from secret_box.unopened_box_count, default 0
  opened: OpenedBadge[]  // sorted opened_at DESC
}
interface OpenedBadge { badgeKey: string; openedAt: string }
```

Fetches `secret_box` + `secret_box_badges` in parallel. Auth-guarded.

### `openSecretBox`

**File:** `src/features/secret-box/secret-box-actions.ts:99`

```ts
openSecretBox(): Promise<OpenSecretBoxResult>
// OpenSecretBoxResult = { data: { badgeKey: string; remaining: number } } | { error: string }
```

Calls `open_secret_box()` RPC (migration `20260731110000`, SECURITY DEFINER). Atomic: row-lock, weighted badge roll, decrement, insert badge, return. Calls `revalidatePath('/secret-box')` on success.

**RPC `open_secret_box()` returns:** `json { badge_key: string, remaining: number }`

**Error codes:**

| Code | Condition |
|---|---|
| `P0101` | Not authenticated |
| `P0102` | No boxes to open (`unopened_box_count = 0` or row missing) |

**Badge distribution (server-side weighted roll):**

| Key | Weight |
|---|---|
| `stay-gold` | 30% |
| `flow-to-horizon` | 25% |
| `touch-of-light` | 20% |
| `beyond-the-boundary` | 10% |
| `revival` | 10% |
| `root-further` | 5% |

GRANT: `EXECUTE` to `authenticated`.

### `useSecretBox`

**File:** `src/features/secret-box/use-secret-box.ts:56`

```ts
useSecretBox(): UseSecretBoxReturn

interface UseSecretBoxReturn {
  unopened: number
  currentBadge: BadgeInfo | null  // most recently opened badge
  isOpening: boolean
  isLoading: boolean
  stateError: string | null
  openError: string | null
  open: () => void         // no-op when unopened === 0 or isPending
  clearError: () => void
}
```

`open()` mutation: `retry: 0` (non-idempotent). Optimistic update on success (sets cache from RPC result). Invalidates on error.

---

## /notifications — Notifications panel + page

### Actions

See [api-shared.md — Notifications](./api-shared.md#notifications--actions--trigger) for `getUnreadCount`, `listNotifications`, `markRead`, `markAllRead`.

### Hooks

| Hook | Signature | Notes |
|---|---|---|
| `useUnreadCount(uid)` | `use-notifications.ts:43` | `useQuery`; Realtime INSERT/UPDATE on `notifications` filtered by `user_id`. Optimistic +1 on INSERT. staleTime 30 s |
| `useNotificationList(uid, limit?)` | `use-notifications.ts:143` | Flat `useQuery`, limit default 20. For bell popover. staleTime 30 s |
| `useNotificationInfiniteList(uid, pageSize?)` | `use-notifications.ts:182` | `useInfiniteQuery` for /notifications full page. staleTime 30 s |

---

## /countdown — Pre-launch countdown

### `getEventConfig`

See [api-shared.md — `event_config`](./api-shared.md#event_config-table--geteventconfig).

### `useCountdown`

**File:** `src/features/event/use-countdown.ts:41`

```ts
useCountdown(): UseCountdownReturn

interface UseCountdownReturn extends CountdownValues {
  invalid: boolean   // true when config missing or date invalid
  isLoading: boolean
}
// CountdownValues = { days, hours, minutes, seconds, done: boolean }
```

queryKey `['event-config']`, staleTime 5 min. Ticks per-second via `setInterval`; increments `now` by exactly 1000 ms per tick (deterministic under fake timers).

---

## / — Homepage (root redirect)

No screen-specific APIs. Root page redirects: authenticated → `/board`, unauthenticated → `/login` (handled by `proxy.ts`).

Shared APIs consumed:
- `useUnreadCount(uid)` — notification bell badge
- `useCountdown()` — if countdown widget is mounted

---

## /login — Google OAuth login

No custom APIs. Uses Supabase Auth directly:
- `supabase.auth.signInWithOAuth({ provider: 'google' })` (client-side)
- `/auth/callback` route handler: exchanges OAuth code via `supabase.auth.exchangeCodeForSession(code)`, then redirects

---

## /awards — Award categories (STATIC — NO API)

**File:** `src/features/awards/award-config.ts`

All data is static configuration. No database queries, no server actions. The page renders from `award-config.ts` at build/request time — no Supabase calls.

---

## /rules — Thể lệ (STATIC — NO API)

**File:** `src/features/rules/rules-content.ts`

All data is static content. No database queries, no server actions. The page renders from `rules-content.ts` — no Supabase calls.

---

_Verified against source: 2026-08-11_
