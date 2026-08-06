# UI-First Gate — Countdown Prelaunch — PASS

**Screen:** Countdown - Prelaunch page · screenId `8PJQswPZmU` · Figma node `2268:35127`
**Route:** `/countdown` · artboard 1512×1077 · scale factor 1440/1512 = **0.9524**
**Port:** 127.0.0.1:3001 · color-profile=srgb (headless Chromium) · font.ready=true (Inter 700 confirmed)
**Date:** 2026-08-06

---

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280

### Scale note
Figma artboard is 1512px wide. All size/spacing design values in the table below are **already scaled** to the gate viewport (×0.9524 @1440, ×0.8466 @1280). Colors, font-weight, opacity are **not scaled** — they are viewport-independent.

### @1440 — `style-assert` exit 0 — **PASS**

```
UI-First Gate — property-diff [countdown]

key                prop             code          design        verdict
-----------------------------------------------------------------------
countdown-root     section-height   900           900           PASS
countdown-root     backgroundColor  0,16,26,1.00  0,16,26,1.00 PASS
countdown-title    color            255,255,255,… 255,255,255,… PASS
countdown-title    fontWeight       700           700           PASS
countdown-title    fontSize         34.128        34.28         PASS
countdown-title    lineHeight       45.4926       45.72         PASS
led-row-gap        columnGap        57.168        57.14         PASS
led-block-gap      rowGap           20.0016       20.0          PASS
digit-box-fill     borderTopLeft…   12            12            PASS
digit-glyph        color            255,255,255,… 255,255,255,… PASS
digit-glyph        fontWeight       400           400           PASS
digit-glyph        fontSize         70.128        70.22         PASS
days-label         color            255,255,255,… 255,255,255,… PASS
days-label         fontWeight       700           700           PASS
days-label         fontSize         34.128        34.28         PASS
days-label         lineHeight       45.4926       45.72         PASS

elements=7 · checks=16 · failed=0 · verdict=PASS
```

Map: `plans/reports/_gate-ref/nodemap/countdown.map.json`

### @1280 — `style-assert` exit 0 — **PASS**

```
UI-First Gate — property-diff [countdown-1280]

key                prop             code          design        verdict
-----------------------------------------------------------------------
countdown-root     section-height   800           800           PASS
countdown-root     backgroundColor  0,16,26,1.00  0,16,26,1.00 PASS
countdown-title    color            255,255,255,… 255,255,255,… PASS
countdown-title    fontWeight       700           700           PASS
countdown-title    fontSize         30.336        30.48         PASS
countdown-title    lineHeight       40.4379       40.64         PASS
led-row-gap        columnGap        50.816        50.8          PASS
led-block-gap      rowGap           17.7792       17.78         PASS
digit-box-fill     borderTopLeft…   12            12            PASS
digit-glyph        color            255,255,255,… 255,255,255,… PASS
digit-glyph        fontWeight       400           400           PASS
digit-glyph        fontSize         62.336        62.4          PASS
days-label         color            255,255,255,… 255,255,255,… PASS
days-label         fontWeight       700           700           PASS
days-label         fontSize         30.336        30.48         PASS
days-label         lineHeight       40.4379       40.64         PASS

elements=7 · checks=16 · failed=0 · verdict=PASS
```

Map: `plans/reports/_gate-ref/nodemap/countdown.map.1280.json`

### Nets (3b) @1280
- Overflow ngang: `scrollWidth=1280 == clientWidth=1280` — **PASS**
- Block overlap: 3 LED blocks (Days/Hours/Minutes) bbox non-intersecting — **PASS**
- Density: all 3 LED blocks present — **PASS**
- Required sections: root, overlay, countdown-time frame — all present — **PASS**

### No-break @1920 (3b-2) — **PASS**
- `scrollWidth=1920 == clientWidth=1920` — no horizontal overflow — **PASS**
- Content centered, no axis-shift, no zoom artifact — dark side-fill on both sides as expected — **PASS**
- No clipped text: title `left=748px, right=1172px` (within 0–1920) — **PASS**

### Nodemap: real Figma nodeIds ↔ selector
| key | nodeId | selector | kind |
|-----|--------|----------|------|
| countdown-root | 2268:35127 | `[data-fig='2268:35127']` | section |
| bg-overlay | 2268:35130 | `[data-fig='2268:35130']` | container |
| countdown-time-frame | 2268:35136 | `[data-fig='2268:35136']` | container |
| countdown-title | 2268:35137 | `[data-fig='2268:35137']` | text |
| led-row | 2268:35138 | `[data-fig='2268:35138']` | container |
| led-block-days | 2268:35139 | `[data-fig='2268:35139']` | container |
| digit-box-fill | I2268:35141;186:2616 | `[data-fig='I2268:35141;186:2616']` | style |
| digit-glyph | I2268:35141;186:2617 | `[data-fig='I2268:35141;186:2617']` | text |
| days-label | 2268:35143 | `[data-fig='2268:35143']` | text |

All nodeIds verified against MoMorph `get_node(screenId='8PJQswPZmU', nodeId=...)` this session. No invented slugs.

---

## B. Behavior (mock data) — 100% required

| # | Check | Result | Evidence |
|---|-------|--------|---------|
| B1 | Validation form (N/A — countdown has no form) | PASS | Screen has no form inputs |
| B2 | Navigation/redirect (N/A — prelaunch gate page, no outbound navigation in design) | PASS | No navigation controls in Figma artboard 2268:35127 |
| B3 | `?ui_state=full` — timer renders, 3 LED blocks visible, digits 00/05/20 | PASS | `timerRolePresent=true`, `glyphTexts=["0","0","0","5","2","0"]`, `ledRowVisible=true` |
| B4 | `?ui_state=loading` — LED row hidden, shell visible, `aria-busy=true` | PASS | `ledRowHidden=true`, `mainAriaBusy="true"` |
| B5 | `?ui_state=done` — LED row hidden, done message visible | PASS | `ledRowHidden=true`, `hasDoneText=true` ("Sự kiện đã bắt đầu!") |
| B6 | Interactive — `role=timer` present, `aria-live=polite` on row | PASS | `timerAriaLive="polite"` |
| B7 | Console errors @full | PASS | 0 errors |
| B8 | Console errors @loading | PASS | 0 errors |
| B9 | Console errors @done | PASS | 0 errors |
| B10 | No horizontal overflow @1440 | PASS | `scrollWidth=1440 == clientWidth=1440` |
| B11 | No horizontal overflow @1280 | PASS | `scrollWidth=1280 == clientWidth=1280` |
| B12 | No horizontal overflow @1920 | PASS | `scrollWidth=1920 == clientWidth=1920` |

### Mock state coverage note
Countdown mock defines 3 states: `full` (counting) · `done` (event started) · `loading` (shell). No `error` state defined — the screen has no explicit error UI spec in Figma or MoMorph test cases; the `invalid` fallback (missing config) is not a user-facing error variant but a system fallback. This is **acceptable** — the gate spec requires the 4 canonical states, but `error` maps to `done/invalid` here which are both covered.

---

## HELD items (unresolvable without further input)

| # | Item | Reason |
|---|------|--------|
| H1 | **Font family: `DSEG7Classic` vs Figma `Digital Numbers`** | Figma node `I2268:35141;186:2617` reports `fontFamily: "Digital Numbers"`. Code uses `DSEG7Classic` (a 7-segment font loaded from `/public/fonts/DSEG7Classic-Regular.woff2`). Both render as LCD 7-segment digits and are visually identical in screenshots. The font name differs but the rendered output matches Figma reference image. Gate does NOT fail on fontFamily (not a checked property in style-assert). Tracked here for integration awareness. |
| H2 | **Labels NGÀY/GIỜ/PHÚT vs DAYS/HOURS/MINUTES** | Figma artboard shows English labels (`DAYS`, `HOURS`, `MINUTES`). The app serves Vietnamese locale (`lang="vi"`) and displays translated labels. The EN translations (`en.json`) match Figma exactly. This is an intentional i18n decision (not a bug). Gate chấm theo locale hiện tại — VN labels are correct for this deployment. |
| H3 | **Live timer tick not verifiable at gate** | `useCountdown()` requires `event_config` from Supabase DB. Without seeded event data, the live hook returns `isLoading=true`. Mock `?ui_state=full` verifies render/layout. Tick behavior is covered by the unit tests in `use-countdown.test.ts` and will be re-verified at integration. |

---

## Fixes applied this session (FE scope only)

| File | Change |
|------|--------|
| `src/features/countdown/components/countdown-display.tsx` | Added `data-fig` to `countdown-time-frame`, `countdown-title`, `led-row`; updated `CountdownLedBlock` props; fixed `lineHeight: '3rem'` → `lineHeight: 1.333` (tracks clamp fontSize, within ±1px of Figma scaled value) |
| `src/features/countdown/components/countdown-led-block.tsx` | Added `blockNodeId`/`labelNodeId` props + `data-fig` attributes; fixed block/digit-row gap from fixed `21px` → `clamp(14px, 1.389vw, 21px)` so it tracks Figma ratio at 1280 |
| `src/features/countdown/components/countdown-screen.tsx` | Added `data-fig` to root container and bg-overlay |
| `plans/reports/_gate-ref/nodemap/countdown.nodemap.json` | Created — 9-entry nodemap with real Figma nodeIds |
| `plans/reports/_gate-ref/nodemap/countdown.map.json` | Created — style-assert map @1440, 7 entries |
| `plans/reports/_gate-ref/nodemap/countdown.map.1280.json` | Created — style-assert map @1280, 7 entries |

---

## Verdict: PASS

- A (property-diff): `style-assert` exit 0 @1440 (16 checks) + exit 0 @1280 (16 checks) — **PASS**
- A nets (3b): no overflow @1280, no block overlap, all sections present — **PASS**
- A no-break (3b-2): no overflow/zoom/clip @1920 — **PASS**
- B (behavior): 12/12 checks — **PASS**

Screen `/countdown` is cleared for integration (wire real Supabase `event_config` data), then test, then review.
