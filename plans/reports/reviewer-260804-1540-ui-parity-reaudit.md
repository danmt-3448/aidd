# UI Parity Re-Audit — SAA 2025 Built Screens

**Date:** 2026-08-04 · **fileKey:** `9ypp4enmFmdK3YAFJLIu6C`  
**Method:** Fresh Playwright captures @375/768/1280 (auth state `e2e/.auth/user.json`) vs MoMorph frame images (`plans/reports/ui-audit/momorph/`).  
**Shots:** `/tmp/ui-audit-fresh/` (captured live with dicebear fix in working tree).  
**Supersedes:** `reviewer-260804-ui-parity-audit.md` — stale (homepage/board/profile were CRASHED then; all 9 now fully captured).

---

## Status of Dicebear Fix

`next.config.ts` in the **working tree** already has `api.dicebear.com` whitelisted. This was NOT committed (the last commit `bb54b8d` does not contain it — it was a separate modification). Phase-01 of the fix plan is functionally done in working-tree state but **not committed**.  
Result: homepage/board/profile now render without crash. The 3 screens are fully audited below.

---

## Verified: 4 User-Reported Issues

### Issue 1 — Missing top-nav header on content screens
**Verdict: CONFIRMED — MAJOR gap.**

The `HomepageHeader` component exists only in `HomepageScreen`. None of the other 8 screens include it:

| Screen | Route | Has header in app? | Figma expects header? |
|---|---|---|---|
| Homepage | `/` | YES (HomepageHeader) | YES |
| Board | `/board` | NO — BoardKvBanner only (logo/title banner, no nav) | YES — full header visible in MaZUn5xHXZ frame |
| Profile | `/profile` | NO — no header at all | YES — header present in 3FoIx6ALVb frame |
| Awards | `/awards` | NO — full standalone page layout | Ambiguous: Figma shows header in frame; awards has its own sticky nav (left sidebar) |
| Rules | `/rules` | NO | Figma frame b1Filzi9i6 does not show header (panel/overlay style — intentional no-header) |
| Secret Box | `/secret-box` | NO — centered card on dark bg | Figma J3-4YFIpMM shows modal-style — no header (intentional) |
| Kudos modal | `/kudos` | NO — modal overlay | Figma ihQ26W78P2 shows header visible behind modal |

**Concrete finding:** Board and Profile screens have no site navigation. On `/board`, the only branding is a KV banner (logo+title). On `/profile` there is literally nothing above the avatar. Figma for both screens clearly shows the full `HomepageHeader` (logo, About/Awards/Kudos nav, bell, VN, account). This is a navigation dead end: users on board/profile cannot navigate to other sections.

### Issue 2 — FAB (Widget Button) fires single action, not a menu
**Verdict: CONFIRMED — current app vs Figma compared.**

Current app: `HomepageWidgetFab` is a single button that calls `onQuickAction()` → opens `KudoComposeModal`. No menu.

Figma analysis: The Figma "Widget Button" (node within screen i87tDx10uM) shows a pill-shaped FAB with a pen icon + "/" + kudos-logo. There is **no dropdown/menu exploded in the Figma artboard** — the design is a single compound icon without attached menu states in the screens visible. The MoMorph spec would need to be consulted for the interaction spec. From the Figma frame image alone, the FAB appears as a single action trigger (not a multi-option menu). The current implementation matches the Figma visual.

**However:** Per the task description, users reported the FAB should open a menu with "Viết Kudo + Thể lệ" options. This needs MoMorph spec confirmation. The Figma screenshot does not show a menu flyout. This item is **UNCONFIRMED from Figma alone** — needs spec lookup.

**FAB presence:** The FAB only appears on Homepage, auth-gated (`header.user !== null`). Figma for Board/Profile/Awards/Rules does not show the FAB, so this scope is correct.

### Issue 3 — "Sun* Kudos" navigation target
**Verdict: CONFIRMED — routing IA mismatch.**

In the app:
- Header nav item "Sun* Kudos" links to `/kudos` (`homepage-header.tsx:100`)
- `/kudos` is a bare page with a "Viết Kudo" button → opens compose modal
- `/board` is the actual live board (kudos feed, highlights, spotlight, leaderboard)

In Figma:
- Screen `MaZUn5xHXZ` is titled "Sun* Kudos - Live board" and is the content-rich feed screen
- The nav item "Sun* Kudos" is expected to navigate to the live board

**Intended IA:** "Sun* Kudos" in the header nav → `/board` (the live board). `/kudos` should either not be a standalone route or be the compose modal entry point from Board screen only (the BoardWriteKudoTrigger already serves this on `/board`). The current `/kudos` page is a dead stub.

### Issue 4 — Post-login "/todo" redirect
**Verdict: FIXED in working tree — CONFIRM.**

`src/proxy.ts` redirects authenticated users from `/login` → `/` (Homepage). `/todo` still exists as a placeholder page but the proxy no longer routes to it. The `/todo` route is a leftover that should be cleaned up but causes no user-facing navigation error (it's behind auth guard, so unauthenticated users hit `/login` → they won't see it). **Not a parity blocker.**

---

## Per-Screen Visual Gap Tables

### Homepage (`/` — screenId `i87tDx10uM`)

Now rendering correctly (dicebear fix in working tree). Avatar loads.

| Element | Expected (Figma) | Actual (app) | Severity | Suspected file |
|---|---|---|---|---|
| FAB label | "VN" label appears, no extra wrapping | Renders correctly | PASS | — |
| Hero countdown | 4-digit segments with separators | 4-segment flip clock ✓ | PASS | — |
| Hero subtitle text | "Tường thuật trực tiếp qua sóng Livestream" | Present ✓ | PASS | — |
| Header: "Sun* Kudos" link target | → `/board` (live board) | → `/kudos` (stub page) | MAJOR | homepage-header.tsx:100 |
| @375: countdown clocks | 3 groups visible, no clip | 4 clock segments clip off-right (4th digit hidden) | MAJOR | homepage-hero.tsx |
| @375: FAB overlaps countdown | FAB at mid-viewport-right, does not occlude | FAB overlaps the 3rd clock digit at 375px | MAJOR | homepage-widget-fab.tsx |
| Figma shows hero artwork fills full right half | Rich color artwork fills right ~50% | Present and visible ✓ | PASS | — |
| Awards grid (6 cards) | 6 award cards visible with badge images | 6 cards visible, badge images render ✓ | PASS | — |
| Awards grid badge images | Circular badge images | Empty circles (badge image not loading) | MAJOR | award-config.ts / /public/awards/ |
| @768: nav item wrapping | Nav items inline | "About SAA 2025" wraps to 2 lines at 768 | MINOR | homepage-header.tsx |
| @1280: header padding | Figma 12px/144px | `xl:px-36` = 144px ✓ | PASS | — |

### Board (`/board` — screenId `MaZUn5xHXZ`)

| Element | Expected (Figma) | Actual (app) | Severity | Suspected file |
|---|---|---|---|---|
| Site header (nav) | Full header: logo + About/Awards/Kudos + bell + VN + account | NO header — only KV banner | BLOCKER | board-screen.tsx |
| KV banner | "SAA 2025 · KUDOS" + hero artwork (woman figure) | Present ✓ — banner shows logo + text | PASS | — |
| Figma title | "Hệ thống ghi nhận lời cảm ơn" | Present ✓ | PASS | — |
| Highlight carousel | Cards with avatar photos | Avatars now loading (dicebear fixed) ✓ | PASS | — |
| Highlight card avatars | Circular avatar photos | Render correctly now | PASS | — |
| Feed card avatars | Circular avatar photos | Render correctly now | PASS | — |
| Spotlight word-cloud | Rich word-cloud with user names/count | Present ✓ but minimal data (2 kudos seed) | PASS | — |
| Sidebar: stats panel | KUDOS NHẬN / GỬI / HEARTS / SECRET BOX counts | Present ✓ | PASS | — |
| Sidebar: leaderboard | 10 sunner rankings + gift rankings | "Chưa có dữ liệu" (seed only has 2 kudos) | INFO | — |
| @375: card recipient name | Inline sender → recipient | Name wraps to 3 lines ("Trần\nThị\nBình") — layout breaks | MAJOR | board-feed-card.tsx |
| @375: highlight card | Compact carousel single card | Card renders but name wrapping is broken | MAJOR | board-feed-card.tsx |
| @768: layout | Single column stacked | Renders well ✓ | PASS | — |
| Figma KV banner right artwork | Decorative abstract art fills right side | Missing — only dark bg on right | MAJOR | board-kv-banner.tsx |
| Figma shows "Viết Kudo" trigger bar | Full-width input-style trigger | Present ✓ | PASS | — |

### Profile (`/profile` — screenId `3FoIx6ALVb`)

| Element | Expected (Figma) | Actual (app) | Severity | Suspected file |
|---|---|---|---|---|
| Site header (nav) | Full header visible above profile content | NO header — avatar is the first element | BLOCKER | profile-screen.tsx |
| Hero avatar | Circular photo with colored ring/tier indicator | Empty gold ring (avatar null/no image) | MAJOR | profile-hero.tsx |
| Hero: dept/division label | Department shown below name | Not visible (user data may lack dept) | MINOR | profile-hero.tsx |
| Hero: tier badge/stars | Tier indicator (hero tier stars) | Not visible in current seed data | MINOR | profile-hero.tsx |
| Badge collection | 6 badge slots with real badge images unlocked | 6 padlock slots (no badges earned yet) | INFO | — |
| Stats card | Figma shows "Số Kudos bạn nhận được: 5" style | Shows 2 kudos (seed data) ✓ functional | PASS | — |
| Kudos feed | Shows received kudos with content | Shows 2 kudos feed items ✓ | PASS | — |
| @375: stats card layout | Compact single-column | Renders ok ✓ | PASS | — |
| Content max-width | Profile narrow (~680px centered) | `maxWidth: 680` ✓ correct | PASS | — |
| @375: avatar circle | Centered, correct size | Renders correctly (centered) ✓ | PASS | — |

### Awards (`/awards` — screenId `zFYDgyj_pD`)

| Element | Expected (Figma) | Actual (app) | Severity | Suspected file |
|---|---|---|---|---|
| Site header | Figma shows top header above the awards content | NO header — first element is Further logo | MAJOR | awards-showcase.tsx |
| "Further" KV logo | 338×150px, white logotype | Present ✓ | PASS | — |
| Badge images in cards | Circular gold award badge photos (TOP TALENT etc.) | "TOP TALENT" text badge renders ✓ (dark card bg with text) | PASS | — |
| Figma: badge has decorative ring artwork | Glowing ring image in card | Renders ✓ (badge card has the ring image) | PASS | — |
| Two-column layout: image left / text right | Alternating: image-left for odd, image-right for even | Alternates ✓ (`imageLeft` prop) | PASS | — |
| Prize amounts: Top Talent | "10.000.000 VNĐ" (Figma shows 10M) | app shows "7.000.000 VNĐ" | MAJOR | award-config.ts |
| Prize amounts: Top Project Leader | Figma: "7.000.000 VNĐ" | app: "7.000.000 VNĐ" ✓ | PASS | — |
| Prize amounts: MVP | Figma shows different amount | app: "7.000.000 VNĐ" | MAJOR | award-config.ts |
| Quantity counts: Top Talent | Figma shows "10 ↑" (10 winners) | app: 10 ✓ | PASS | — |
| Left sticky nav | Awards names listed, first is highlighted | Nav renders ✓ | PASS | — |
| @375: "ROOT\nFURTH…" clip | Logo clips off-right | "ROOT FURT H" clips at right edge | MAJOR | awards-showcase.tsx |
| @375: heading overflow | "Hệ thống giải thưởng SAA 2025" wrap | Wraps to 4 lines ✓ acceptable | PASS | — |
| @375: left padding | `padding: '96px 144px'` is hardcoded | 144px horizontal padding causes severe left-clip @375 | BLOCKER | awards-showcase.tsx |
| @768: horizontal padding | Same 144px padding | Same clip issue at 768 | MAJOR | awards-showcase.tsx |
| Footer present | Footer with Sun* logo + copyright | Footer renders ✓ | PASS | — |
| @1440: max-width | Content should be capped | `maxWidth: '1440px'` ✓ no stretch | PASS | — |
| Hero artwork (top-right) | Figma shows colorful abstract art top-right corner | NOT present in /awards page | MAJOR | awards-showcase.tsx |

### Rules (`/rules` — screenId `b1Filzi9i6`)

| Element | Expected (Figma) | Actual (app) | Severity | Suspected file |
|---|---|---|---|---|
| No site header | Figma frame is panel/overlay style — no top nav | No header ✓ (correct) | PASS | — |
| "Thể lệ" heading | Bold yellow heading | Present ✓ | PASS | — |
| Hero badge row | Tier badges in a row (New Hero / Rising Hero / Super Hero etc.) | Renders ✓ | PASS | — |
| Badge tier images | Colored badge images inline | Badges visible with color tints ✓ | PASS | — |
| "Viết Kudo" CTA button | Yellow button at bottom | Present ✓ | PASS | — |
| "Đóng" dismiss button | Close/back button | Present ✓ | PASS | — |
| @375: content layout | Single column, readable | Renders correctly ✓ | PASS | — |
| @375: action buttons | Two buttons at bottom | Both visible ✓ | PASS | — |
| Overall parity | High fidelity | **Good — MINOR** spacing differences only | MINOR | — |

### Secret Box (`/secret-box` — screenId `J3-4YFIpMM`)

| Element | Expected (Figma) | Actual (app) | Severity | Suspected file |
|---|---|---|---|---|
| No site header | Modal/overlay style in Figma — no header shown | No header ✓ (correct) | PASS | — |
| Page background | Figma: dark full-screen bg (the page itself has no distinct color — modal sits on app bg) | App: `rgba(0,0,0,0.7)` which renders as **gray** — not true dark navy | MAJOR | secret-box/page.tsx:15 |
| Modal card width | ~652px in Figma | `max-w-[652px]` ✓ | PASS | — |
| Close button (×) | Figma shows × icon in top-right corner of modal | Close button only renders when `onClose` is passed — `SecretBoxConnected` does NOT pass `onClose` | MAJOR | secret-box-connected.tsx:38 |
| "Click vào box để mở" subtitle | Present when `unopened > 0` | Present ✓ (correct conditional) | PASS | — |
| Counter layout | Figma: "Secretbox chưa mở **05**" — text LEFT, number RIGHT (large) | App: `00 Secretbox chưa mở` — number LEFT in gold, label right | MAJOR | secret-box-modal.tsx:144 |
| Counter number size | Large (prominent) on right | Small leading (28px) on left | MAJOR | secret-box-modal.tsx:148 |
| @375: title clip | Full title visible | "KHÁM PHÁ SECRET BOX CỦA BA" — last char clips | MAJOR | secret-box-modal.tsx:29-50 |
| Box image | 557×557 gift box with sparkle effects | Present ✓ | PASS | — |
| Seed counter = 0 | Shows "00 Secretbox chưa mở" | Shows "00 Secretbox chưa mở" ✓ | PASS | — |

### Kudos Modal (`/kudos` → modal — screenId `ihQ26W78P2`)

| Element | Expected (Figma) | Actual (app) | Severity | Suspected file |
|---|---|---|---|---|
| "Danh hiệu *" field | **Required field** between "Người nhận" and content editor | **MISSING ENTIRELY** | BLOCKER | kudo-compose-modal.tsx |
| Figma: "Danh hiệu" hint text | "Danh tặng một danh hiệu cho đồng đội" + example "Người truyền động lực cho tôi." | Not present | BLOCKER | kudo-compose-modal.tsx |
| Background behind header visible | Figma shows the site header is visible behind the modal (semi-transparent backdrop) | App uses `rgba(0,16,26,0.6)` overlay — header is on Homepage which IS visible behind | PASS | — |
| Modal max-width | ~752px per Figma | `max-w-[752px]` ✓ | PASS | — |
| Modal background color | Figma: warm cream/off-white `rgba(255,248,225,1)` | App: `rgba(255,248,225,1)` ✓ | PASS | — |
| Backdrop | Figma: semi-transparent dim | App: `rgba(0,16,26,0.6)` ✓ | PASS | — |
| Title | "Gửi lời cám ơn và ghi nhận đến đồng đội" | Present ✓ | PASS | — |
| Submit button enabled state | Yellow, full-width | Present ✓ | PASS | — |
| @375: toolbar icons | All 6 toolbar icons visible | Only 5 visible — "link" and "quote" clip off-right | MAJOR | rich-text-toolbar.tsx |
| @375: Hashtag picker | Present | Present ✓ | PASS | — |
| @375: modal scrollability | Should scroll | Modal scrollable via `overflow-y-auto` ✓ | PASS | — |
| Label layout | Figma: label inline left, input right | App: label left, input right ✓ (RecipientSelect) | PASS | — |
| Char counter "0/2000" | Not in Figma | Present in app — kept intentionally (clarifications.md) | INFO | — |

### Login (`/login` — screenId `GzbNeVGJHz`)

| Element | Expected (Figma) | Actual (app) | Severity | Suspected file |
|---|---|---|---|---|
| "ROOT FURTHER" heading | 1 line, prominent | 2-line wrap ("ROOT\nFURTHER") | MINOR | login components |
| Right-side artwork | Vivid colourful abstract art | Present but slightly desaturated/darker | MINOR | login-screen.tsx |
| Header (no nav bar) | Figma: small logo top-left only | Small logo top-left ✓ | PASS | — |
| @375: layout | Full-screen with content centered | Renders correctly ✓ | PASS | — |
| @768: layout | Left text + right art | Renders correctly ✓ | PASS | — |
| Footer copyright | "Bản quyền thuộc về Sun* © 2025" | Present ✓ | PASS | — |

### Countdown (`/countdown` — screenId `8PJQswPZmU`)

| Element | Expected (Figma) | Actual (app @1280) | Severity | Suspected file |
|---|---|---|---|---|
| Labels | Figma artboard: "DAYS / HOURS / MINUTES" | App: "NGÀY / GIỜ / PHÚT" — i18n renders VN locale | CLARIFIED | clarifications.md (resolved: VN is correct) |
| Subtitle | "Sự kiện sẽ bắt đầu sau" | Present ✓ | PASS | — |
| Clock segments | 3 groups of 2 digits | Renders ✓ (4 digit pairs visible @1280) | PASS | — |
| @375: clock clip | All digits and labels visible | 4th digit pair clips off-right; "PHÚT" label fully hidden | MAJOR | countdown component |
| @375: background artwork | Colourful abstract art fills frame | Artwork visible ✓ | PASS | — |
| Responsive max-width | Content centered | No explicit max-width cap → drifts left @1440 | MINOR | countdown-screen.tsx |

---

## Cross-Cutting Findings

### A. Missing top-nav header (5 screens)

Board, Profile, Awards, Kudos-modal-host, and Secret-box-page all lack the `HomepageHeader`. Board and Profile are BLOCKER-level navigation dead ends. Awards is MAJOR. The `HomepageHeader` component is self-contained and re-usable but currently scoped only to `homepage-screen.tsx`.

Pattern: each screen was built independently in Track A without a shared shell. The integration phase did not add the header to content screens.

### B. Responsive padding not using Tailwind breakpoints

`awards-showcase.tsx` hardcodes `padding: '96px 144px'` as an inline style. This bypasses Tailwind's responsive utilities and breaks completely at 375 and 768.

Pattern: several screens use inline pixel values for spacing instead of Tailwind `px-4 md:px-8 xl:px-36` pattern.

### C. Avatar rendering (profile/board avatars)

With dicebear whitelisted, avatars now render as circular coloured letter-avatars (the actual seed data has no real photos). The gold ring placeholder in Profile (`empty circle`) is correct behaviour for a user without an avatar — but the ring outline is very subtle and may look broken to users.

### D. Prize amount data inconsistency (Awards)

All 6 awards have `prize: '7.000.000 VNĐ'` and `quantity: 10` in `award-config.ts`. The Figma screenshot for `/awards` shows different amounts per award (Top Talent was `10.000.000 VNĐ`, Signature 2025 Creator was `5.000.000 VNĐ / 8.000.000 VNĐ`). These are content data problems, not component problems.

---

## Prioritized Fix Backlog

### (a) Cross-cutting: shared header / menu

| ID | Gap | Severity | In 260804-1452 plan? |
|---|---|---|---|
| H-1 | Board `/board` missing site header | BLOCKER | Phase-10 (in scope as "diff reveals") |
| H-2 | Profile `/profile` missing site header | BLOCKER | Phase-10 (in scope) |
| H-3 | Awards `/awards` missing site header | MAJOR | Not explicitly in any phase |
| H-4 | "Sun* Kudos" nav link → `/board` (not `/kudos`) | MAJOR | Not in plan |
| H-5 | `/todo` placeholder page still exists | LOW | Not in plan |

H-1, H-2 are partially covered by Phase-10 but the phase says "fix whatever diff reveals" — the header addition is the primary diff. H-3 and H-4 are **NEW gaps not in the existing plan**.

### (b) FAB menu

| ID | Gap | Severity | In plan? |
|---|---|---|---|
| F-1 | FAB is single action vs possible menu (needs spec confirmation) | MINOR (unconfirmed) | Not in plan |

F-1 needs MoMorph spec lookup (`get_frame` on screen i87tDx10uM widget-button node). Based on Figma frame image alone, current single-button implementation appears to match visual design. **Do not build a menu without spec confirmation.**

### (c) Routing / IA

| ID | Gap | Severity | In plan? |
|---|---|---|---|
| R-1 | "Sun* Kudos" nav → `/kudos` (stub) not `/board` | MAJOR | NEW — not in plan |
| R-2 | `/kudos` page is a dead stub (bare button) — no Figma equivalent | MAJOR | NEW — not in plan |
| R-3 | `/todo` placeholder route still live | LOW | Not in plan |

### (d) Per-screen visual

| ID | Gap | Severity | In plan? |
|---|---|---|---|
| V-1 | Awards: hardcoded 144px padding breaks @375/768 | BLOCKER | Phase-05 (shared layout) / Phase-06 (awards UI) |
| V-2 | Awards: prize amounts wrong (all show 7M, Figma shows varied) | MAJOR | Phase-02 (data correctness) |
| V-3 | Awards: hero artwork (abstract art top-right) missing | MAJOR | Phase-06 |
| V-4 | Secret-box: page bg `rgba(0,0,0,0.7)` renders gray instead of dark navy | MAJOR | Phase-07 |
| V-5 | Secret-box: `onClose` not passed from Connected → × button never renders | MAJOR | Phase-07 |
| V-6 | Secret-box: counter layout — golden number should be on right side large | MAJOR | Phase-07 |
| V-7 | Secret-box: title clips at 375 | MAJOR | Phase-07 |
| V-8 | Kudos modal: missing "Danh hiệu *" field | BLOCKER | Phase-08 + Phase-12 |
| V-9 | Kudos @375: rich-text toolbar clips (6th icon hidden) | MAJOR | Phase-08 |
| V-10 | Board: KV banner missing right hero artwork | MAJOR | Phase-10 |
| V-11 | Board @375: recipient name wraps badly breaking card layout | MAJOR | Phase-10 |
| V-12 | Profile: avatar ring looks like error (no photo, only gold ring outline) | MINOR | Phase-10 |
| V-13 | Profile: dept/tier fields not populated (seed data) | INFO | — |
| V-14 | Login: "ROOT FURTHER" wraps 2 lines | MINOR | Phase-09 |
| V-15 | Login: artwork slightly desaturated | MINOR | Phase-09 |
| V-16 | Awards @375: "ROOT FURT H" logo clips | MAJOR | Phase-06 |

### (e) Responsive @375/768/1440

| ID | Gap | Severity | In plan? |
|---|---|---|---|
| RES-1 | Homepage @375: FAB overlaps countdown 3rd clock | MAJOR | Phase-09 / Phase-10 |
| RES-2 | Homepage @375: 4th digit clips off-right | MAJOR | Phase-09 |
| RES-3 | Countdown @375: 4th digit + PHÚT label clip | MAJOR | Phase-04 / Phase-09 |
| RES-4 | Awards @375/768: 144px padding breaks layout | BLOCKER | Phase-05/06 |
| RES-5 | Secret-box @375: title clips | MAJOR | Phase-07 |
| RES-6 | Kudos @375: toolbar clips | MAJOR | Phase-08 |
| RES-7 | Awards @768: left nav hidden (hidden lg:block — ok per Figma mobile) | PASS | — |

### (f) i18n

| ID | Gap | Severity | In plan? |
|---|---|---|---|
| I-1 | Countdown labels VN vs Figma EN | RESOLVED | Phase-04 (clarifications: VN is correct) |

### (g) Routing/IA clarifications (new)

Items R-1 and R-2 are new findings not addressed by any phase in `260804-1452-ui-parity-fixes`.

---

## Plan Reconciliation: 260804-1452-ui-parity-fixes

| Phase | Status | Re-audit finding |
|---|---|---|
| Phase-01 dicebear whitelist | **Done in working tree, NOT committed** — screens render | Commit it. |
| Phase-02 awards data | Still needed — prize amounts confirmed wrong | Confirmed needed. |
| Phase-03 secret-box counter | Still needed — counter layout wrong | Confirmed needed. |
| Phase-04 i18n countdown | RESOLVED — labels are intentionally VN | Phase is verify-only, as planned. |
| Phase-05 shared layout wrapper | Still needed — awards padding at 375 is BLOCKER | Confirmed needed. |
| Phase-06 awards UI | Still needed — padding, hero art, prize data | Confirmed needed. |
| Phase-07 secret-box UI | Still needed — bg, close button, counter layout | Confirmed needed. |
| Phase-08 kudos modal | Still needed — "Danh hiệu" field missing | Confirmed BLOCKER. |
| Phase-09 login + countdown UI | Still needed — heading wrap, clock clip | Confirmed needed. |
| Phase-10 re-audit 3 crashed screens | **Partially done here** — diffs enumerated | Board: header + KV artwork + @375 name-wrap. Profile: header. Homepage: @375 FAB overlap + clock clip. |
| Phase-12 Danh hiệu migration | Still needed (blocks Phase-08 submit wiring) | Confirmed needed. |
| Phase-11 verify | Cannot start until all others done | — |

**NEW gaps not in the plan** (require new phases or scope expansion):

| Gap | Recommended action |
|---|---|
| H-3: Awards missing header | Add to Phase-06 scope OR new phase after Phase-05 |
| H-4 / R-1: "Sun* Kudos" nav points to `/kudos` instead of `/board` | New phase: IA fix (1 line in homepage-header.tsx + route cleanup) |
| R-2: `/kudos` is a stub with no Figma equivalent | Decide: remove route or convert to redirect → `/board` |
| R-3: `/todo` placeholder still live | Low priority cleanup — new phase or add to Phase-09 |
| V-10: Board KV banner missing right artwork | Add to Phase-10 scope |

---

## Top 10 Gaps by Severity (Executive Summary)

| Rank | Screen | Gap | Severity | Plan coverage |
|---|---|---|---|---|
| 1 | Kudos modal | "Danh hiệu *" field entirely missing — required by Figma + spec | BLOCKER | Phase-08 + Phase-12 |
| 2 | Awards | Horizontal padding `144px` hardcoded — layout breaks @375/768 | BLOCKER | Phase-05/06 |
| 3 | Board | Missing site header — navigation dead end | BLOCKER | Phase-10 (NEW: header) |
| 4 | Profile | Missing site header — navigation dead end | BLOCKER | Phase-10 (NEW: header) |
| 5 | Phase-01 | Dicebear whitelist done in working tree but not committed — crashes in CI/staging | CRITICAL | Phase-01 (uncommitted) |
| 6 | IA | "Sun* Kudos" nav → `/kudos` stub instead of `/board` (live board) | MAJOR | NEW gap — not in plan |
| 7 | Secret-box | Page bg renders gray; no close button; counter layout wrong | MAJOR | Phase-07 |
| 8 | Awards | Prize amounts all show 7.000.000 VNĐ; Figma shows varied (Top Talent = 10M) | MAJOR | Phase-02 |
| 9 | Kudos @375 | Rich-text toolbar clips — 2 icons not visible | MAJOR | Phase-08 |
| 10 | Homepage @375 | FAB overlaps countdown clock; 4th digit clips | MAJOR | Phase-09/10 |

---

## Done Well

- Dicebear fix is implemented correctly — both Google OAuth and dicebear patterns whitelisted; comment explains seed vs prod scenario.
- `HomepageHeader` is well-structured, auth-gated (public vs authenticated states clean), reusable interface — good candidate for lifting to shared shell.
- `BoardScreen` and `ProfileScreen` two-column / narrow-column layouts are correct at desktop 1280.
- `SecretBoxModal` presentational/container split is clean; the modal component itself is correct except the counter layout and missing × propagation.
- `KudoComposeModal` field ordering, backdrop, and max-width are correct; rich-text editor lazy-loading is correct. Missing only the "Danh hiệu" field.
- Awards alternating card layout (`imageLeft` prop) is exactly right.
- `proxy.ts` post-login redirect now goes to `/` — correct.
- `rules-screen` is the most complete screen — high fidelity, responsive, correct layout.

---

**Status:** DONE_WITH_CONCERNS  
**Summary:** 9 screens fully audited. Dicebear fix works but is uncommitted. 4 BLOCKER gaps found: Danh-hiệu missing, Awards @375 padding, Board header absent, Profile header absent. 2 gaps are NEW and not in the existing fix plan: the "Sun* Kudos" IA routing and the Awards missing header.  
**Concerns:** Phase-01 (dicebear whitelist) must be committed before CI/staging deployments or crashes return. The "Sun* Kudos" nav routing to `/kudos` instead of `/board` is a user-experience blocker that no existing phase addresses.
