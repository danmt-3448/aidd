# Data Migration Backlog — Sun* Kudos Board + Notifications
_Researcher · 2026-08-04_

---

## Sources read

| File | What it tells us |
|---|---|
| `src/features/board/board-queries.ts` | `listBoardKudos`, `getHighlightKudos`, `getSpotlightAggregation` — actual query implementations |
| `src/features/board/components/board-connected.tsx` | Integration layer — which values are wired vs DEFERRED |
| `src/features/board/components/board-connected-helpers.ts` | `DEFERRED_USER_STATS` + `DEFERRED_LEADERBOARD` = confirmed zeros/empties |
| `src/features/board/components/board-types.ts` | `BoardUserStats`, `LeaderboardEntry` shape |
| `src/features/board/use-board-feed.ts`, `use-highlights.ts` | Feed and carousel hooks — fully wired |
| `src/features/board/heart-actions.ts` | `toggleHeart` — fully wired incl. special-day stamp |
| `src/features/kudos/hashtag-actions.ts` | `listHashtags` exists in kudos feature |
| `src/features/notifications/notification-actions.ts` | 4 actions: getUnreadCount / list / markRead / markAllRead — all real |
| `src/features/notifications/use-notifications.ts` | `useUnreadCount` + `useNotificationList` — real + Realtime wired |
| `src/components/site-header.tsx` | Bell button present — **plain `<button>`, no popover/panel attached** |
| `supabase/migrations/20260731*` + `20260804*` | Full schema: kudos, hearts, hashtags, notifications, profile_stats view, secret_box, get_highlight_kudos RPC |
| `src/features/profile/profile-queries.ts` | `getProfileStats` exists — reads `profile_stats` view |
| `src/app/*` directories | No `/notifications` route exists |

---

## Task 1 — Sun* Kudos Board Migration Backlog

### Current state per element

| # | Element | Rendered by | Current state | Notes |
|---|---|---|---|---|
| 1 | Feed (listBoardKudos) | `board-all-kudos-feed.tsx` | **REAL** | Keyset pagination, Realtime invalidation, hashtag filter by UUID |
| 2 | Highlight carousel top-5 (getHighlightKudos) | `board-highlight-carousel.tsx` | **REAL** | RPC `get_highlight_kudos` in migration `20260804000000` — weighted score, server-side |
| 3 | Spotlight aggregation (getSpotlightAggregation) | `board-spotlight.tsx` | **REAL** | Client-side GROUP BY over ≤1000 rows; has `TODO(perf)` note to convert to RPC at scale |
| 4 | Heart toggle (toggleHeart) | `board-feed-card.tsx` | **REAL** | Optimistic, self-heart RLS-blocked, special-day stamp |
| 5 | Hashtag filter chips | `board-highlight-carousel.tsx` | **BROKEN/DEFERRED** | `hashtags={[]}` hardcoded in `board-connected.tsx:156` — chips never render |
| 6 | totalKudos count | `board-spotlight.tsx` header | **REAL (derived)** | Summed client-side from `spotlightNodes.reduce(sum + kudoCount)` |
| 7 | Sidebar `userStats` (kudosReceived/Sent/Hearts/SecretBox) | `board-sidebar-stats.tsx` | **DEFERRED zeros** | `DEFERRED_USER_STATS = {0,0,0,0}` in `board-connected-helpers.ts:36` |
| 8 | Leaderboard "10 SUNNER THĂNG HẠNG" | `board-sidebar-leaderboard.tsx` | **DEFERRED empty** | `DEFERRED_LEADERBOARD = []` renders "Chưa có dữ liệu." |
| 9 | Leaderboard "10 SUNNER NHẬN QUÀ" | `board-sidebar-leaderboard.tsx` | **DEFERRED empty** | Same |

---

### Board backlog (prioritized)

#### BOARD-1 — Hashtag chips: wire real hashtag names to the carousel
- **What:** `BoardHighlightCarousel` receives `hashtags: string[]` (display names like `"#ThanhOm"`). Today `board-connected.tsx` passes `hashtags={[]}`. Filter chips are invisible.
- **Current state:** BROKEN — hardcoded empty array.
- **What's needed:**
  1. `listHashtags()` already exists in `src/features/kudos/hashtag-actions.ts` — returns `{id, name}[]` from the `hashtags` table. No new server action needed.
  2. New hook `useHashtagList()` (or reuse `useHashtags()` from `src/features/kudos/hooks/use-hashtags.ts`) — query all hashtags, stale 5 min.
  3. In `board-connected.tsx`: call the hook, derive `string[]` of names (e.g. `#ThanhOm`), pass to `BoardScreen` → `BoardHighlightCarousel`.
  4. The carousel's `onHashtagChange` sets `activeHashtag` (local state in `BoardScreen`) but the actual feed filter goes through `?hashtag` URL param. Current carousel implementation filters _client-side on FeedCardProps.hashtags_ — but **`mapKudoRowToFeedCard` omits `hashtags` field** (no join in `listBoardKudos`). Two fixes needed: (a) pass hashtag name → UUID mapping to derive the URL param, and (b) route the filter via `router.push('?hashtag=<id>')` rather than local state.
- **Migration needed:** None — `hashtags` table exists.
- **New query/RPC needed:** None — `listHashtags` reusable.
- **Effort:** S (2–3h) — hook reuse + wiring + URL param routing fix.

#### BOARD-2 — Sidebar userStats: wire `getProfileStats` for the calling user
- **What:** `BoardUserStats = { kudosReceived, kudosSent, heartsReceived, secretBoxCount }` currently all zeros. The sidebar stats card shows "0" for everything.
- **Current state:** DEFERRED.
- **What's needed:**
  1. `getProfileStats(uid)` already exists in `src/features/profile/profile-queries.ts` — reads `profile_stats` view → returns `received, sent, hearts, boxesOpened, boxesRemaining`.
  2. Map: `kudosReceived = received`, `kudosSent = sent ?? 0`, `heartsReceived = hearts`, `secretBoxCount = boxesRemaining` (unopened = what the button is for).
  3. New hook `useBoardUserStats(uid)` in `src/features/board/` — wraps `getProfileStats`.
  4. Replace `DEFERRED_USER_STATS` in `board-connected.tsx` with hook data.
- **Migration needed:** None — `profile_stats` view exists (`20260731080000`).
- **New query/RPC needed:** None — `getProfileStats` reusable.
- **Effort:** XS (1h).

#### BOARD-3 — Leaderboard "10 SUNNER THĂNG HẠNG" (kudos received ranking)
- **What:** Top-10 sunners ranked by kudos received. `LeaderboardEntry = { rank, id, name, avatarUrl, score }`. Currently no query.
- **Current state:** DEFERRED empty — "Chưa có dữ liệu."
- **What's needed:**
  1. New RPC `get_ranking_leaderboard()` — aggregates `kudos.receiver_id`, joins `profiles` for name/avatar, returns top-10 ordered by received count DESC.
  2. New server action `getRankingLeaderboard()` in `board-queries.ts`.
  3. New hook `useRankingLeaderboard()`.
  4. Wire in `board-connected.tsx`.
- **Migration needed:** YES — new `get_ranking_leaderboard` RPC function (no new table needed; aggregates existing `kudos` + `profiles`).
- **SQL sketch:**
  ```sql
  create or replace function public.get_ranking_leaderboard()
  returns table (rank bigint, user_id uuid, name text, avatar_url text, score bigint)
  language sql security definer set search_path = public as $$
    select
      row_number() over (order by count(*) desc) as rank,
      k.receiver_id as user_id,
      p.full_name    as name,
      p.avatar_url   as avatar_url,
      count(*)       as score
    from public.kudos k
    join public.profiles p on p.id = k.receiver_id
    group by k.receiver_id, p.full_name, p.avatar_url
    order by score desc
    limit 10;
  $$;
  ```
- **Effort:** S (2h) — migration + action + hook + wire.

#### BOARD-4 — Leaderboard "10 SUNNER NHẬN QUÀ" (secret boxes opened)
- **What:** Top-10 sunners by `secret_box_badges` count (boxes opened). Same `LeaderboardEntry` shape.
- **Current state:** DEFERRED empty.
- **What's needed:**
  1. New RPC `get_gift_leaderboard()` — aggregates `secret_box_badges.user_id`, joins `profiles`.
  2. New server action `getGiftLeaderboard()` in `board-queries.ts`.
  3. New hook `useGiftLeaderboard()`.
  4. Wire in `board-connected.tsx`.
- **Migration needed:** YES — new `get_gift_leaderboard` RPC.
- **SQL sketch:**
  ```sql
  create or replace function public.get_gift_leaderboard()
  returns table (rank bigint, user_id uuid, name text, avatar_url text, score bigint)
  language sql security definer set search_path = public as $$
    select
      row_number() over (order by count(*) desc) as rank,
      b.user_id,
      p.full_name,
      p.avatar_url,
      count(*) as score
    from public.secret_box_badges b
    join public.profiles p on p.id = b.user_id
    group by b.user_id, p.full_name, p.avatar_url
    order by score desc
    limit 10;
  $$;
  ```
- **Effort:** XS (1h) — mirrors BOARD-3.

#### BOARD-5 — Spotlight RPC (performance, deferred by design)
- **What:** `getSpotlightAggregation` has a `TODO(perf): replace with GROUP BY RPC for event scale` comment. Currently pulls ≤1000 rows and groups client-side.
- **Current state:** REAL but with known scale limit.
- **What's needed:** Convert to a `get_spotlight_aggregation(p_hashtag_id uuid)` RPC that does the GROUP BY server-side.
- **Migration needed:** YES — new RPC.
- **Effort:** S (2h) — low urgency; only matters when > 1000 kudos.
- **Priority:** LOW — ship after BOARD-1 through BOARD-4.

---

## Task 2 — Notifications Migration Backlog

### Current state per element

| # | Element | Current state | Notes |
|---|---|---|---|
| N1 | DB trigger `notify_on_kudo_insert` | **REAL** | Migration `20260731120000` — anon-safe, SECURITY DEFINER |
| N2 | `getUnreadCount()` | **REAL** | Counts unread rows for calling user |
| N3 | `listNotifications({limit})` | **REAL** | Newest-first, 20 default |
| N4 | `markRead(id)` | **REAL** | UPDATE own row |
| N5 | `markAllRead()` | **REAL** | UPDATE all own unread |
| N6 | `useUnreadCount(uid)` | **REAL** | TanStack Query + Realtime INSERT subscription |
| N7 | `useNotificationList(uid, limit)` | **REAL** | TanStack Query, shared invalidation |
| N8 | Bell badge in header | **REAL** | Renders red badge when `unreadCount > 0` |
| N9 | Bell click → notification popover/panel | **MISSING** | Bell is plain `<button>` with no onClick handler or panel |
| N10 | Full Notifications screen `/notifications` | **MISSING** | No route in `src/app/` |

---

### Notifications backlog (prioritized)

#### NOTIF-1 — Bell hover/click: notification popover panel
- **What:** The bell `<button>` in `site-header.tsx` (line 156) has no onClick and no panel. Figma shows a dropdown panel with recent notifications preview, mark-all-read CTA.
- **Current state:** MISSING — clicking the bell does nothing.
- **What's needed:**
  1. New component `NotificationPanel` (popover/dropdown) in `src/features/notifications/components/`:
     - Uses `useNotificationList(uid, 10)` hook — already exists.
     - Shows list of recent notifications: icon (type), title, body, timestamp, is_read indicator.
     - "Đánh dấu đã đọc tất cả" button → calls `markAllRead()` → invalidates queries.
     - "Xem tất cả" link → `/notifications` (NOTIF-2).
     - Click on item → `markRead(id)` + navigate to `notification.link`.
  2. Wire into `SiteHeader`: `onClick` on bell → toggle panel open/close (Zustand or local state). Or use Radix `Popover` primitive (already in shadcn/ui).
  3. Panel renders only when `user !== null`.
- **Migration needed:** None.
- **New query/action needed:** None — all 4 actions exist.
- **Effort:** M (3–4h) — new UI component + wiring.

#### NOTIF-2 — Full Notifications screen `/notifications`
- **What:** A dedicated page listing all notifications for the current user with full pagination, read/unread toggle per item, and mark-all-read.
- **Current state:** MISSING — no `src/app/notifications/` route.
- **What's needed:**
  1. New route `src/app/notifications/page.tsx` — server component shell, auth guard (same pattern as `/board/page.tsx`).
  2. New `NotificationsConnected` client component in `src/features/notifications/components/`.
  3. Uses `useNotificationList(uid, 50)` (or infinite scroll with cursor).
  4. Renders: notification list with type icon, title, body (if non-null), relative timestamp, is_read state; click item → markRead + navigate to link.
  5. Mark all read button.
  6. `SiteHeader` with `activeNav={null}` (no nav item maps to notifications).
  7. Wire middleware to add `/notifications` as a protected path.
  8. **Pagination:** `listNotifications` currently has a `limit` cap of 100 with no cursor. For a full screen, either raise the limit or add keyset cursor support to `listNotifications`. Recommend adding offset or cursor for > 100 notifications.
- **Migration needed:** None for basic screen. Optional: keyset cursor on `listNotifications` for full pagination (straightforward — same (created_at, id) pattern).
- **New query/action needed:** Optional keyset extension to `listNotifications`.
- **Effort:** M (4–5h) — new route + connected component + pagination extension.

#### NOTIF-3 — Notification type icons + body field usage
- **What:** The `notifications` table has `type text` and `body text` columns. The trigger currently only sets `type='kudo_received'` and `body=NULL`. For richer notifications, body should carry more context (e.g. snippet of kudo content).
- **Current state:** `body` always NULL; single `type` value.
- **What's needed:** Update trigger to populate `body` with a short plaintext excerpt of `content_html` (strip HTML, truncate to ~80 chars). Optional enhancement.
- **Migration needed:** YES — update `notify_on_kudo_insert` trigger function to populate `body`.
- **Effort:** XS (30 min). **Priority:** LOW — nice-to-have UX improvement.

#### NOTIF-4 — Notification realtime for mark-read (UPDATE events)
- **What:** `useUnreadCount` subscribes only to INSERT events. When a different tab/session calls `markRead`, the count on the current tab doesn't decrement reactively.
- **Current state:** UPDATE events not subscribed.
- **What's needed:** Add `event: 'UPDATE'` listener on `notifications` channel in `useUnreadCount` → invalidate count query.
- **Migration needed:** None.
- **Effort:** XS (30 min). **Priority:** LOW — edge case (cross-tab sync).

---

## Consolidated Priority Ranking

| Priority | Item | Effort | Blocks |
|---|---|---|---|
| P1 | BOARD-1 — hashtag chips | S | Carousel filter UX |
| P1 | BOARD-2 — sidebar userStats | XS | Stats card shows real data |
| P1 | NOTIF-1 — bell click panel | M | Core notification UX |
| P2 | BOARD-3 — ranking leaderboard | S | Sidebar leaderboard #1 |
| P2 | BOARD-4 — gift leaderboard | XS | Sidebar leaderboard #2 |
| P2 | NOTIF-2 — notifications screen | M | Full notifications page |
| P3 | BOARD-5 — spotlight RPC | S | Perf only, not UX |
| P3 | NOTIF-3 — body field + richer trigger | XS | UX enrichment |
| P3 | NOTIF-4 — realtime UPDATE for mark-read | XS | Cross-tab edge case |

---

## Migrations required (new)

| Migration | Purpose | Blocks |
|---|---|---|
| `get_ranking_leaderboard` RPC | BOARD-3 | Ranking leaderboard |
| `get_gift_leaderboard` RPC | BOARD-4 | Gift leaderboard |
| `get_spotlight_aggregation` RPC | BOARD-5 | Perf only |
| Update `notify_on_kudo_insert` to populate `body` | NOTIF-3 | Optional |

---

## What this research did NOT cover

1. **MoMorph spec for notification panel/screen** — could not call `download_specs` (MCP not available in this session). The panel shape is inferred from code (`Notification` interface fields: type, title, body, link, is_read, created_at). Implementer should fetch the Figma frame before building NOTIF-1.
2. **Exact Figma screenId for the full Notifications screen** — not found in existing plan files. The `spec_source` in `phase-03-notification-service.md` only references `i87tDx10uM` (Homepage). Implementer must locate the notifications frame in MoMorph or confirm it is a modal, not a full page.
3. **`?hashtag` filter UX flow for chips** — the carousel currently filters cards _client-side_ by `FeedCardProps.hashtags` (which is always empty from real data). BOARD-1 needs a clear decision: does the hashtag chip update the URL param (server-side filter) or filter the already-fetched highlight cards client-side? The feed already uses URL param server-side; highlights should follow the same pattern for consistency, but this requires fetching `getHighlightKudos({ hashtagId })` — which currently has no hashtagId parameter. Small query extension needed.
4. **"388 KUDOS" total count in spec** — the spec mentions a total kudos counter. Currently `totalKudos` is derived from `spotlightNodes.reduce(sum + kudoCount)` (sum of per-user counts = total kudos). Verify this matches the Figma spec value source. An alternative is a direct `count(*)` from `kudos_public`.
