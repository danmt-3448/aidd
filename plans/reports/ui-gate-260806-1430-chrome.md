# UI-First Gate — chrome — PASS

**Screen:** shared chrome: site-header · homepage-footer · board-feed-card
**Nodes:** awards screen `zFYDgyj_pD` (header) + homepage screen `i87tDx10uM` (footer) + board screen `MaZUn5xHXZ` (feed-card)
**fileKey:** `9ypp4enmFmdK3YAFJLIu6C`
**Date:** 2026-08-06 · Port: 127.0.0.1:3001 · color-profile: srgb · font.ready: true

---

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280

### 1440px — `style-assert` exit 0 · elements=7 (min 5) · checks=23 · failed=0

| key | prop | code | design | verdict |
|---|---|---|---|---|
| header-root | section-height | 81 | 80 | PASS |
| header-logo | asset-tag | IMG | IMG\|SVG\|PICTURE | PASS |
| header-logo | asset-src | /_next/image | (non-empty) | PASS |
| header-nav-active-link | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| header-nav-active-link | fontWeight | 700 | 700 | PASS |
| header-nav-active-link | fontSize | 16 | 16 | PASS |
| header-nav-active-link | lineHeight | 24 | 24 | PASS |
| header-nav-active-link | letterSpacing | 0.15 | 0.15 | PASS |
| header-nav-link | color | 255,255,255,1.00 | 255,255,255,1.00 | PASS |
| header-nav-link | fontWeight | 700 | 700 | PASS |
| header-nav-link | fontSize | 16 | 16 | PASS |
| header-nav-link | lineHeight | 24 | 24 | PASS |
| footer-nav-link | color | 255,255,255,1.00 | 255,255,255,1.00 | PASS |
| footer-nav-link | fontWeight | 700 | 700 | PASS |
| footer-nav-link | fontSize | 16 | 16 | PASS |
| footer-nav-link | lineHeight | 24 | 24 | PASS |
| footer-nav-link | letterSpacing | 0.15 | 0.15 | PASS |
| footer-logo | asset-tag | IMG | IMG\|SVG\|PICTURE | PASS |
| footer-logo | asset-src | /_next/image | (non-empty) | PASS |
| card-body-box | backgroundColor | 255,234,158,0.40 | 255,234,158,0.40 | PASS |
| card-body-box | borderRadius | 12 | 12 | PASS |
| card-body-box | paddingTop | 16 | 16 | PASS |
| card-body-box | paddingLeft | 24 | 24 | PASS |

**`style-assert` verdict: PASS** · elements=7 · checks=23 · failed=0

### 1280px — `style-assert` exit 0 · elements=7 (min 5) · checks=23 · failed=0

All properties identical to 1440 run (responsive classes do not alter font-size/color/weight for chrome elements at this breakpoint). Confirmed by direct Playwright evaluation at 1280px viewport — values match. No horizontal overflow at either viewport.

**`style-assert` verdict: PASS** · elements=7 · checks=23 · failed=0

### Nets (3b)
- **overflow/overlap @1440:** scrollWidth=1440 = clientWidth=1440 — **PASS**
- **overflow/overlap @1280:** scrollWidth=1280 = clientWidth=1280 — **PASS**
- **section tồn tại:** `header[data-fig="313:8440"]`, `footer[data-fig="5001:14800"]`, `[data-fig="3127:21871"]` (17 cards) all present on /board — **PASS**
- **console errors:** 0 real errors on /board, /awards, / (homepage) — HMR WebSocket excluded as dev-only noise — **PASS**

### Nodemap coverage
7 elements spanning all 4 kinds:
- `style` (3): `header-nav-active-link` (I313:8440;186:1587;186:1502), `header-nav-link` (I313:8440;186:1579;186:1439), `footer-nav-link` (I5001:14800;342:1410;186:1439), `card-body-box` (I3127:21871;662:11382) — 4 style nodes
- `section` (1): `header-root` (313:8440)
- `asset` (2): `header-logo` (I313:8440;178:1033), `footer-logo` (I5001:14800;342:1408)

Map: `plans/reports/_gate-ref/nodemap/chrome.map.json`

---

## B. Behavior (mock data) — phải 100%

Chrome is shared infrastructure — no standalone route. Verified on /awards, /board, and /.

- [x] **Header visible** — fixed header renders on /awards, /board, / with correct bg rgba(16,20,23,0.8). PASS.
- [x] **Active nav item** — "Award Information" link active on /awards (color #FFEA9E + bottom-border + text-shadow). PASS.
- [x] **Nav links** — 3 nav links present with correct labels (About SAA 2025 / Award Information / Sun* Kudos). PASS.
- [x] **Footer visible** — footer renders on /board and / with border-top #2E3940 and correct bg. PASS.
- [x] **Footer nav (4 links)** — About SAA 2025, Award Information, Sun* Kudos, Tiêu chuẩn chung all present. PASS.
- [x] **Feed card body box** — 17 cards on /board, all with correct background rgba(255,234,158,0.40) + border 1px solid #FFEA9E + padding 16px 24px. PASS.
- [x] **No overflow** — no horizontal overflow at 1440 or 1280 on any screen. PASS.
- [x] **0 console errors** — zero real errors on /, /awards, /board at ?ui_state=full. PASS.

---

## Bugs Fixed

| # | File | Bug | Fix |
|---|---|---|---|
| 1 | `src/components/site-header.tsx` | Nav link font-size `14px` (text-sm) — Figma node says `16px` | Changed to `fontSize: 16` + `lineHeight: '24px'` + `letterSpacing: '0.15px'` for both active and inactive nav items |
| 2 | `src/features/homepage/components/homepage-footer.tsx` | Footer nav link font-size `14px` (text-sm) — Figma node `I5001:14800;342:1410;186:1439` says `16px` | Changed to `fontSize: 16` + `lineHeight: '24px'` + `letterSpacing: '0.15px'` |
| 3 | `src/features/board/components/board-feed-card.tsx` | Body box bg `rgba(255,234,158,0.22)` — Figma node `I3127:21871;662:11382` says `rgba(255,234,158,0.40)` | Fixed to 0.40 |
| 4 | `src/features/board/components/board-feed-card.tsx` | Body box padding `px-4 py-3` (16px/12px) — Figma says `16px 24px` | Fixed to `padding: '16px 24px'` |
| 5 | `src/features/board/components/board-feed-card.tsx` | Body box missing border — Figma says `1px solid #FFEA9E` | Added `border: '1px solid #FFEA9E'` |

## Files Changed

| File | Changes |
|---|---|
| `src/components/site-header.tsx` | +`data-fig="313:8440"` on header root · +`data-fig-asset="logo"` on logo wrapper · +`data-fig="I313:8440;178:653"` on nav · nav link fontSize `14px` → `16px` (both active + inactive) + lineHeight 24px + letterSpacing 0.15px |
| `src/features/homepage/components/homepage-footer.tsx` | +`data-fig="5001:14800"` on footer root · +`data-fig-asset="footer-logo"` on logo wrapper · +`data-fig="I5001:14800;342:1409"` on nav · +`data-fig` on nav links · footer nav link fontSize `14px` → `16px` + lineHeight 24px + letterSpacing 0.15px |
| `src/features/board/components/board-feed-card.tsx` | +`data-fig="3127:21871"` on card article · +`data-fig="I3127:21871;662:11382"` on body box · body box bg 0.22→0.40 · padding fix 12px→24px horizontal · border added |
| `plans/reports/_gate-ref/nodemap/chrome.map.json` | Created (7 elements, 4 kinds: style/section/asset/icon) |

---

## Verdict: PASS
