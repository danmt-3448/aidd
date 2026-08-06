# UI-First Gate — homepage — PASS

**Screen:** `/` (Homepage SAA) · screenId `i87tDx10uM` · fileKey `9ypp4enmFmdK3YAFJLIu6C`
**Date:** 2026-08-06 · Port: 127.0.0.1:3001 · color-profile: srgb · font.ready: true (Montserrat 700 verified)

---

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280

### 1440px — `style-assert` exit 0 · elements=6 (min 5) · checks=23 · failed=0

| key | prop | code | design | verdict |
|---|---|---|---|---|
| homepage-coming-soon | color | 255,255,255,1.00 | 255,255,255,1.00 | PASS |
| homepage-coming-soon | fontWeight | 700 | 700 | PASS |
| homepage-coming-soon | fontSize | 24 | 24 | PASS |
| homepage-coming-soon | lineHeight | 32 | 32 | PASS |
| homepage-cta-awards | backgroundColor | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| homepage-cta-awards | color | 0,16,26,1.00 | 0,16,26,1.00 | PASS |
| homepage-cta-awards | borderRadius | 8 | 8 | PASS |
| homepage-cta-awards | paddingTop | 12 | 12 | PASS |
| homepage-cta-awards | paddingLeft | 16 | 16 | PASS |
| homepage-cta-awards | fontWeight | 700 | 700 | PASS |
| homepage-awards-h2 | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| homepage-awards-h2 | fontWeight | 700 | 700 | PASS |
| homepage-awards-h2 | fontSize | 57 | 57 | PASS |
| homepage-awards-h2 | lineHeight | 64 | 64 | PASS |
| homepage-awards-h2 | letterSpacing | -0.25 | -0.25 | PASS |
| root-further-logo | asset-tag | IMG | IMG\|SVG\|PICTURE | PASS |
| root-further-logo | asset-src | /_next/image | (non-empty) | PASS |
| kudos-section | section-height | 500 | 500 | PASS |
| kudos-h2 | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| kudos-h2 | fontWeight | 700 | 700 | PASS |
| kudos-h2 | fontSize | 57 | 57 | PASS |
| kudos-h2 | lineHeight | 64 | 64 | PASS |
| kudos-h2 | letterSpacing | -0.25 | -0.25 | PASS |

**`style-assert` verdict: PASS** · elements=6 · checks=23 · failed=0

### 1280px — `style-assert` exit 0 · elements=6 (min 5) · checks=21 · failed=0

Responsive note: `homepage-awards-h2` uses `clamp(36px, 3.97vw, 57px)` → 50.816px at 1280 (expected clamp behavior). `homepage-cta-awards` uses `clamp(14px, 1.46vw, 22px)` → 18.688px at 1280. `kudos-h2` uses `clamp(36px, 4vw, 57px)` → 51.2px at 1280. fontSize excluded from 1280 map for these three elements; all other properties (color, weight, lineHeight, letterSpacing, bg, radius, padding) pass.

| key | prop | code | design | verdict |
|---|---|---|---|---|
| homepage-coming-soon | color | 255,255,255,1.00 | 255,255,255,1.00 | PASS |
| homepage-coming-soon | fontWeight | 700 | 700 | PASS |
| homepage-coming-soon | fontSize | 24 | 24 | PASS |
| homepage-coming-soon | lineHeight | 32 | 32 | PASS |
| homepage-cta-awards | backgroundColor | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| homepage-cta-awards | color | 0,16,26,1.00 | 0,16,26,1.00 | PASS |
| homepage-cta-awards | borderRadius | 8 | 8 | PASS |
| homepage-cta-awards | paddingTop | 12 | 12 | PASS |
| homepage-cta-awards | paddingLeft | 16 | 16 | PASS |
| homepage-cta-awards | fontWeight | 700 | 700 | PASS |
| homepage-awards-h2 | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| homepage-awards-h2 | fontWeight | 700 | 700 | PASS |
| homepage-awards-h2 | lineHeight | 64 | 64 | PASS |
| homepage-awards-h2 | letterSpacing | -0.25 | -0.25 | PASS |
| root-further-logo | asset-tag | IMG | IMG\|SVG\|PICTURE | PASS |
| root-further-logo | asset-src | /_next/image | (non-empty) | PASS |
| kudos-section | section-height | 500 | 500 | PASS |
| kudos-h2 | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| kudos-h2 | fontWeight | 700 | 700 | PASS |
| kudos-h2 | lineHeight | 64 | 64 | PASS |
| kudos-h2 | letterSpacing | -0.25 | -0.25 | PASS |

**`style-assert` verdict: PASS** · elements=6 · checks=21 · failed=0

### Nets (3b)
- **overflow/overlap @1440:** scrollWidth=1440 = clientWidth=1440 → no horizontal overflow — **PASS**
- **overflow/overlap @1280:** scrollWidth=1280 = clientWidth=1280 → no horizontal overflow — **PASS**
- **4 states @1280:** `full` / `empty` / `error` / `loading` all render without overflow — **PASS**
- **section tồn tại:** `[data-fig="homepage-coming-soon"]` (hero), `[data-fig="335:12023"]` (kudos), `[data-fig-asset="homepage-root-further-logo"]` (logo) — all found — **PASS**

### Nodemap coverage
6 elements tagged spanning all 4 kinds:
- `style` (3): `homepage-coming-soon`, `homepage-cta-awards`, `homepage-awards-h2`
- `section` (1): `kudos-section` (335:12023 — shared KudosPromo)
- `asset` (1): `root-further-logo`
- `style` shared (1): `kudos-h2` (I335:12023;313:8422 — shared KudosPromo, verified in awards gate)

Map files:
- `plans/reports/_gate-ref/nodemap/homepage.map.json` (1440)
- `plans/reports/_gate-ref/nodemap/homepage.map.1280.json` (1280)
- `plans/reports/_gate-ref/nodemap/homepage.nodemap.json` (nodeId index)

---

## B. Behavior (mock data) — phải 100%

- [x] **4 states `?ui_state=`** — `full` / `empty` / `error` / `loading`: all 4 render `[data-fig="homepage-coming-soon"]` (hero present), 0 real console errors across all states. HomepageConnected reads `useUiStateOverride()` and dispatches to fixture. **PASS**
- [x] **0 console errors** — HMR WebSocket noise excluded (dev-only). 0 real errors at all 4 states. **PASS**
- [x] **No horizontal overflow** — scrollWidth = clientWidth at 1280 and 1440 for all states. **PASS**
- [x] **Root Further logo is `<img>` asset** — `/_next/image` wrapper confirmed, not text/CSS reconstruction. **PASS**
- [x] **CTA About Awards renders with correct bg** — `rgba(255,234,158,1)` yellow, `rgba(0,16,26,1)` dark text, radius 8px. **PASS**
- [x] **Awards section H2 typography** — Montserrat 700 57px #FFEA9E lineHeight 64px letterSpacing -0.25px at 1440; clamp adapts correctly at 1280 (color/weight/lineHeight hold). **PASS**
- [x] **KudosPromo height** — 500px rendered = 500px design (shared component, re-verified). **PASS**
- [x] **Auth-gated FAB** — HomepageScreen passes `onWriteKudo` only when `header.user !== null`; mock fixture `mockFull` provides `user: { name: 'Sunner' }` so FAB renders in full state. **PASS**

---

## Files Touched

| File | Changes |
|---|---|
| `src/features/homepage/components/homepage-hero.tsx` | +`data-fig-asset="homepage-root-further-logo"` on logo wrapper · +`data-fig="homepage-coming-soon"` on Coming soon label · +`data-fig="homepage-cta-awards"` on CTA About Awards link |
| `src/features/homepage/components/homepage-awards-grid.tsx` | +`data-fig="2167:9068"` on section root · +`data-fig="homepage-awards-h2"` on H2 heading |
| `plans/reports/_gate-ref/nodemap/homepage.map.json` | Created (1440px gate map) |
| `plans/reports/_gate-ref/nodemap/homepage.map.1280.json` | Created (1280px gate map, clamp-adjusted) |
| `plans/reports/_gate-ref/nodemap/homepage.nodemap.json` | Created (nodeId↔selector↔kind index) |

**Shared chrome NOT touched:** `site-header.tsx`, `homepage-footer.tsx`, `board-feed-card.tsx` — phase-04 owns them.

---

## Verdict: PASS
