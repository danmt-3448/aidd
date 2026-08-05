# Figma Structure + UI Bug Investigation — SAA 2025

**Date:** 2026-08-04  
**fileKey:** `9ypp4enmFmdK3YAFJLIu6C`  
**Method:** Static code analysis + visual inspection of saved MoMorph Figma frames (`plans/reports/ui-audit/momorph/`) + live app screenshots (`plans/reports/ui-audit/shots/`) + prior audit reports (`reviewer-260804-1540` and `-1638`).  
**MoMorph MCP:** NOT directly queried in this session (ToolSearch MCP not available). All findings derived from saved Figma reference images, code, screenshots, and prior audit text.

---

## Task 1 — SCREEN vs MODAL Classification

### Classification Table

| Frame | screenId | Classification | Current app route | Trigger | Close behavior |
|---|---|---|---|---|---|
| Homepage SAA | `i87tDx10uM` | FULL-PAGE SCREEN | `/` | Direct nav | — |
| Login | `GzbNeVGJHz` | FULL-PAGE SCREEN | `/login` | Unauthenticated redirect | — |
| Countdown | `8PJQswPZmU` | FULL-PAGE SCREEN | `/countdown` | Direct nav | — |
| Awards / Prize | `zFYDgyj_pD` | FULL-PAGE SCREEN | `/awards` | Nav: "Award Information" | — |
| Sun* Kudos Live Board | `MaZUn5xHXZ` | FULL-PAGE SCREEN | `/board` | Nav: "Sun* Kudos" | — |
| Profile | `3FoIx6ALVb` | FULL-PAGE SCREEN | `/profile` | Account menu → "Profile" | — |
| **Thể lệ / Rules** | `b1Filzi9i6` | **MODAL / SIDE-PANEL** (confirmed) | `/rules` (WRONG) | FAB menu → "Thể lệ" | "Đóng" button (×) |
| **Secret Box** | `J3-4YFIpMM` | **MODAL / OVERLAY** (confirmed) | `/secret-box` (WRONG) | Sidebar "Mở quà" CTA on `/board` | × top-right → nav to `/board` |
| Viết Kudo | `ihQ26W78P2` | MODAL / OVERLAY (confirmed) | Modal (correct — `KudoComposeModal`) | FAB "Viết Kudo" / Board write-trigger | × close button |

### Rules (`b1Filzi9i6`) — CONFIRMED MODAL

Figma frame shows a **553px wide side panel anchored to the right edge of the viewport**, over a dark `#00101A` background. The panel does NOT fill the full viewport width at desktop; the left portion is the dark background. This is exactly a drawer/side-panel overlay, not a routed page.

- Trigger: FAB menu item "Thể lệ" → link to `/rules`
- Close behavior: "Đóng" (×) button in the action bar at the bottom of the panel
- Confirmed from code: `rules-panel.tsx` has `role="dialog"` and `aria-modal="true"` — the component itself knows it is a modal
- **Problem**: It is rendered as a standalone route `/rules` using `useState(visible)`. When the user clicks "Đóng", `setVisible(false)` shows a "Mở lại Thể lệ" fallback button on a blank dark page. There is no navigation back. The close behavior is broken because closing a modal should navigate BACK (history.back or router.push('/')) — not hide content in-place.

### Secret Box (`J3-4YFIpMM`) — CONFIRMED MODAL

Figma frame shows a compact modal card (roughly 380×500px) centered on the dark background. NOT a full page. The `×` in the top-right navigates to `/board`.

- Current implementation: rendered as a standalone route `/secret-box`
- The modal nature is acknowledged in code (`SecretBoxConnected` passes `onClose=router.push('/board')`)
- Architecture mismatch: a full navigation load happens for what should be an overlay

### Viết Kudo (`ihQ26W78P2`) — CONFIRMED MODAL (already correct)

Already implemented as `KudoComposeModal` — an overlay rendered on top of the current page. No routing change needed.

### Notifications — NOT found in saved MoMorph frames

No `onDIohs2bS` or other notification screenId was observed in saved frame images or plan references. The notification system is a **bell-icon-triggered panel** (unread badge + realtime), not a standalone screen per the clarifications: "Build notification service đầy đủ (table notifications + unread badge + Supabase Realtime)". No dedicated Figma frame confirmed — treated as a sidebar/dropdown component, not a screen.

### Community Standards / Tiêu chuẩn cộng đồng — NOT found

No frame found in saved refs or plan phase files. No screenId `onDIohs2bS` resolved. This appears to be either absent from the current Figma file or not part of the current build scope.

### 404 / 403 / Error — No Figma frames found

ScreenIds `T3e_iS9PCL`, `p0yJ89B-9_` not found in any plan file or saved frame. No `not-found.tsx` or `error.tsx` exists in `src/app/` at all.

---

## Task 2 — UI Bug Analysis

### Bug 1 — Homepage Footer: Active State Wrong + Nav Targets Wrong

**File:** `src/features/homepage/components/homepage-footer.tsx`

**Root cause:** Footer `NAV_LINKS` array hardcodes incorrect targets:

```ts
{ label: 'Sun* Kudos', href: '/kudos' },  // ← should be '/board'
{ label: 'Rules', href: '/rules' },        // ← design label is 'Thể lệ'
```

SiteHeader correctly uses `/board` for "Sun* Kudos" (and `/kudos` redirects → `/board` server-side). Footer still sends users to `/kudos` directly (which redirects, causing an extra round-trip), and uses the English label "Rules" instead of "Thể lệ".

**Active state:** The footer has NO active-state logic at all. No `aria-current`, no highlight, no `usePathname()`. Figma footer shows nav links without per-link active highlight (footer nav is passive), so the "active-state wrong" report likely refers to the `/kudos` vs `/board` inconsistency — a user on `/board` clicking the footer "Sun* Kudos" link gets a redirect instead of a no-op stay.

**Figma reference (homepage.png):** Footer visible at bottom shows: "About SAA 2025 · Award Information · Sun* Kudos · Thể lệ" — confirming "Thể lệ" is the correct label, not "Rules".

**Fix direction:**
1. Change `href: '/kudos'` → `href: '/board'`
2. Change `label: 'Rules'` → `label: 'Thể lệ'`
3. No active-state logic needed in footer (Figma footer is passive nav)

---

### Bug 2 — Awards Trophy/Badge Images Wrong

**File:** `src/features/awards/components/award-card.tsx`

**Current code:** All 6 award cards use the SAME two images:
- Background plate: `/awards/award-trophy.png` (one generic gold trophy plate)
- Overlay badge: `/awards/trophy-badge.png` (one generic badge, 120×120px centered on all cards)

**Figma reference (momorph/awards.png):** Each award card shows a **distinct circular medallion** — Top Talent has a different design from Top Project, Top Project Leader, Best Manager, Signature Creator, and MVP. The Figma designs clearly show 6 different badge/medallion images, not one repeated image.

**What the app renders (shots/awards-1280.png + 1440.png):** All 6 cards show identical dark circular medallion images (`award-trophy.png`). The gold overlay badge (`trophy-badge.png`) is the same generic mark on every card.

**Actual assets available in `/public/awards/`:**
```
award-trophy.png    ← used (generic, shared across all cards)
trophy-badge.png    ← used (generic, shared across all cards)
further-logo.png    icon-diamond.svg    icon-gift.svg
icon-kudos.svg      icon-target.svg     kudos-bg.png
kudos-qr.svg        logo-footer.png
```

No per-award medallion images exist (`top-talent-badge.png`, `mvp-badge.png`, etc.). The Figma design calls for distinct per-award images — these were never exported from Figma or added to `/public/awards/`.

**`get_media_files` status:** MoMorph MCP was not queryable in this session. Asset availability in MoMorph cannot be confirmed. Design team must export 6 distinct award medallion images.

**Fix direction:**
1. Design team exports 6 per-award images (e.g., `medal-top-talent.png`, `medal-top-project.png`, etc.)
2. Add `medalImage` field to `AwardConfig` type in `award-config.ts`
3. `AwardCard` swaps `src="/awards/award-trophy.png"` → `src={award.medalImage}`
4. Until real images arrive, current `award-trophy.png` stand-in is acceptable (all cards look identical — low visual impact at this stage)

---

### Bug 3 — FAB "Viết Kudo nhanh": Position + Behavior

**File:** `src/features/homepage/components/homepage-widget-fab.tsx`

**Behavior — current vs expected:**

The prior audit (`reviewer-260804-1638`) marked this **RESOLVED**: FAB now opens a popover menu with two items ("Viết Kudo" + "Thể lệ"). The menu, Escape-key, outside-click, and icon are all correctly wired.

**Position — ISSUE CONFIRMED:**

Current: `position: fixed; bottom: calc(50vh - 32px); right: 19px`

This places the FAB at the **vertical midpoint of the viewport minus 32px**. In the Figma frame (`homepage.png`), the FAB pill is positioned **roughly at the vertical center-right of the hero section** (not viewport midpoint). At mobile (375px), the prior audit reported: "FAB overlaps the 3rd clock digit at 375px" — the `calc(50vh - 32px)` value coincides with the countdown clock area on mobile.

**Figma specification (from rules-panel.tsx comment which cross-refs the Widget Button):** "position: fixed, bottom: calc(50vh - 32px), right: 19px" — this value is already in the code per the Figma data. The mobile overlap is a responsive layout issue, not a wrong Figma value.

**Actual remaining issue:** At 375px viewport, the hero countdown clock is centered around the 50vh point. The FAB at `calc(50vh - 32px)` from bottom ≈ `calc(50vh + 32px)` from top, which lands directly on the countdown. The countdown section needs bottom padding or the FAB needs a mobile-specific position adjustment.

**Current code already has this note** (homepage-hero.tsx:70): "pb-28 on mobile gives the fixed FAB (bottom: calc(50vh - 32px)) enough room"

Inspect the hero: the FAB is rendered inside `HomepageHero` via `HomepageWidgetFab`. The hero section takes full viewport height. At 375px, `50vh` = 375px, so FAB bottom = 375-32 = ~343px from bottom = ~657px from top on a 1000px-tall page — which does overlap the countdown clock (~400px from top at mobile).

**Fix direction:** Add `@media (max-width: 640px)` override: `bottom: 24px; right: 16px` — standard mobile FAB placement. This avoids the overlap without changing desktop behavior.

---

### Bug 4 — Language Dropdown Not Clickable

**File:** `src/components/site-header.tsx` (lines 124–152)

**Root cause:** The language button in `SiteHeader` is a **dead `<button>` with no `onClick` handler**:

```tsx
<button
  className="flex items-center rounded px-3 py-2 ..."
  style={{ gap: 6, background: 'transparent' }}
  aria-label="Select language: Vietnamese"
>
  {/* flag + "VN" + chevron */}
</button>
```

No `onClick`, no state, no call to `useLanguageSwitcher`.

**`useLanguageSwitcher` hook:** Exists and is fully implemented in `src/components/language-switcher.tsx`. It writes `NEXT_LOCALE` cookie and calls `router.refresh()` — exactly what is needed for next-intl locale switching.

**`LanguageSwitcher` component:** A bare `<select>` — not brand-consistent with the Figma pill design.

**The header uses neither.** The button is purely decorative.

**Fix direction (KISS):**
1. In `SiteHeader`, add:
   ```tsx
   const { locale, switchLocale, isPending } = useLanguageSwitcher()
   ```
2. On button `onClick`: toggle between `'vi'` and `'en'` — `switchLocale(locale === 'vi' ? 'en' : 'vi')`
3. Update `aria-label` dynamically based on current locale
4. Display current flag + locale label based on `locale` value
5. No dropdown needed (only 2 locales): simple toggle. YAGNI.

---

### Bug 5 — Rules Close Button Broken

**File:** `src/app/rules/page.tsx`

**Root cause confirmed:** The close button calls `onClose` → `setVisible(false)`. When `visible === false`, the page renders a centered "Mở lại Thể lệ" button on a blank dark background. There is:
1. No navigation back to the previous page
2. No overlay dismissal (Rules is a route, not a modal in an overlay)
3. Users who click "Đóng" are stranded on a blank `/rules` page with only a re-open button

**Underlying architecture problem:** Rules is built as a side-panel component (`role="dialog"`) but mounted as a standalone route. The two are mismatched.

**Fix directions (ranked):**

**Option A — Simplest route fix (KISS, YAGNI):**
Change `onClose` in `page.tsx` to `router.back()` (or `router.push('/')` if no prior history). Drop the `useState(visible)` mechanism entirely. The panel is always rendered at `/rules` — close means "leave this route".

```tsx
// rules/page.tsx
'use client'
import { useRouter } from 'next/navigation'
export default function RulesPage() {
  const router = useRouter()
  return (
    <main className="flex min-h-screen items-end justify-end" style={{ background: '#00101A' }}>
      <RulesPanel ... onClose={() => router.back()} />
      ...
    </main>
  )
}
```

**Option B — Convert Rules to a true modal (architecturally correct, more work):**
Mount `RulesPanel` as an overlay inside `HomepageScreen` / `BoardScreen` (wherever it's triggered from). Remove `/rules` route. FAB "Thể lệ" link becomes `onClick → setRulesOpen(true)` instead of `<Link href="/rules">`. This matches the Figma intent but requires changes in multiple files.

**Recommendation:** Option A immediately fixes the broken close. Option B is the correct end-state but can be deferred post-MVP.

---

## Task 3 — Missing Screens

### not-found.tsx (404)

**Status:** Does NOT exist. `src/app/not-found.tsx` is absent.

**Current behavior:** Next.js App Router serves its built-in generic 404 page (white background, "404 | This page could not be found"). This is completely off-brand.

**Next.js 15/16 convention:** Create `src/app/not-found.tsx` — this is a special file that Next.js renders automatically for `notFound()` calls and unmatched routes.

**Minimum required content (from SAA 2025 brand):**
- Dark navy `#00101A` background (full-screen)
- Sun* logo (top-left or centered)
- "404" in large gold `#FFEA9E` Montserrat Bold
- Brief Vietnamese message: "Không tìm thấy trang bạn cần"
- CTA button: "Về trang chủ" → `href="/"`
- No site header needed (standalone error page)

**Figma screenId `T3e_iS9PCL`:** Referenced in task description but not found in any saved MoMorph refs or plan files. Cannot confirm design spec. Build to brand defaults until spec is found.

---

### error.tsx (500 / Runtime Error)

**Status:** Does NOT exist. `src/app/error.tsx` is absent.

**Current behavior:** Next.js built-in error boundary with React's default white error UI. Completely off-brand.

**Next.js 15/16 convention:** Create `src/app/error.tsx` with `'use client'` directive (required — error boundaries must be client components). Receives `error: Error` and `reset: () => void` props.

**Minimum required content:**
- Same dark navy background + branding as 404
- "Đã có lỗi xảy ra" message
- "Thử lại" button → calls `reset()`
- "Về trang chủ" fallback

**Note:** No `global-error.tsx` required for this project (reserved for root layout errors, rare). `error.tsx` at `src/app/` level covers all route errors.

---

### Community Standards / Tiêu chuẩn cộng đồng

**Status:** No Figma screenId found in any saved reference, plan file, or clarification. Not present in the current 7-screen plan scope.

**Verdict:** Either (a) this screen does not exist in the Figma file under that name, or (b) it was never fetched. MoMorph MCP query via `list_frames` would be needed to confirm. **Treated as OUT OF SCOPE for this build cycle** until a screenId is provided.

---

## Summary Findings

### Screen/Modal Classification (final)

| Frame | screenId | Type | Route | Correct? |
|---|---|---|---|---|
| Homepage | `i87tDx10uM` | SCREEN | `/` | YES |
| Login | `GzbNeVGJHz` | SCREEN | `/login` | YES |
| Countdown | `8PJQswPZmU` | SCREEN | `/countdown` | YES |
| Awards | `zFYDgyj_pD` | SCREEN | `/awards` | YES |
| Live Board | `MaZUn5xHXZ` | SCREEN | `/board` | YES |
| Profile | `3FoIx6ALVb` | SCREEN | `/profile` | YES |
| Thể lệ | `b1Filzi9i6` | **MODAL (side-panel)** | `/rules` | **WRONG — close is broken** |
| Secret Box | `J3-4YFIpMM` | **MODAL (overlay)** | `/secret-box` | Acceptable but architecturally wrong |
| Viết Kudo | `ihQ26W78P2` | MODAL | in-place overlay | CORRECT |

### Bug Priority Table

| # | Bug | File | Severity | Fix effort |
|---|---|---|---|---|
| 1 | Rules close button broken (stranded page) | `src/app/rules/page.tsx` | BLOCKER | Small: `router.back()` |
| 2 | Language dropdown dead (no onClick) | `src/components/site-header.tsx` | HIGH | Small: wire `useLanguageSwitcher` |
| 3 | Footer nav: `/kudos` → should be `/board`; "Rules" → "Thể lệ" | `src/features/homepage/components/homepage-footer.tsx` | MEDIUM | Trivial: 2 string changes |
| 4 | FAB overlaps countdown at 375px | `src/features/homepage/components/homepage-widget-fab.tsx` | MEDIUM | Small: mobile CSS override |
| 5 | Award medals: all 6 cards show same image | `src/features/awards/components/award-card.tsx` | MEDIUM | Blocked: needs 6 image exports from design team |

### Missing Pages

| Page | File needed | Effort | Blocks |
|---|---|---|---|
| 404 Not Found | `src/app/not-found.tsx` | Small | Production navigation errors |
| Error (500) | `src/app/error.tsx` | Small | Runtime error UX |
| Community Standards | Unknown screenId | Unknown | Depends on Figma confirmation |

---

## Unresolved Questions

1. **Community Standards / Tiêu chuẩn cộng đồng screenId**: What is the MoMorph `screenId`? Does this screen exist in the current Figma file? Needs `list_frames` query via MoMorph MCP.
2. **Notification panel Figma design**: Is there a dedicated frame for the notification dropdown/panel? Only the bell + badge count was found; no panel design was saved in `plans/reports/ui-audit/momorph/`.
3. **Award medal images**: 6 per-award images need to be exported from Figma by the design team. MoMorph `get_media_files` query could confirm if they are already available as exportable assets.
4. **Secret Box re-architecture**: Should `/secret-box` be converted to a true in-page modal (mounted inside `/board`) or kept as a route with the modal-panel UI pattern? Current approach works but is not pixel-accurate to Figma's overlay intent.
5. **404/Error Figma specs** (`T3e_iS9PCL`, `p0yJ89B-9_`): These screenIds were referenced in the task but no saved frame images exist. If these frames exist in Figma, a `get_frame_image` call is needed to get design specs.
