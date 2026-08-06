# UI-First Gate — Header (fixed overlay, all screens) — MIXED (behavior PASS · numeric pixel-diff FAIL, see caveat)

> **Honest verdict:** the header *behavior* change (fixed / overlay / see-through / no occlusion) is **verified correct** by live DOM measurement + Figma node values. The gate's *numeric pixel-diff* criterion is **FAIL** (20–24% whole-page), but that failure is structural to diffing a now-transparent header against a static Figma frame with different mock content behind it — **not caused by this change**. See the "Numeric pixel-diff" section. Do NOT read this as a clean green pixel gate.

**Change:** header `sticky`/`absolute` → **`fixed`**, frosted **see-through** bar that **overlays** page content (content scrolls behind it). Applies to the shared `SiteHeader` (Homepage, Board, Awards, Profile, Notifications) + `LoginHeader` (Login).

**Design source (authoritative):** Figma/MoMorph `mms_A1_Header` node `2167:9091` (screen `i87tDx10uM`) — `position: absolute`, `y=0`, `backgroundColor: rgba(16,20,23,0.8)` (**80% opacity**) + backdrop-blur 12px. Old `sticky` mode put nothing behind the bar (pushed content down) → looked solid = the reported bug.

## Files changed
- `src/components/site-header.tsx` — `fixed inset-x-0 top-0 z-50`; uniform bg `rgba(16,20,23,0.8)` + `backdrop-filter: blur(12px)`; removed the `overlay` prop (dual-mode) — one faithful header.
- `src/features/board/components/board-connected.tsx` — dropped `overlay` prop.
- `src/features/awards/components/awards-showcase.tsx` — content `pt-16` → `pt-24` (wordmark cleared header).
- `src/features/notifications/notifications-connected.tsx` — `main py-8` → `pb-8 pt-24` (heading clears header).
- `src/features/profile/components/profile-screen.tsx` — content column `pt-24` (avatar/hero clears header).
- `src/features/auth/components/login-header.tsx` — `sticky` → `fixed inset-x-0 top-0`.
- `src/features/auth/components/login-screen.tsx` — `main pt-[208px]` → `pt-[288px]` (header out of flow → Figma content y=288).

## A. Visual fidelity (1440 primary / 1280 secondary) — measured live @ 127.0.0.1:3001
Header computed style verified live on every screen: `position: fixed`, `top: 0`, `height: 80`, `background: rgba(16,20,23,0.8)` (**80%**), `backdrop-filter: blur(12px)`, `z-index: 50`.

| Screen | 1440 | Content vs 80px header | Note |
|---|---|---|---|
| Homepage `/` | PASS | hero bleeds to y=0 under header; ROOT text below | scroll-test: header stays `top:0`, content passes behind frosted bar (see-through ✓) |
| Board `/board` | PASS | KUDOS banner bleeds to y=0 under header | 1280 checked: no horizontal overflow (scrollW 1265 ≤ vw) |
| Awards `/awards` | PASS | wordmark top **64→96px** after `pt-24` — no longer clipped | matches Homepage hero clearance |
| Notifications `/notifications` | PASS | heading `Tất cả thông báo` at y=96 (16px below header) | `pt-24` clears header |
| Login `/login` | PASS | content at y=288 (Figma); header overlays keyvisual | `pt-[288px]` |
| Profile `/profile` | PARTIAL | header `fixed` confirmed live; `pt-24` offset identical to Notifications (verified) | full-data render blocked — Supabase local down (env, not code) |

Diff images / screenshots: `plans/reports/_gate-ref/header-fix/`
Port verified: `127.0.0.1:3001`.

### Numeric pixel-diff (pixel-diff.mjs, app fullPage vs Figma frame, @1440) — ran 260806-0736
| Screen | whole-page ratio | header-band (top 120px) | numeric verdict |
|---|---|---|---|
| Board `/board` | **24.45%** | **7.43%** | FAIL (see caveat) |
| Homepage `/` | **20.62%** | **11.98%** | FAIL (see caveat) |

**Numeric gate verdict = FAIL — but it does NOT measure this change.** Root causes of the ratio, none introduced by `sticky→fixed`:
1. **See-through header vs static frame** — the header is now transparent, so it reveals page content *behind* it; the app's mock content (word-cloud names, avatars, feed cards, keyvisual art) differs from Figma's specific frame content → that difference shows through the header. A transparent header structurally cannot pixel-match a static Figma frame with different content behind it.
2. **Whole-screen / mock-data drift is pre-existing** — fullPage-vs-artboard height + dynamic mock data dominate the 20–24%.
3. **15px scrollbar** (actual 1425 vs ref 1440/1512) forces a horizontal rescale → adds misalignment.

→ For this specific change, the **valid** validators are the live DOM/behavior checks below, not whole-page pixelmatch. A clean numeric fidelity pass would require mock content matching the Figma frame 1:1 + Supabase up — a separate, pre-existing screen-fidelity task, not caused by this PR.

## B. Behavior (mock data)
- [x] `fixed` position pinned on scroll — verified live on Homepage (scrollY=700 → header.top=0).
- [x] See-through overlay — content visibly passes behind the 80% frosted bar on scroll.
- [x] No content occluded — measured logo/heading tops vs header bottom on every screen.
- [x] No horizontal overflow at 1280 (board scrollWidth 1265 ≤ viewport).
- [x] Console: 0 **application** errors. All errors observed are Next.js dev HMR websocket noise (`webpack-hmr … ERR_INVALID_HTTP_RESPONSE`) — dev-server only, unrelated.
- [x] `tsc --noEmit` exit 0; eslint clean on changed files.

## Verdict: MIXED
- **Behavior (group B): PASS** — `fixed` + 80% frosted + overlays content on all screens; content clears the bar everywhere (no clipping). Faithful to Figma `mms_A1_Header` node value.
- **Numeric visual (group A): FAIL** — pixel-diff 20–24% whole-page @1440. Caveat above: structural to diffing a transparent header vs a static frame with different mock content; not caused by this change. **This is not a clean green pixel gate.**

## Open items
- Numeric pixel gate is FAIL for the reasons documented — a valid green pixel pass needs the app's mock content to match the Figma frame 1:1 (pre-existing screen-fidelity work) + Supabase up for the data screens. Decide before ship whether a numeric ratio is required, or whether the live behavior verification suffices for a pure header-overlay change.
- Profile could not render content (Supabase local down → data screens 404/blank). Header `fixed` confirmed live; `pt-24` offset identical to Notifications (verified at y=96). Re-run with `npm run db:reset` for a full pass.
