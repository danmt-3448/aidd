---
title: Hearts + board queries + Realtime
work_type: feature
track: B
status: planned
blockedBy: [01]
blocks: [15]
spec_source: momorph:MaZUn5xHXZ
---

# Phase 04 — Hearts toggle + board queries + Realtime (Track B · logic)

## Context Links
- Recon: `plans/reports/check-progress-260803-1636-remaining-screens.md` (§8 Live board — HEAVIEST)
- Reuse: `src/features/kudos/kudo-actions.ts`, kudos model, auth guard.
- DB: phase-01 `hearts`, `kudos_public` view, `special_day_config`, Realtime publication (`kudos` broadcasts `id, created_at` only).
- Clarifications: Realtime = Supabase `postgres_changes` on `kudos`/`hearts` used as an INVALIDATION SIGNAL ONLY; spotlight = client-side over flat aggregation.

## Overview
- **Priority:** P1 · **Status:** planned
- All read/mutate logic behind the Live board: heart toggle, highlight ranking (top-5 by hearts),
  infinite feed, **hashtag filter (dept filter DROPPED — no backing data model this round)**, recipient
  aggregation for the spotlight word-cloud, and the Realtime subscription that keeps the board live.

## Key Insights
- **All feed reads go through `kudos_public`** (never `kudos`) — anon senders masked (phase-01 M3 guard).
  This includes the hashtag filter: the join is `FROM kudos_public JOIN kudo_hashtags` — never `FROM kudos`.
- Heart toggle is idempotent per `(user, kudo)` PK; **self-heart is rejected by phase-01 RLS**
  (`WITH CHECK not exists(... sender_id = auth.uid())`). The action does NOT re-implement the guard —
  it surfaces the RLS rejection as a friendly error. (Removed the inline "reject sender? receiver?" ambiguity.)
- Special-day multiplier: ranking heart count = `count(hearts) weighted by is_special_day *
  special_day_config.hearts_multiplier`. Compute in the ranking query, not client-side.
- Spotlight is **client-side SVG/CSS** (clarification) → this phase only ships a **flat recipient
  aggregation** query `{ receiver_id, name, avatar, kudo_count }`; layout math lives in Track A/integration.
- Infinite feed = **keyset pagination on `(created_at desc, id desc)`** — cursor is the composite
  `(created_at, id)` of the last row; `where (created_at, id) < (cursor.createdAt, cursor.id)`.
  (This is a fresh implementation for this phase — there is no reusable Viết-Kudo keyset helper.)
- **Filter state lives in the URL search param** `?hashtag={id}` — owner is the **Live board `page.tsx`**
  (integration phase 15), read by `use-board-feed`. Not component-local state (shareable/back-button safe).
- **Dept filter DROPPED this round** — `profiles.department_id` is a bare nullable int with no department
  table to resolve a name/label, so a dept filter has no data model. Logged as a follow-up; do not build.

## Requirements
### Server actions / queries (`src/features/board/board-queries.ts`, `src/features/board/heart-actions.ts`)
- `toggleHeart(kudoId)`: insert-or-delete own heart (idempotent per `(user, kudo)` PK). Self-heart is
  blocked by phase-01 RLS `WITH CHECK` — action catches the rejection → friendly error, no client-side
  re-check. Stamp `is_special_day` from today's `special_day_config`. Returns `{ liked, heartCount }`.
- `getHighlightKudos()`: top-5 by weighted heart count (special-day aware) from `kudos_public`.
- `listBoardKudos({ cursor, hashtagId? })`: keyset page of `kudos_public` (dept filter dropped).
  Hashtag filter joins **FROM `kudos_public`** (mask preserved). **Full row shape returned:**
  `{ id, senderId: string|null, senderName: string, senderAvatarUrl: string|null, receiverName: string,
  receiverAvatarUrl: string|null, contentHtml, createdAt, heartCount: number, likedByMe: boolean }`.
- `getSpotlightAggregation({ hashtagId? })`: flat `[{ receiverId, name, avatar, kudoCount }]` for word-cloud.

### Client hooks (`src/features/board/use-board-feed.ts`, `use-toggle-heart.ts`, `use-highlights.ts`, `use-spotlight.ts`)
- `use-board-feed`: `useInfiniteQuery` keyset; reads the `?hashtag` URL search param for its filter.
- `use-toggle-heart`: optimistic toggle + rollback on error; invalidates highlights + feed row.
- **Realtime (signal-only):** subscribe `postgres_changes` on `kudos` (INSERT) + `hearts` (INSERT/DELETE).
  The payload for `kudos` carries only `payload.new.id` + `created_at` (phase-01 publication column-list) →
  use `payload.new.id` **purely as an invalidation trigger**; re-fetch the affected row(s) via
  `kudos_public`. **Never surface raw payload fields to the UI** (they would bypass the mask). Realtime on
  a VIEW is unsupported → subscribe the base `kudos` table for the signal, read through the view. Unsubscribe on unmount.

## Architecture — data flow
```
kudos_public ──listBoardKudos(keyset (created_at,id) desc, ?hashtag)──▶ infinite feed (full masked row shape)
             ──getHighlightKudos(weighted top-5)──▶ carousel
             ──getSpotlightAggregation──▶ flat recipient nodes ──▶ client word-cloud (Track A)
hearts ──toggleHeart(optimistic, self-heart blocked by RLS)──▶ heartCount
Realtime kudos(id,created_at)/hearts ──payload.new.id = SIGNAL──▶ invalidate ──re-fetch via kudos_public──▶ UI
```

## Related Code Files
- **Create:** `src/features/board/board-queries.ts`, `src/features/board/heart-actions.ts`,
  `src/features/board/use-board-feed.ts`, `src/features/board/use-toggle-heart.ts`,
  `src/features/board/use-highlights.ts`, `src/features/board/use-spotlight.ts`.
- **Modify:** none (reuse kudos actions read-only).
- **Delete:** none.

## Implementation Steps
1. `toggleHeart` insert/delete + special-day stamp; return `{ liked, heartCount }`. Self-heart guard is
   phase-01 RLS — catch the rejection, do not re-implement.
2. `getHighlightKudos` weighted top-5 query over `kudos_public` + hearts join.
3. `listBoardKudos` keyset `(created_at, id) desc` + optional hashtag filter (join FROM `kudos_public`),
   returning the full masked row shape incl. `receiverName`, `receiverAvatarUrl`, `heartCount`, `likedByMe`.
4. `getSpotlightAggregation` flat recipient counts.
5. Hooks: infinite feed (reads `?hashtag` URL param), optimistic heart, highlights, spotlight;
   Realtime signal-only subscribe/unsubscribe (re-fetch via `kudos_public`, never surface payload).

## Todo
- [ ] `toggleHeart` (idempotent; self-heart handled by RLS, error surfaced; special-day stamp)
- [ ] `getHighlightKudos` (weighted top-5)
- [ ] `listBoardKudos` (keyset (created_at,id) desc + hashtag filter FROM kudos_public + full masked row shape)
- [ ] `getSpotlightAggregation` (flat recipient counts)
- [ ] hooks incl. optimistic toggle + signal-only Realtime (re-fetch via view) + unsubscribe
- [ ] filter state read from `?hashtag` URL param (owner = board page.tsx, phase 15)
- [ ] all feed reads via `kudos_public` (no direct `kudos` read; no raw Realtime payload to UI)

## Success Criteria (binary)
- [ ] Feed rows for anonymous kudos expose `senderId = null` AND a non-null `receiverName` (masking holds end-to-end).
- [ ] `toggleHeart` twice returns to original state (idempotent); self-heart rejected (RLS error surfaced).
- [ ] Highlights returns ≤5 rows ordered by weighted heart count.
- [ ] Keyset paging on `(created_at, id) desc` returns no duplicate/skipped rows across pages.
- [ ] A Realtime `kudos` event delivers only `id`/`created_at`; UI re-fetches via `kudos_public` (no raw payload rendered).
- [ ] Hashtag filter results contain only masked rows (join is FROM `kudos_public`).

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| Direct `kudos` read bypasses mask | Med | **High** | All reads FROM `kudos_public`; null-sender test; review gate |
| Realtime payload leaks anon sender | Med | **High** | Payload column-list (phase-01) + signal-only handler; re-fetch via view |
| Keyset skips/dupes at boundary | Med | Med | `(created_at,id)` composite cursor + test |
| Realtime storm on active board | Low | Med | Debounced invalidation; single channel |
| Optimistic heart desyncs count | Med | Low | Rollback on error + server truth on settle |

## Security Considerations
- Reads restricted to `kudos_public`; heart writes RLS-scoped to caller; special-day config read-only.

## Next Steps
- Live board UI (12) + Profile received feed (13, reuses heart/keyset) consume these in integration (15).

## MoMorph refs:
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
