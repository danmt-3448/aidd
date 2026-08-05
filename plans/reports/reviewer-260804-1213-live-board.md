## Review Summary

### Scope
- **Files reviewed:** `board-queries.ts`, `heart-actions.ts`, `use-board-feed.ts`, `use-toggle-heart.ts`, `use-highlights.ts`, `use-spotlight.ts`, `board-connected.tsx`, `src/app/board/page.tsx`, all `src/features/board/components/*.tsx`, migrations `20260731030000`, `20260731040000`, `20260731070000`, `20260731090000`, `20260731100000`, `guard-rules.ts`, `src/proxy.ts`
- **Lines reviewed:** ~1 400 LoC
- **Depth:** full — diff + surrounding context + DB migrations

### Assessment

The anonymous-sender mask and Realtime signal-only pattern are implemented correctly end-to-end through the DB layer. Phase-04 Track B logic is well-structured and the trust boundary (all reads via `kudos_public`) holds. However, there are two issues that block production deploy: the auth guard is silently inactive (the middleware file is named `proxy.ts` instead of `middleware.ts`, so Next.js never runs it), and the profile-navigation handler passes the kudo UUID instead of a user UUID on every click. A performance issue in the spotlight query (unbounded full-table scan + client-side aggregation) is a high-severity concern once the event goes live.

---

### Critical

**C-1 — Auth guard not active: `/board` is unprotected**
- **File:** `src/proxy.ts` (should be `src/middleware.ts`)
- **Detail:** Next.js only recognises middleware at `<root>/middleware.ts` or `<root>/src/middleware.ts`. The guard logic lives in `src/proxy.ts`, which Next.js never loads. Every comment in `src/app/board/page.tsx`, `src/app/rules/page.tsx`, `src/app/secret-box/page.tsx` says "Auth-guarded by proxy" — none of them are. An unauthenticated visitor reaches the page shell. The data layer (RLS `grant select … to authenticated`) still blocks data reads, so no data leaks — the board renders empty. But the intent is unambiguous: the route must require auth, and today it does not.
- **Fix:** rename `src/proxy.ts` to `src/middleware.ts`. No other change needed; the guard logic is correct.
- **Blast radius:** all non-public routes, not just `/board`.

---

### High

**H-1 — `onOpenProfile` receives kudo UUID, not user UUID**
- **File:** `src/features/board/components/board-feed-card.tsx:70, 87, 166`
- **Detail:** All three click handlers call `onOpenProfile(id)` where `id` is the prop destructured from `FeedCardProps.id` — the **kudo UUID**. The sender-click at line 70 and receiver-click at line 87 should navigate to the respective profile. `FeedCardProps` contains only `senderName`, `receiverName` — it does NOT include `senderId` or `receiverId`. `mapKudoRowToFeedCard` in `board-connected.tsx` does not forward either user UUID into the card props. Result: clicking any avatar or "Xem chi tiết" navigates to `/profile?id=<kudo-uuid>`, which will return a 404/not-found on profile lookup.
- **Fix:** Add `senderId: string | null` and `receiverId: string` to `FeedCardProps`. Populate them in `mapKudoRowToFeedCard` (both fields already exist on `BoardKudoRow`). In `BoardFeedCard`, call `onOpenProfile(senderId ?? '')` (guard null for anon) on sender click, `onOpenProfile(receiverId)` on receiver click, and use either (or omit the "Xem chi tiết" button) for the detail action. Note: `senderId` is null for anonymous kudos — the button/link should be disabled or hidden in that case.

**H-2 — `getSpotlightAggregation` has no row limit (unbounded full-table scan)**
- **File:** `src/features/board/board-queries.ts:349–439`
- **Detail:** The query `SELECT receiver_id, receiver_name, receiver_avatar_url FROM kudos_public` has no `.limit()`. For a live event with thousands of kudos this returns every row to the server action, then aggregates in JS. The spotlight re-fetches on mount and every time the `?hashtag` param changes. At 10k kudos this is a ~1 MB+ payload round-trip with an O(n) JS loop.
- **Fix:** Replace the full-scan + JS aggregation with a Postgres-side GROUP BY (via a thin RPC or a DB view). Short-term: add `.limit(1000)` as a guard so at least the worst case is bounded. Long-term: `getSpotlightAggregation` should be a Supabase RPC: `SELECT receiver_id, receiver_name, receiver_avatar_url, COUNT(*) FROM kudos_public GROUP BY 1,2,3 ORDER BY 4 DESC LIMIT 100`.

**H-3 — `BoardFeedCard` local state does not re-sync with TanStack Query rollback**
- **File:** `src/features/board/components/board-feed-card.tsx:43–44`
- **Detail:** `localLiked` and `localCount` are initialised once from props via `useState`. After `useToggleHeart.onError` restores the cache snapshot, TanStack Query re-renders the card with the original `likedByMe` / `heartCount` props — but React's `useState` ignores prop changes after mount. The card stays in the wrong (pre-rollback) visual state until the next full remount. This is a double-optimistic anti-pattern: TQ cache owns the truth but the component shadows it with its own copy.
- **Fix:** Either (a) remove `localLiked`/`localCount` entirely and render `likedByMe`/`heartCount` directly from props (the TQ optimistic update is already done at the cache layer in `use-toggle-heart`), or (b) add `key={card.id}` on the card in `BoardAllKudosFeed` — cards already use `key={card.id}`, which won't help since the id doesn't change. Option (a) is the correct fix: trust TQ as the single source of truth.

**H-4 — `cursor.createdAt` validated only as `z.string()` — weak injection guard**
- **File:** `src/features/board/board-queries.ts:58, 264–265, 286–287`
- **Detail:** `cursor.createdAt` is interpolated directly into the PostgREST `.or()` filter string without format validation. `cursor.id` is UUID-validated (safe). Although the cursor is server-generated in normal flow, `listBoardKudos` is a `'use server'` action callable directly by a client. A crafted `cursor.createdAt` containing PostgREST filter syntax (e.g. `"2024-01-01,sender_id.eq.some-uuid"`) would produce a malformed or injected filter. PostgREST casts the value to `timestamptz`, which limits damage, but the correct fix is explicit format validation.
- **Fix:** Add `.refine((v) => !isNaN(Date.parse(v)), { message: 'cursor.createdAt must be ISO8601' })` to the `createdAt` field in `listBoardKudosSchema`, or use `z.string().datetime()`.

---

### Medium

**M-1 — Duplicate Realtime channels subscribe to identical events**
- **File:** `use-board-feed.ts:89–123`, `use-highlights.ts:64–80`
- **Detail:** Both hooks open separate Supabase Realtime channels (`board-feed-realtime`, `board-highlights-realtime`) and subscribe to the same three events: `kudos INSERT`, `hearts INSERT`, `hearts DELETE`. When `BoardConnected` mounts, two WebSocket channels are opened to the same Supabase project listening on the same tables. This doubles connection overhead and subscription cost. Cleanup on unmount is correct for both.
- **Fix:** Extract a single shared `useBoardRealtime` hook (or lift the subscription to `BoardConnected`) that fires a single invalidation covering both `boardFeedKeys.all` and `highlightKeys.all`. Both hooks consume it; neither subscribes individually.

**M-2 — `getHighlightKudos` fetches `.limit(200)` and computes ranking in JS**
- **File:** `src/features/board/board-queries.ts:130–132`
- **Detail:** To rank top-5 by weighted score the query fetches up to 200 kudos with their full hearts join and does the scoring in JS. If the event generates >200 kudos the highlights may miss higher-scored ones that fall outside the 200-row window (wrong result, not just slow).
- **Fix:** Move weighted ranking to a Supabase RPC. Short-term: raise limit to a value that covers the expected max or remove it (accept the cost). The real fix is a `get_highlight_kudos()` DB function that does the aggregation and returns top-5.

**M-3 — `is_anonymous` included in `kudos_public` view — minor info leakage**
- **File:** `supabase/migrations/20260731100000_fix_kudos_public_view_security.sql:26`
- **Detail:** The `is_anonymous` flag is selected in the view. The board queries don't request it (they list explicit columns), so it is not returned today. But anyone who queries `kudos_public` with `SELECT *` can learn whether a given kudo is anonymous even when `sender_id` is null. Since `sender_id = null` already implies anonymous, this is low-impact now. Consider removing `is_anonymous` from the view's select list as defence-in-depth.

---

### Low

**L-1 — `totalKudos` falls back to `feedRows.length` (first-page count only)**
- **File:** `src/features/board/components/board-connected.tsx:153–156`
- **Detail:** Before spotlight data loads, `totalKudos = feedRows.length` (at most 20). The spotlight header shows "20 KUDOS" until spotlight resolves. Not a data integrity issue; the fallback should show 0 or a loading skeleton instead.

**L-2 — `handleOpenSecretBox` pushes to `/secret-box` unconditionally**
- **File:** `src/features/board/components/board-connected.tsx:172–174`
- **Detail:** No check for auth state before navigating. When the auth guard is fixed (C-1), this is harmless (user is always authed). Until then it's a minor inconsistency.

---

### Edge Cases Turned Up

1. **Anonymous sender "Xem chi tiết" / avatar click** — with fix H-1 applied, sender `senderId` will be null for anon kudos. The sender avatar/name button should be non-interactive (no hover, no `cursor-pointer`) or navigate to the receiver instead. The current code makes both sender and receiver buttons visually identical, so users have no cue that the sender avatar is not clickable for anon kudos.

2. **Realtime burst at event start** — debounce (300 ms) in both Realtime hooks coalesces rapid inserts, but it uses a single `debounceRef` shared between all three event types within each hook. A burst of hearts immediately followed by a kudos INSERT could clear the hearts timer and slightly delay the kudos invalidation. Unlikely to matter at event scale; noting it for completeness.

3. **`getHighlightKudos` limit-200 wrong-result scenario** — if there are 201+ kudos and the top-scoring one was inserted first (oldest), it falls outside the 200-row `ORDER BY created_at DESC` window and never appears in highlights. This is a correctness bug, not just performance (see M-2).

4. **Spotlight query with hashtag filter and !inner join** — PostgREST `!inner` on a view that has no `kudo_hashtags` join in its own definition means the join is added to the outer query. This works but PostgREST may have edge-case behaviour when `inner` join is applied on a non-keyed view column. Worth confirming in integration tests.

5. **`onSettled` in `useToggleHeart` always invalidates the full feed** — this triggers a re-fetch of page 1 even for a heart toggle deep in the feed. For a board with 500 visible kudos across 25 pages, this collapses the user back to page 1. Confirm desired UX; may want to invalidate only the specific kudo's page key.

---

### Done Well

- **Anon mask is enforced at the right layer.** All reads go through `kudos_public`; `board-queries.ts` never touches the base `kudos` table. The DB migration history clearly shows the progression from the unsafe `kudos_select_authenticated` policy to `kudos_select_own` + view-based feed.
- **Realtime payload handling is correct.** Both `useBoardFeed` and `useHighlights` use the postgres_changes callback purely as an invalidation trigger. No payload field (`payload.new.*`) is read or surfaced to the UI. The Realtime publication restriction to `(id, created_at)` columns in migration `090000` closes the wire-level leak.
- **Heart authz layering is correct.** `toggleHeart` checks auth explicitly, delegates self-heart prevention to RLS `WITH CHECK`, and catches the PG error code (`42501`) to surface a friendly message. No client-side re-implementation of the DB constraint.
- **Optimistic update rollback pattern in `useToggleHeart`** is the right shape: snapshot before mutation, restore on error, invalidate on settle. The issue (H-3) is that `BoardFeedCard` duplicates this with its own local state.
- **Keyset cursor design** `(created_at desc, id desc)` is the correct composite for stable pagination without gaps or duplicates. The OR decomposition of the tuple predicate is the right workaround for Supabase JS's lack of native tuple comparison.
- **Input validation with Zod** is present on all server action inputs. UUID validation on `kudoId` and `cursor.id` is correct.
- **Error handling** is consistent: every server action returns `{ error: string }` on failure; raw DB errors never reach the client; `console.error` logs the real message server-side.
- **Deferred sidebar stats are honest zeros**, not fabricated numbers. The `DEFERRED_USER_STATS` / `DEFERRED_LEADERBOARD` constants are clearly labelled and produce the component's own "Chưa có dữ liệu." placeholder — correct handling of the phase-05 dependency.

---

### Actions In Order

1. **(C-1) Rename `src/proxy.ts` → `src/middleware.ts`** — activates the auth guard on all protected routes.
2. **(H-1) Add `senderId`/`receiverId` to `FeedCardProps` and fix `onOpenProfile` calls** in `board-feed-card.tsx`. Disable/hide sender button for anon kudos.
3. **(H-3) Remove `localLiked`/`localCount` from `BoardFeedCard`** — render `likedByMe`/`heartCount` directly from props. TQ cache is already the single source of truth.
4. **(H-2) Add `.limit(1000)` guard to `getSpotlightAggregation`** as an immediate cap; schedule RPC migration for real-scale protection.
5. **(H-4) Add `.datetime()` or `.refine(isISO8601)` to `cursor.createdAt` in `listBoardKudosSchema`**.
6. **(M-2) Raise or remove `getHighlightKudos` limit** until RPC migration is ready (avoids silent wrong-result at >200 kudos).
7. **(M-1) Consolidate Realtime subscriptions** into a single shared hook.

---

### Numbers

- **Type coverage:** no `any` without justification found in reviewed files (the `as RawRow[]` casts are documented workarounds for Supabase SDK inference limits — acceptable).
- **Test coverage:** 57 Track B unit tests + 36 Track A unit tests per brief. Not run (read-only review). No coverage number available.
- **Lint findings:** 0 apparent syntax/lint issues in reviewed files.

---

### Still Unresolved

- **Phase-05 sidebar stats** (documented deferral) — honest zero state is in place; not a blocker for this phase.
- **Hashtag name join in feed rows** (phase-05) — hashtag filter chips are omitted from the board feed per the plan. The carousel filter chip currently filters locally on `c.hashtags?.includes(tag)` but `hashtags` is never populated (the mapper omits it). This means the carousel hashtag filter is a dead UI path today. Not counted as Critical because the plan acknowledges hashtag join as a phase-05 item and the `hashtags={[]}` passed to `BoardScreen` means no chips render.
- **`getHighlightKudos` limit-200 wrong-result risk** — requires RPC migration (medium complexity); tagged M-2/H-4 above with short-term mitigation.

---

**Verdict: CHANGES_REQUIRED**

Two issues must be fixed before this ships: `src/proxy.ts` → `src/middleware.ts` (auth guard inactive), and the `onOpenProfile(id)` wrong-ID bug (every profile click navigates to a 404). H-3 (local state desync) should ship with the fix; H-4 (cursor format validation) is a one-liner. Items M-1 and M-2 can be deferred with a tracking issue.
