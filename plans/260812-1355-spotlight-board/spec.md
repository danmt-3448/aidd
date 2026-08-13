# SPEC — Spotlight Board (Live Kudos word-cloud)

> Screen: **Sun\* Kudos — Live board**, section **B.7 Spotlight** (word cloud)
> MoMorph: `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ`
> Figma node (Spotlight block): `2940:14174` · fileKey `9ypp4enmFmdK3YAFJLIu6C`
> Route: `/board` · Components: `src/features/board/components/board-spotlight*`
> Date: 2026-08-12 · Branch: develop · Status: DRAFT for review

## 0. TL;DR
Spotlight is already wired (word cloud, pan/zoom, realtime infra). Fix 4 gaps: (1) populate the realtime **activity feed** (currently hardcoded empty), (2) make **search** navigate to the matched Sunner's profile (currently only dims), (3) rewire ⤢ to **fullscreen** (currently resets pan/zoom), (4) match Figma **nebula background** fidelity.

## 1. Confirmed decisions (clarifications 2026-08-12)
- ⤢ bottom-right button → **Fullscreen** (immersive). Pan/zoom stays on mouse. (Supersedes MoMorph spec B.7.2 "Pan/Zoom toggle" — Figma image + user intent win.)
- Search + Enter/magnifier → **navigate to matched Sunner profile** `/profile?id=<receiverId>`. Live cloud-highlight while typing.
- Activity feed → **6 most-recent kudos from DB + realtime prepend** (always populated).
- Multi-match search → **dropdown match-picker** (confirmed): typing shows a dropdown of matching Sunners; user picks one → navigate `/profile?id=<receiverId>`. Exact single match on Enter can navigate directly. 0 matches → empty-state hint in dropdown, no nav.
- ⤢ = fullscreen, **but keep a small pan/zoom reset button** alongside it (confirmed) — `handleReset` stays live.

## 2. Existing contracts (verified — reuse, don't rebuild)

**View `kudos_public`** (`supabase/migrations/20260731070000_create_kudos_public_view.sql`, then recreated with **security-definer semantics** — view owner's privileges; `security_invoker` was removed in `20260731100000_fix_kudos_public_view_security.sql`) exposes `receiver_id, receiver_name, receiver_avatar_url, created_at` (+ sender fields, anonymity-safe). New `list_recent_activity` RPC reads `kudos_public` following the established `get_spotlight_aggregation` pattern. Recipient name is public → activity feed shows recipient → **no privacy leak** (only *sender* can be anonymous).

**Realtime publication** (`supabase/migrations/20260731090000_fix_kudos_select_rls_and_realtime.sql:38`): `kudos` published as `(id, created_at)` only → payload can't carry names → **must refetch on signal** (signal-only pattern).

**Realtime pattern to mirror** — `use-board-feed.ts:86-125`: `.channel('board-feed-realtime').on('postgres_changes', {event:'INSERT', table:'kudos'}, debounce300 → invalidateQueries).subscribe()`, cleanup `removeChannel`.

**Types** (`board-types.ts`): `SpotlightActivityEntry { time: string; name: string }` (L100-104); `SpotlightNode { receiverId; name; avatar; kudoCount }` (L63-68).

**Wiring**: `board-connected.tsx:186` passes `spotlightActivity={EMPTY_ACTIVITY}` (`board-connected-helpers.ts:59`, `= []`). Search state lives in `board-screen.tsx:105` `const [spotlightSearch,setSpotlightSearch]=useState('')` → passed to `<BoardSpotlight search onSearchChange>`. Node click → `onOpenProfile(id)` → `board-connected.tsx:194` `router.push('/profile?id='+id)`.

**Fullscreen target**: `board-spotlight.tsx` outer `<div data-fig="2940:14174">` (1157×548, `background rgb(4,8,20)`). `transformRef` = `ReactZoomPanPinchRef` (L44); `handleReset` (L47) currently `transformRef.current?.resetTransform()`.

**⚠️ File-size ceiling (200 lines):** `board-connected.tsx` = **219** (over), `board-spotlight-word-cloud.tsx` = **202** (over). New logic MUST land in new files, and these two need a small extraction as part of the work.

## 3. Workstreams

### WS-1 — Realtime activity feed
- **DB**: new migration `supabase/migrations/2026081x_spotlight_recent_activity.sql` → RPC `list_recent_activity(p_limit int default 6)` returning `receiver_id, receiver_name, created_at` from `kudos_public order by created_at desc limit p_limit`. `security definer`, granted to `authenticated`.
- **Query fn**: `getRecentActivity(limit=6)` in `board-queries.ts` → maps rows → `SpotlightActivityEntry[]` with `time` formatted `hh:mmA` (e.g. `08:30PM`, **no space** before AM/PM per Figma), TZ Asia/Saigon. **Pin the format** with an explicit formatter — NO date library is installed (do NOT add one): `Intl.DateTimeFormat('en-US', { hour:'2-digit', minute:'2-digit', hour12:true, timeZone:'Asia/Ho_Chi_Minh' }).format(date)` then `.replace(/\s(AM|PM)/, '$1')` → `08:30PM`. Not bare `toLocaleTimeString`. Update `board-types.ts:101` comment `/** HH:MM format */` → `hh:mmA`.
- **Hook**: new `src/features/board/use-spotlight-activity.ts` — TanStack Query key `spotlightActivityKeys.list()`, `staleTime` 15s + `.channel('spotlight-activity-realtime')` INSERT on `kudos`, debounce 300ms → invalidate. Return `SpotlightActivityEntry[]`.
- **Wire**: `board-connected.tsx:186` → `spotlightActivity={activity}` from hook; retire `EMPTY_ACTIVITY`.
- **Render**: `board-spotlight-activity.tsx` — newest on top, older lines step down in opacity (gradient per Figma); prepend fade/slide-in animation. Opacity ramp + text style values from `get_node` on the feed layer — **not guessed**.

### WS-2 — Search → Sunner profile (dropdown match-picker)
- **Prop ownership (locked):** resolver lives in `board-spotlight.tsx` (has `nodes` + `onOpenProfile` in scope). `BoardSpotlightSearch` renders the dropdown + gains `onSelect?: (receiverId) => void`. **No** new prop threads to `board-screen.tsx`/`board-connected.tsx`.
- `board-spotlight-search.tsx`: keep live `onChange`; render a **dropdown of matching Sunners** below the input (name + avatar). Compute matches from `nodes` filtered by `q.trim()` (ci `includes`), cap ~8 rows. **Guard empty** — `q.trim().length === 0` → no dropdown.
- Pick a row (click / Enter on highlighted) → `onSelect(receiverId)` → existing `onOpenProfile(receiverId)` → `/profile?id=`. Exact single match + Enter → navigate directly. 0 matches → dropdown empty-state "Không tìm thấy Sunner", no nav.
- Keep **live cloud-highlight** as secondary feedback: matches in highlight color + scale up, non-matches dim. Highlight color from `get_node` on the red name layer — **not guessed**.
- Note: node **click** already navigates to profile — WS-2 only adds the search path, don't re-implement click.
- New file if search grows: extract dropdown list into `board-spotlight-search-results.tsx` to keep `board-spotlight-search.tsx` ≤200.

### WS-3 — Fullscreen
- New `src/features/board/use-fullscreen.ts`: `{ isFullscreen, toggle, ref }` — `ref.requestFullscreen()` / `document.exitFullscreen()`, `fullscreenchange` listener; fallback CSS `fixed inset-0 z-50` overlay if API unavailable. ESC exits (native + overlay keydown). **SSR-guard** all `document`/`requestFullscreen` access (`typeof document !== 'undefined'`).
- `board-spotlight.tsx`: attach ref to `<div data-fig="2940:14174">`; pass `toggle`+`isFullscreen` to controls. The container has hardcoded `height:548` + `overflow-hidden` → see refit.
- `board-spotlight-controls.tsx`: **two buttons** — keep the existing pan/zoom **reset** button (`handleReset` stays), plus add the ⤢ **fullscreen** toggle; ⤢ icon swaps to collapse glyph when `isFullscreen`.
- **Refit (DECIDED): CSS scale wrapper.** `use-fullscreen.ts` exposes `containerHeight`; `board-spotlight.tsx` passes it to `BoardSpotlightWordCloud` as `fullscreenHeight?: number`; word-cloud computes `scale = (fullscreenHeight − topBarH − bottomBarH) / CANVAS_H` and applies `transform: scale()` to the inner TransformWrapper container to fill viewport height, preserving aspect ratio — keeps `CANVAS_W/CANVAS_H` and the collision layout stable (no re-run of `board-spotlight-layout.ts`). Avoids the dark-void-below-cloud clip that fixed `height:548` would cause at 900–1080px viewports. Acceptance = no clip/overlap at fullscreen.

### WS-4 — Visual fidelity (background)
- Figma bg = dark nebula + faint **constellation network** + orange/teal feather bleed at edges. Export real assets via `get_media_files`/`get_figma_image` on `2940:14174` (+ children); render as layered `<Image>`/CSS. **Do NOT reconstruct with eyeballed gradients.**
- All colors/opacity/size for frame + text layers from `get_node`; `data-fig` tags on measured elements for `style-assert.mjs`.

## 4. Files
**Create**
- `supabase/migrations/2026081x_spotlight_recent_activity.sql` — `list_recent_activity` RPC
- `src/features/board/use-spotlight-activity.ts` — query + realtime hook
- `src/features/board/use-fullscreen.ts` — Fullscreen API + fallback
- `src/features/board/components/board-spotlight-bg.tsx` — extracted background image layer (Phase 03, keeps `board-spotlight.tsx` ≤200)

**Modify**
- `src/features/board/board-queries.ts` — `getRecentActivity()` + `spotlightActivityKeys`
- `src/features/board/components/board-connected.tsx` — wire activity; **extract ~20 lines** to drop under 200
- `src/features/board/components/board-connected-helpers.ts` — retire `EMPTY_ACTIVITY`
- `src/features/board/components/board-spotlight.tsx` — fullscreen ref + hook
- `src/features/board/components/board-spotlight-controls.tsx` — ⤢ → fullscreen toggle + collapse glyph
- `src/features/board/components/board-spotlight-search.tsx` — submit handler
- `src/features/board/components/board-spotlight-word-cloud.tsx` — highlight color + fullscreen scale; **extract ~20–30 lines** (WS-2/WS-3 add code here — leave headroom, not just clearing 200)
- `src/features/board/components/board-spotlight-activity.tsx` — hh:mmA + fade
- `src/features/board/components/board-types.ts` — adjust `time` doc/format if needed
- Spotlight background layer — swap to exported Figma assets

## 5. Acceptance — Behavior (UI-First Gate §B, real seeded data, authed)
- [ ] Feed shows 6 real recipients from seed, newest top, time `hh:mmA` Asia/Saigon.
- [ ] Insert a new kudo (2nd session / seed) → feed prepends live within ~300ms debounce.
- [ ] Typing shows a dropdown of matching Sunners (name+avatar); also live cloud-highlight.
- [ ] Pick a dropdown row (or Enter on single match) → route `/profile?id=<receiverId>`.
- [ ] 0 matches → dropdown empty-state "Không tìm thấy Sunner", no nav, no console error.
- [ ] ⤢ enters fullscreen; icon → collapse; ESC + collapse-click exit. Reset button still resets pan/zoom.
- [ ] Fullscreen refits cloud (no clip/overlap); feed + search + `NNN KUDOS` all visible.
- [ ] Mouse pan/zoom works in normal + fullscreen.
- [ ] `NNN KUDOS` = Σ kudoCount from real data.
- [ ] 0 console error/warning across all above.

## 6. Acceptance — Visual (UI-First Gate §A, 1440 + 1280)
- [ ] Nebula/constellation bg = exported Figma asset (not CSS-guessed).
- [ ] Highlight color, feed opacities, `NNN KUDOS` type, search pill — from `get_node` (`style-assert.mjs` exit 0).
- [ ] `data-fig` on measured elements. 1920 no-break check passes.

## 7. Out of scope
Highlight carousel (B.2), All-Kudos feed (C), sidebar (D); spotlight aggregation RPC weighting; mobile artboard (gate = 1440+1280 only). **i18n of new spotlight strings** — treat as hardcoded VN ("Không tìm thấy Sunner", feed text), consistent with existing spotlight components (they're already VN-hardcoded; only `board-feed-card.tsx` uses next-intl).

## 8. Open questions
- ~~Multi-match search~~ → RESOLVED: dropdown match-picker (§WS-2).
- ~~Pan/zoom reset affordance~~ → RESOLVED: keep small reset button beside fullscreen (§WS-3).
- ~~Verify seed has ≥6 distinct kudos~~ → CONFIRMED: seed has 44 kudo rows.
- ~~Fullscreen refit strategy~~ → RESOLVED: CSS scale wrapper (§WS-3).

## 9. Execution shape (post-approval)
Track A (UI: WS-2/3/4) ∥ Track B (WS-1 DB+realtime) — no cross-block. Then **`/aidd-ui-gate /board`** → integrate → tests (Vitest: activity mapping/time-format, best-match resolver, fullscreen hook; Playwright: search-nav, fullscreen toggle, feed prepend) → review. No e2e/unit before gate PASS.
