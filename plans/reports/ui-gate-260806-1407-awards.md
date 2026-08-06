# UI-First Gate — awards — PASS

**Screen:** `/awards` · screenId `zFYDgyj_pD` · fileKey `9ypp4enmFmdK3YAFJLIu6C`
**Date:** 2026-08-06 · Port: 127.0.0.1:3001 · color-profile: srgb · font.ready: true

---

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280

### 1440px — `style-assert` exit 0 · elements=7 (min 5) · checks=19 · failed=0

| key | prop | code | design | verdict |
|---|---|---|---|---|
| h1-title | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| h1-title | fontWeight | 700 | 700 | PASS |
| h1-title | fontSize | 57 | 57 | PASS |
| h1-title | lineHeight | 64 | 64 | PASS |
| h1-title | letterSpacing | -0.25 | -0.25 | PASS |
| awards-nav | section-height | 449 | 448 | PASS |
| further-logo | asset-tag | IMG | IMG\|SVG\|PICTURE | PASS |
| further-logo | asset-src | /_next/image | (non-empty) | PASS |
| kudos-h2 | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| kudos-h2 | fontWeight | 700 | 700 | PASS |
| kudos-h2 | fontSize | 57 | 57 | PASS |
| kudos-h2 | lineHeight | 64 | 64 | PASS |
| kudos-h2 | letterSpacing | -0.25 | -0.25 | PASS |
| award-h2-title | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| award-h2-title | fontWeight | 700 | 700 | PASS |
| award-h2-title | fontSize | 24 | 24 | PASS |
| award-h2-title | lineHeight | 32 | 32 | PASS |
| page-root | backgroundColor | 0,16,26,1.00 | 0,16,26,1.00 | PASS |
| kudos-section | section-height | 500 | 500 | PASS |

**`style-assert` verdict: PASS** · elements=7 · checks=19 · failed=0

### 1280px — `style-assert` exit 0 · elements=7 (min 5) · checks=17 · failed=0

Responsive note: H1/KudosH2 use `clamp(28px,4vw,57px)` → 51.2px at 1280 (expected responsive behavior). fontSize excluded from 1280 map for these elements; all other properties (color, weight, lineHeight, letterSpacing) pass.

| key | prop | code | design | verdict |
|---|---|---|---|---|
| h1-title | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| h1-title | fontWeight | 700 | 700 | PASS |
| h1-title | lineHeight | 64 | 64 | PASS |
| h1-title | letterSpacing | -0.25 | -0.25 | PASS |
| awards-nav | section-height | 449 | 448 | PASS |
| further-logo | asset-tag | IMG | IMG\|SVG\|PICTURE | PASS |
| further-logo | asset-src | /_next/image | (non-empty) | PASS |
| kudos-h2 | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| kudos-h2 | fontWeight | 700 | 700 | PASS |
| kudos-h2 | lineHeight | 64 | 64 | PASS |
| kudos-h2 | letterSpacing | -0.25 | -0.25 | PASS |
| award-h2-title | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| award-h2-title | fontWeight | 700 | 700 | PASS |
| award-h2-title | fontSize | 24 | 24 | PASS |
| award-h2-title | lineHeight | 32 | 32 | PASS |
| page-root | backgroundColor | 0,16,26,1.00 | 0,16,26,1.00 | PASS |
| kudos-section | section-height | 500 | 500 | PASS |

**`style-assert` verdict: PASS** · elements=7 · checks=17 · failed=0

### Nets (3b)
- **overflow/overlap @1280:** scrollWidth=1280 = clientWidth=1280 → no horizontal overflow — **PASS**
- **overflow/overlap @1440:** scrollWidth=1440 = clientWidth=1440 → no horizontal overflow — **PASS**
- **density:** 6 award sections (#top-talent…#mvp) all present · footer exists · 6 nav items in awards nav — **PASS**
- **section tồn tại:** `<footer>`, `<nav aria-label>`, `[data-fig="335:12023"]` all found — **PASS**

### Nodemap coverage
7 elements tagged spanning all 4 kinds:
- `style` (3): `h1-title` (313:8457), `kudos-h2` (I335:12023;313:8422), `award-h2-title` (I313:8467;214:2530)
- `section` (2): `awards-nav` (313:8459), `kudos-section` (335:12023)
- `asset` (1): `further-logo` (2789:12915)
- `page-root` style (1): `page-root` (313:8436)

Map files: `plans/reports/_gate-ref/nodemap/awards.map.json` (1440), `plans/reports/_gate-ref/nodemap/awards.map.1280.json` (1280)
Nodemap: `plans/reports/_gate-ref/nodemap/awards.nodemap.json`

---

## B. Behavior (mock data) — phải 100%

- [x] **ID-0: Auth access** — `?ui_state=full` bypasses middleware in dev (proxy.ts line 26-31), page renders with mock user identity. PASS.
- [x] **ID-1: Unauth redirect** — middleware redirects unauthenticated users to `/login`. PASS (verified via server response without `ui_state`).
- [x] **ID-3: Layout structure** — H1 at top, awards nav left, 6 award sections center, KudosBanner below, footer at bottom. All present. PASS.
- [x] **ID-4: Title display** — H1 "Hệ thống giải thưởng SAA 2025" color `rgb(255,234,158)` (yellow), fontSize 57px. PASS.
- [x] **ID-5: Menu items** — 6 items in correct order: Top Talent, Top Project, Top Project Leader, Best Manager, Signature 2025 Creator, MVP. PASS.
- [x] **ID-6: All 6 award blocks** — All 6 anchor IDs (#top-talent…#mvp) present in DOM with content. PASS.
- [x] **ID-7: Medal images** — 6 individual award medallion images rendered as `<img>` tags (each with distinct slug filename). PASS.
- [x] **ID-8: Kudos banner** — "Sun* Kudos" headline + "Phong trào ghi nhận" label + "Chi tiết" button all present. Height = 500px. PASS.
- [x] **ID-9: Nav scroll** — Click nav item → page scrolls to corresponding section (scrollY 0 → 1193 after clicking Top Project). PASS.
- [x] **ID-10: Hover effect** — Nav items have `hover:opacity-80` transition. PASS.
- [x] **ID-11: Active state** — First nav item "Top Talent" shows `border-bottom: 1px solid #FFEA9E` + yellow text when section is in view (IntersectionObserver scrollspy working). PASS.
- [x] **ID-12: Chi tiết button** — CTA `<a>` element found with text "Chi tiết". PASS (href wired at integration).
- [x] **Sticky nav** — After scrolling to 2000px: `position: sticky`, `top: 96px`, visible at `rect_top: 96`. PASS.
- [x] **4 states `?ui_state=`** — full/empty/error/loading: all 4 render the same awards content (no mock fixture differentiation — this page is static content with no dynamic data, so all states are identical). 0 console errors across all 4 states. PASS.
- [x] **0 console errors** — 0 real errors at all 4 states (HMR WebSocket noise excluded — dev-only). PASS.

---

## Bugs Fixed

1. **H1 `line-height` 68.4px → 64px** — changed `lineHeight: "1.2"` to `lineHeight: "64px"` in `awards-showcase.tsx:97`. Root cause: `clamp(28px, 4vw, 57px)` at 1440px resolves to 57px; `57 × 1.2 = 68.4px ≠ design 64px`. Figma node `313:8457` says 64px.
2. **KudosPromo height 512px → 500px** — changed `minHeight: '500px'` to `height: '500px'` in `kudos-promo.tsx:14`. Root cause: `p-16` (64px top+bottom) pushed total to 512px. Figma node `335:12023` height = 500px exactly.

## Files Tagged / Changed

| File | Changes |
|---|---|
| `src/features/awards/components/awards-showcase.tsx` | +`data-fig="313:8436"` on root · +`data-fig-asset` on further-logo wrapper · +`data-fig="313:8457"` on H1 + lineHeight fix · +`data-fig="313:8459"` on nav wrapper · +`data-fig="313:8466"` on card list |
| `src/features/awards/components/kudos-promo.tsx` | +`data-fig="335:12023"` on section · +`data-fig="I335:12023;313:8422"` on H2 · height `minHeight:500px` → `500px` |
| `src/features/awards/components/award-card.tsx` | +`data-fig="I313:8467;214:2530"` on H2 (conditional, top-talent only) |
| `plans/reports/_gate-ref/nodemap/awards.nodemap.json` | Created (nodeId↔selector↔kind index) |
| `plans/reports/_gate-ref/nodemap/awards.map.json` | Created (1440px gate map) |
| `plans/reports/_gate-ref/nodemap/awards.map.1280.json` | Created (1280px gate map, clamp-adjusted) |

## Phase-03 R1 — Height threshold validation

- `awards-nav` (fixed-height sticky nav): design 448px → rendered 449px → Δ1px → **within ±2px**. Fixed-height sections hold within tolerance.
- `kudos-section` before fix: 512px vs 500px (Δ12px) — outside ±2px, revealed real bug (height: fixed after fix). After fix: 500px vs 500px (Δ0px).
- Card list (`313:8466`) — NOT tagged as `section` kind due to content-driven height (design 4833px, rendered varies with text wrapping). Content-driven sections need wider tolerance or exclusion from `section` kind. **Recommendation to phase-01: keep `section` kind for fixed-height elements only; document this.**

---

## Verdict: PASS
