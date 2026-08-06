# UI-First Gate — Phase 09: rules / notifications-dropdown / notifications-page

**Date:** 2026-08-06 · **Port:** 127.0.0.1:3001 · **color-profile:** srgb · **font.ready:** Montserrat 700 = true

---

## 1. Screen: `rules` (Thể lệ modal)

**MoMorph:** `b1Filzi9i6` · root node `3204:6051` · route `/rules?ui_state=full`
**Gate region:** Modal panel (`3204:6052`) — NOT the 1440×1796 artboard canvas.

### A. Property-diff (CỔNG CỨNG) — 1440 + 1280

**`style-assert` verdict: PASS** · elements=6 · checks=28 · failed=0

All nodeIds verified via `get_node(screenId=b1Filzi9i6, nodeId=...)` this session.

| key | prop | code | design | verdict |
|---|---|---|---|---|
| rules-panel-container (3204:6052) | backgroundColor | 0,7,12,1.00 | 0,7,12,1.00 | PASS |
| rules-panel-container | paddingTop | 24px | 24px | PASS |
| rules-panel-container | paddingLeft | 40px | 40px | PASS |
| rules-panel-container | paddingBottom | 40px | 40px | PASS |
| rules-panel-container | width | 553px | 553px | PASS |
| rules-title (3204:6055) | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| rules-title | fontWeight | 700 | 700 | PASS |
| rules-title | fontSize | 45px | 45px | PASS |
| rules-title | lineHeight | 52px | 52px | PASS |
| rules-recipient-heading (3204:6132) | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| rules-recipient-heading | fontWeight | 700 | 700 | PASS |
| rules-recipient-heading | fontSize | 22px | 22px | PASS |
| rules-recipient-heading | lineHeight | 28px | 28px | PASS |
| rules-sender-heading (3204:6077) | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| rules-sender-heading | fontWeight | 700 | 700 | PASS |
| rules-sender-heading | fontSize | 22px | 22px | PASS |
| rules-sender-heading | lineHeight | 28px | 28px | PASS |
| rules-close-btn (3204:6093) | backgroundColor | 255,234,158,0.10 | 255,234,158,0.10 | PASS |
| rules-close-btn | borderTopLeftRadius | 4px | 4px | PASS |
| rules-close-btn | borderTopWidth | 1px | 1px | PASS |
| rules-close-btn | borderTopColor | rgb(153,140,95) | rgb(153,140,95) | PASS |
| rules-close-btn | height | 56px | 56px | PASS |
| rules-close-btn | width | 94px | 94px | PASS |
| rules-write-kudos-btn (3204:6094) | backgroundColor | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| rules-write-kudos-btn | borderTopLeftRadius | 4px | 4px | PASS |
| rules-write-kudos-btn | height | 56px | 56px | PASS |
| rules-write-kudos-btn | width | 363px | 363px | PASS |
| rules-write-kudos-btn | color | 0,16,26,1.00 | 0,16,26,1.00 | PASS |

**@1280:** Identical computed values — exit 0. No overflow. `scrollWidth === clientWidth === 1280`.

**Nets (3b):** overflow @1280 = none · no element clipping observed · panel 553px stays fixed, does not reflow.

**Pixel/band overlay (3c, tham khảo):** not run — property-diff is the hard gate.

### B. Behavior (mock data) — phải 100%

- [x] **Panel renders correctly:** `[data-fig='3204:6052']` offsetHeight > 100, title = "Thể lệ"
- [x] **Content sections:** Recipient heading present (`3204:6132`) + Sender heading present (`3204:6077`)
- [x] **Close button:** "Đóng" button (`3204:6093`) found with correct label
- [x] **Write KUDOS button:** "Viết KUDOS" button (`3204:6094`) found with correct label
- [x] **Backdrop present:** `data-testid="rules-backdrop"` found — Esc + backdrop-click handlers registered
- [x] **ui_state toggle:** Rules is static content — `?ui_state=` used only to bypass auth middleware, not to switch data states. No empty/error/loading variants exist for this screen. This is correct by design.
- [x] **No horizontal overflow @1440:** `scrollWidth <= clientWidth`
- [x] **No horizontal overflow @1280:** `scrollWidth <= clientWidth`
- [x] **Console errors:** 0 app errors. 1 HMR WebSocket error (`ws://.../_next/webpack-hmr`) — dev-tooling artifact in headless Playwright, not an app error. Present on all routes regardless of content.

### Verdict: **PASS**

**nodeId ↔ selector map:**
| nodeId | selector | element |
|---|---|---|
| `3204:6052` | `[data-fig='3204:6052']` | Panel container |
| `3204:6055` | `[data-fig='3204:6055']` | Title "Thể lệ" |
| `3204:6132` | `[data-fig='3204:6132']` | Recipient section heading |
| `3204:6077` | `[data-fig='3204:6077']` | Sender section heading |
| `3204:6093` | `[data-fig='3204:6093']` | Close button |
| `3204:6094` | `[data-fig='3204:6094']` | Write KUDOS button |

**style-assert exit @1440:** 0 · **style-assert exit @1280:** 0

---

## 2. Screen: `notifications-dropdown` (View thông báo)

**MoMorph:** `gWBVcaSVIf` · frame node `589:9152` · route `/notifications/panel?ui_state=`
**Gate region:** Panel component — rendered via `/notifications/panel` standalone preview page (within `src/app/notifications/**` scope).

### A. Property-diff (CỔNG CỨNG) — BLOCKED (HELD)

**`style-assert` verdict: BLOCKED (exit 2)** — design values not available from `get_node`.

**Root cause:** MoMorph returns `"Frame metadata does not contain node style information"` for all `get_node`, `get_frame_node_tree`, `get_overview`, `query_section` calls on `screenId=gWBVcaSVIf`. The frame was registered with `figma_node_id=589:9152` but the Figma→MoMorph node sync has not run for this frame (`design_status: in_progress`, `spec_status: none`, no revision).

**Anti-fake-pass compliance:** Design values were NOT copied from code. Map explicitly marks `design._held = true`. Exit 2 is the correct result.

**What IS verified by inspection:**
- Panel renders at `width=360px`, `maxHeight=480px`, `borderRadius=12px`
- Background `rgb(10,25,41)` matches `#0A1929` from spec design_items description
- Border `1px solid rgba(255,255,255,0.12)` confirmed by computed style
- No horizontal overflow at 1440 or 1280

**HELD pending:** MoMorph node sync for `gWBVcaSVIf`. Once metadata is available, run `get_node` for panel container, header text, mark-all-read button, and footer "Xem tất cả" button to complete property-diff.

### B. Behavior (mock data) — phải 100%

Tested via `/notifications/panel?ui_state=full|empty|error|loading`. New file: `src/features/notifications/notification-panel-preview.tsx` + `src/app/notifications/panel/page.tsx`.

- [x] **?ui_state=full:** Panel present, header "Thông báo", 12 notification items, "Xem tất cả" footer, "Đánh dấu tất cả đã đọc" action
- [x] **?ui_state=empty:** Panel present, 0 items, 🔔 + "Chưa có thông báo nào" empty state renders
- [x] **?ui_state=error:** Panel present, 0 items (error = empty list per mock fixture)
- [x] **?ui_state=loading:** Panel present, spinner renders (`animate-spin`)
- [x] **"Xem tất cả" button navigates to /notifications** (handler registered, no-op in gate mode)
- [x] **"Đánh dấu tất cả đã đọc" button present** (handler registered, no-op in gate mode)
- [x] **No horizontal overflow @1440:** ok
- [x] **No horizontal overflow @1280:** ok
- [x] **Console errors:** 0 app errors. 1 HMR WebSocket dev artifact (same as all routes).

### Verdict: **BLOCKED** (property-diff HELD — MoMorph has no node metadata for gWBVcaSVIf)

Behavior group B: **PASS** (all 4 states verified).
Unblock path: MoMorph node sync for `gWBVcaSVIf` → run `get_node` → rebuild map → re-run `style-assert`.

**nodeId ↔ selector map:**
| nodeId | selector | element | status |
|---|---|---|---|
| `589:9152` | `[data-fig='589:9152']` | Panel container | real Figma nodeId |
| `589:9152-title` | `[data-fig='589:9152-title']` | "Thông báo" header | HELD slug |
| `589:9152-mark-all` | `[data-fig='589:9152-mark-all']` | Mark-all-read button | HELD slug |
| `589:9152-view-all` | `[data-fig='589:9152-view-all']` | "Xem tất cả" footer | HELD slug |

**style-assert exit @1440:** 2 (BLOCKED) · **style-assert exit @1280:** 2 (BLOCKED)

---

## 3. Screen: `notifications-page` (Tất cả thông báo)

**MoMorph:** `6-1LRz3vqr` · frame node `589:9132` · route `/notifications?ui_state=`
**Gate region:** Full page.

### A. Property-diff (CỔNG CỨNG) — BLOCKED (HELD)

**`style-assert` verdict: BLOCKED (exit 2)** — design values not available from `get_node`.

**Root cause:** Same as notifications-dropdown — MoMorph returns no node metadata for `6-1LRz3vqr` (`design_status: in_progress`, `spec_status: none`). Figma node `589:9132` is confirmed as real nodeId from clarifications.md but `get_node` returns `"Frame metadata does not contain node style information"`.

**Anti-fake-pass compliance:** Design values were NOT copied from code. Map marks `design._held = true`. Exit 2 is correct.

**What IS verified by inspection:**
- Page root bg `rgb(0,16,26)` = `#00101A` ✓
- Heading "Tất cả thông báo" present, color white, font-weight 700, fontSize 24px
- 12 notification rows render in full state
- No horizontal overflow at 1440 or 1280

**HELD pending:** MoMorph node sync for `6-1LRz3vqr`. Key nodes to measure: page root bg, heading style, notification row item style (border, bg, text colors).

### B. Behavior (mock data) — phải 100%

- [x] **?ui_state=full:** page root present, heading "Tất cả thông báo", 12 notification rows, no overflow
- [x] **?ui_state=empty:** 0 rows, 🔔 + "Chưa có thông báo nào" renders (`body.innerText` confirmed)
- [x] **?ui_state=error:** 0 rows (error fixture = empty list + toast; toast is visual-only, not layout-breaking)
- [x] **?ui_state=loading:** loading skeleton renders (`animate-pulse` elements present, `aria-hidden="true"` container)
- [x] **Heading visible:** "Tất cả thông báo" present in all states
- [x] **"Đánh dấu đọc tất cả" button:** only shown when `hasUnread=true` (full state has unread items)
- [x] **No horizontal overflow @1440:** ok
- [x] **No horizontal overflow @1280:** ok
- [x] **Console errors:** 0 app errors. 1 HMR WebSocket dev artifact only.

### Verdict: **BLOCKED** (property-diff HELD — MoMorph has no node metadata for 6-1LRz3vqr)

Behavior group B: **PASS** (all 4 states verified).
Unblock path: MoMorph node sync for `6-1LRz3vqr` → run `get_node` → rebuild map → re-run `style-assert`.

**nodeId ↔ selector map:**
| nodeId | selector | element | status |
|---|---|---|---|
| `589:9132` | `[data-fig='589:9132']` | Page root div | real Figma nodeId |
| `589:9132-heading` | `[data-fig='589:9132-heading']` | "Tất cả thông báo" h1 | HELD slug |

**style-assert exit @1440:** 2 (BLOCKED) · **style-assert exit @1280:** 2 (BLOCKED)

---

## Summary

| Screen | style-assert @1440 | style-assert @1280 | Behavior B | Verdict |
|---|---|---|---|---|
| `rules` | exit 0 — PASS | exit 0 — PASS | PASS | **PASS** |
| `notifications-dropdown` | exit 2 — BLOCKED (HELD) | exit 2 — BLOCKED (HELD) | PASS | **BLOCKED** |
| `notifications-page` | exit 2 — BLOCKED (HELD) | exit 2 — BLOCKED (HELD) | PASS | **BLOCKED** |

**Rules: PASS → cleared for integration.**
**Both notification screens: BLOCKED on property-diff** — MoMorph node metadata not yet synced for `gWBVcaSVIf` and `6-1LRz3vqr`. Behavior (group B) passes on both. Unblock by triggering MoMorph node sync then re-running gate.
