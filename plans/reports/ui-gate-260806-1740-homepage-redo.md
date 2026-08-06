# UI-First Gate — homepage — PASS

**Date:** 2026-08-06 · **Run:** phase-05 redo (anti-fake-pass)
**Route:** `http://127.0.0.1:3001/?ui_state=full` · **Port verified:** 127.0.0.1:3001
**color-profile:** `--force-color-profile=srgb` · **font.ready:** true (Montserrat 700 confirmed)

---

## Context: why this is a redo

The previous gate pass used **invented nodeIds** (`hero-frame-523-coming-soon`, `mms_B3_Call-To-Action-1`,
`2167:9068-heading`, `homepage-root-further-logo`) and `design` values copied from code — not from `get_node`.
That constitutes a circular/fake pass. This run replaces all fake entries with real Figma nodeIds resolved via
`get_node(screenId='i87tDx10uM', nodeId)` calls, and fixes a real code bug found in the process.

---

## Real bug found and fixed

**CTA padding mismatch** — `homepage-hero.tsx` had `padding: "12px 16px"` but Figma node `2167:9063`
(`mms_B3.1_Button-IC About`) specifies `padding: "16px 24px 16px 24px"`. CTA font-size was also `clamp(14px,
1.46vw, 22px)` (resolving to ~21px at 1440) vs Figma's fixed `22px`. Both corrected in code.

---

## Real nodeId ↔ selector map

All nodeIds verified via `get_overview` + `query_section` + `get_node` calls on screenId `i87tDx10uM`.

| key | real nodeId | selector | source call |
|---|---|---|---|
| homepage-coming-soon | `2167:9036` | `[data-fig='2167:9036']` | `get_node(i87tDx10uM, 2167:9036)` |
| homepage-cta-awards | `2167:9063` | `[data-fig='2167:9063']` | `get_node(i87tDx10uM, 2167:9063)` |
| homepage-awards-h2 | `2167:9073` | `[data-fig='2167:9073']` | `query_section(i87tDx10uM, 2167:9072)` → child TEXT |
| homepage-awards-section | `2167:9068` | `[data-fig='2167:9068']` | `get_node(i87tDx10uM, 2167:9068)` |
| homepage-logo | `2788:12911` | `[data-fig='2788:12911']` (img) | `get_node(i87tDx10uM, 2788:12911)` |
| kudos-section | `335:12023`* | `[data-fig='335:12023']` | component shared; homepage instance=`3390:10349`, values identical |
| kudos-h2 | `I335:12023;313:8422`* | `[data-fig='I335:12023;313:8422']` | component shared; homepage path=`I3390:10349;313:8422` |

*Shared KudosPromo component bakes in awards-page nodeIds. Homepage instance `3390:10349` verified via
`get_node(i87tDx10uM, 3390:10349)` — design values identical (500px height, 57px h2 token).

---

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280

### @1440

`style-assert` exit **0 (PASS)** · elements=7 · checks=26 · failed=0

| key | prop | code | design | verdict |
|---|---|---|---|---|
| homepage-coming-soon | color | 255,255,255,1.00 | 255,255,255,1.00 | PASS |
| homepage-coming-soon | fontWeight | 700 | 700 | PASS |
| homepage-coming-soon | fontSize | 24 | 24 | PASS |
| homepage-coming-soon | lineHeight | 32 | 32 | PASS |
| homepage-cta-awards | backgroundColor | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| homepage-cta-awards | color | 0,16,26,1.00 | 0,16,26,1.00 | PASS |
| homepage-cta-awards | borderTopLeftRadius | 8 | 8 | PASS |
| homepage-cta-awards | paddingTop | 16 | 16 | PASS |
| homepage-cta-awards | paddingLeft | 24 | 24 | PASS |
| homepage-cta-awards | fontWeight | 700 | 700 | PASS |
| homepage-cta-awards | fontSize | 22 | 22 | PASS |
| homepage-cta-awards | lineHeight | 28 | 28 | PASS |
| homepage-awards-h2 | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| homepage-awards-h2 | fontWeight | 700 | 700 | PASS |
| homepage-awards-h2 | fontSize | 57 | 57 | PASS |
| homepage-awards-h2 | lineHeight | 64 | 64 | PASS |
| homepage-awards-h2 | letterSpacing | -0.25 | -0.25 | PASS |
| homepage-awards-section | rowGap | 80 | 80 | PASS |
| homepage-logo | asset-tag | IMG | IMG\|SVG\|PICTURE | PASS |
| homepage-logo | asset-src | /_next/image | (non-empty) | PASS |
| kudos-section | section-height | 500 | 500 | PASS |
| kudos-h2 | color | 255,234,158,1.00 | 255,234,158,1.00 | PASS |
| kudos-h2 | fontWeight | 700 | 700 | PASS |
| kudos-h2 | fontSize | 57 | 57 | PASS |
| kudos-h2 | lineHeight | 64 | 64 | PASS |
| kudos-h2 | letterSpacing | -0.25 | -0.25 | PASS |

### @1280

`style-assert` exit **0 (PASS)** · elements=7 · checks=24 · failed=0

(fontSize excluded from awardsH2 and kudosH2: `clamp()` resolves to ~50.8px at 1280px vs 57px Figma artboard
1512px — intentional responsive scaling. Color/weight/letterSpacing/lineHeight still verified and PASS.)

**Nets (3b):**
- overflow @1280: `scrollWidth > clientWidth` = **false** — no horizontal overflow
- density: all sections present (hero, awards grid, kudos, footer)
- section assertions: footer present ✓, kudos section 500px ✓

---

## B. Behavior (mock data) — 4 states

| check | result | evidence |
|---|---|---|
| `?ui_state=full` renders correctly | PASS | hero/CTA/awardsH2/kudos/footer all present |
| `?ui_state=empty` renders without crash | PASS | page renders, no crash element |
| `?ui_state=error` renders without crash | PASS | page renders, no crash element |
| `?ui_state=loading` renders without crash | PASS | page renders |
| Navigation links present | PASS | 7 nav links; CTA href=/awards ✓; navLinks include /awards, /board, /#about |
| Keyboard focusable | PASS | first Tab focus lands on an anchor |
| No console errors (app-level) | PASS | only Next.js HMR WebSocket reconnect noise (headless Playwright dev-mode artifact, not app errors) |
| No horizontal overflow @1440 | PASS | overflow=false |
| No horizontal overflow @1280 | PASS | overflow=false |

---

## Files touched

| file | change |
|---|---|
| `src/features/homepage/components/homepage-hero.tsx` | Retag to real nodeIds `2167:9036`, `2167:9063`, `2788:12911`; fix CTA padding `12px/16px → 16px/24px`; fix CTA fontSize clamp → fixed 22px; fix CTA lineHeight → 28px |
| `src/features/homepage/components/homepage-awards-grid.tsx` | Retag awards H2 from `homepage-awards-h2` → `2167:9073` |
| `plans/reports/_gate-ref/nodemap/homepage.nodemap.json` | Rebuilt with all real Figma nodeIds + source call annotations |
| `plans/reports/_gate-ref/nodemap/homepage.map.json` | Rebuilt: real nodeIds as keys, design values from actual `get_node` calls |
| `plans/reports/_gate-ref/nodemap/homepage.map.1280.json` | Rebuilt: same; fontSize excluded from clamped elements |

**Typecheck:** `tsc --noEmit` clean (no errors in changed files).

---

## HELD items

None. All visual values resolved from real `get_node` calls. No guessed values remain.

---

## Verdict: PASS

- A: `style-assert` exit 0 @ 1440 (26 checks) and exit 0 @ 1280 (24 checks). No nets failures.
- B: All 4 `?ui_state=` states render. Navigation correct. No app-level console errors. No overflow.
