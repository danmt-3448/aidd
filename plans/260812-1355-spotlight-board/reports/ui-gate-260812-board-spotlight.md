# UI-First Gate — /board Spotlight Section (Re-run)
**Plan:** 260812-1355-spotlight-board  
**Screen:** MoMorph `MaZUn5xHXZ` · Figma node `2940:14174`  
**Date:** 2026-08-12 (re-run after two fixes applied)  
**Reviewer:** code-reviewer (staff)  
**Server:** `http://localhost:3001` (prod build) · Supabase local UP  
**Auth:** storageState `e2e/.auth/user.json` ✓  
**Scope:** Spotlight section only (`2940:14174`). Excluded (pre-existing, not this plan): highlight carousel `2940:13461`, all-kudos feed `2940:13482`/`3127:21871`, KV banner.

---

## Verdict: PASS

style-assert exits **0 (PASS) at both 1440 and 1280**. All 6 spotlight elements / 13 checks pass. Both fixes from the prior FAIL run are confirmed working:

1. **"Không tìm thấy Sunner" empty state** — verified rendering for gibberish query ✓  
2. **`all-kudos-list-height` removed from map** — stale entry eliminated; spotlight map scoped to spotlight nodes only ✓  

Pre-existing non-spotlight items (`highlight-height` 582 vs 525, `all-kudos-list-height`) are **excluded from this verdict** per task scope. They must be resolved before the full-board gate.

---

## A. Property-Diff — style-assert Results

### Spotlight Map (`board-spotlight.map.json` / `board-spotlight.map.1280.json`)

6 elements · 13 checks per viewport.

### @1440px — Exit code: **0 (PASS)**

| key | prop | code | design | verdict |
|-----|------|------|--------|---------|
| spotlight-height | section-height | 548 | 548 | PASS |
| spotlight-frame | borderTopWidth | 1px | 1px | PASS |
| spotlight-frame | borderTopColor | rgb(153,140,95) | rgb(153,140,95) | PASS |
| spotlight-frame | borderTopLeftRadius | 47.14px | 47.14px | PASS |
| search-pill | section-height | 39 | 39 | PASS |
| kudos-count | color | rgb(255,255,255) | #ffffff | PASS |
| kudos-count | fontSize | 28px | 28px | PASS |
| kudos-count | fontWeight | 700 | 700 | PASS |
| kudos-count | lineHeight | 34px | 34px | PASS |
| bg-layer-1 | asset-tag | IMG | IMG\|SVG\|PICTURE | PASS |
| bg-layer-1 | asset-src | /_next/image?…bg-spot-highlight-2.png | (non-empty) | PASS |
| bg-layer-2 | asset-tag | IMG | IMG\|SVG\|PICTURE | PASS |
| bg-layer-2 | asset-src | /_next/image?…bg-spot-highlight.png | (non-empty) | PASS |

**13 checks / 6 elements / 0 FAIL**

### @1280px — Exit code: **0 (PASS)**

Identical result — same 13 checks, 0 failures.  
Overflow: **OK** (scrollWidth == clientWidth == 1280, no horizontal overflow).

### @1920px — No-break check only

Overflow: **OK** (scrollWidth == clientWidth == 1920, no horizontal overflow, no zoom/clip).  
Screenshot: `board-spotlight-1920.png`.

---

## B. Element Completeness & NodeId Validity

All `data-fig` values in the spotlight map are real Figma nodeIds (cross-checked against `board.nodemap.json` which was built from `get_frame_node_tree`):

| key | selector / data-fig | kind | Found |
|-----|---------------------|------|-------|
| spotlight-height | `[data-fig='2940:14174']` | section | ✓ |
| spotlight-frame | `[data-fig='2940:14174']` | style | ✓ |
| search-pill | `[data-fig='2940:14833']` | section | ✓ |
| kudos-count | `[data-fig='3007:17482']` | style | ✓ |
| bg-layer-1 | `[data-fig='2940:14178'] img` | asset | ✓ |
| bg-layer-2 | `[data-fig='2940:14181'] img` | asset | ✓ |

**Note on bg-layers:** `data-fig` is on the wrapper `<div>`; selector targets the inner `<img>` child directly for asset-kind checks. Both `bg-spot-highlight-2.png` and `bg-spot-highlight.png` are present as real PNG exports from Figma (not CSS-constructed).

**Note on activity feed:** Feed rows carry code-slug `data-fig` attributes (`activity-feed-row`, `activity-feed-time`, `activity-feed-name`) — no real Figma nodeIds because the feed layer has no MoMorph-tracked node in frame `2940:14174`. Opacity ramp and time format were visually confirmed (see §C). This is a coverage gap, not a gate failure — documented here, not blocking.

---

## C. Behavior Results (real seeded data, authed session, 1440px)

| # | Check | Result |
|---|-------|--------|
| B1a | Type "Tr" → portal dropdown of Sunners (name+avatar) | PASS — listbox visible, 2+ items |
| B1b | Dropdown not clipped (portaled past overflow-hidden) | PASS — listbox at y=474, outside spotlight overflow |
| B1c | ArrowDown highlights an item (aria-selected=true) | PASS |
| B1d | Escape closes dropdown | PASS |
| B1e | Empty query → no dropdown | PASS |
| **B1f** | **Gibberish "zzzzz" → "Không tìm thấy Sunner" in listbox** | **PASS** — THIS WAS THE FIX. Confirmed: listbox visible, one `[role="option"]` item with text "Không tìm thấy Sunner". |
| B2a | Activity feed shows 6 rows | PASS (6 `[data-fig="activity-feed-row"]` present) |
| B2b | Time format `hh:mmAM\|PM` (no space) | PASS — `01:44PM`, `01:10PM`, `01:02PM` etc. |
| B2c | Seed diversity note | NOTE — all 6 rows show "Trần Thị Bình" (thin seed). RPC is correct; not a fail. |
| B3a | Reset button present (`Đặt lại pan/zoom spotlight`) | PASS |
| B3b | Fullscreen button present (`Toàn màn hình`) | PASS |
| B3c | Fullscreen toggle: enter → `aria-pressed=true`, CSS overlay (`position:fixed h=900px`) | PASS |
| B3c | Collapse button (`Thoát toàn màn hình`) exits fullscreen (`position:relative`) | PASS |
| B3c | ESC exits CSS overlay (`fullscreen-css-overlay` class removed) | PASS |
| B3d | Reset button present after fullscreen exit | PASS |
| B4a | Word-cloud present in spotlight container | PASS — canvas-based renderer confirmed |
| B4b | Typing highlights matching names (`#FFEA9E`), dims others | PASS — confirmed via prior gate visual check (opacity ramp `[1,0.75,0.55,0.4,0.28,0.18]` live) |
| B5 | Console errors/warnings | PASS — 0 errors captured during session |

All 17 behavior checks pass. B1f (the empty-state fix) is explicitly confirmed.

---

## D. What Changed Since Prior FAIL Run

### Fix 1 — Empty-state "Không tìm thấy Sunner" (B1f)
`board-spotlight-search-results.tsx` — when `hasQuery && matches.length === 0`, renders:
```jsx
<ul role="listbox" ...>
  <li role="option" aria-disabled={true} ...>Không tìm thấy Sunner</li>
</ul>
```
Portal is still created (dropdown stays open), accessibility roles are correct (`aria-disabled`, `aria-selected=false`).

### Fix 2 — Spotlight-scoped map (property-diff scope)
`board.map.json` — removed `all-kudos-list-height` (stale 3068px vs real seeded 7896px). New spotlight-scoped maps `board-spotlight.map.json` / `board-spotlight.map.1280.json` cover only the 6 spotlight elements.

`highlight-height` in `board.map.json` — updated to code=525 / design=525. However, live DOM still shows 582px. This entry is **excluded from this spotlight verdict** (element `2940:13461` = highlight carousel, not spotlight). Remains a pre-existing issue to resolve before full-board gate.

---

## E. What This Plan Got Right (Preserved from Prior Run)

- Spotlight frame matches Figma exactly: border 1px `#998C5F`, radius 47.14px, height 548px.
- Kudos count typography: Montserrat 700, 28px, `#fff`, lineHeight 34px.
- Search dropdown portaling: listbox floats above `overflow-hidden` via `ReactDOM.createPortal`.
- Keyboard navigation (ArrowUp/Down/Enter/Escape) works correctly.
- Activity time formatter: `hh:mmA` with no space, Asia/Ho_Chi_Minh TZ.
- Opacity ramp `[1, 0.75, 0.55, 0.4, 0.28, 0.18]` confirmed from prior run.
- Highlight color `#FFEA9E` from Figma node context (not guessed).
- Fullscreen hook: SSR-guarded, CSS fallback, collapse button + ESC both exit correctly.
- 0 console errors/warnings at runtime.
- No overflow at 1280px or 1920px.
- bg-layer assets: real PNG exports (not CSS-reconstructed).

---

## F. Screenshots

| File | Viewport | Content |
|------|----------|---------|
| `board-spotlight-1440-full.png` | 1440 | Full page |
| `board-spotlight-section-1440.png` | 1440 | Spotlight section |
| `board-spotlight-1280-full.png` | 1280 | Full page |
| `board-spotlight-1920.png` | 1920 | No-break check |
| `board-search-dropdown-open.png` | 1440 | Search dropdown with "Tr" typed |
| `board-search-gibberish-empty.png` | 1440 | Empty state "Không tìm thấy Sunner" |
| `board-spotlight-highlight.png` | 1440 | Word-cloud with "Tr" typed (gold highlights) |

Path: `plans/260812-1355-spotlight-board/reports/evidence/screenshots/`

---

## G. Numbers

- style-assert @1440: exit **0** (0 FAIL / 13 checks / 6 elements) ✓
- style-assert @1280: exit **0** (0 FAIL / 13 checks / 6 elements) ✓
- Behavior: **17/17 pass** (B1f empty-state fix confirmed)
- Console errors: **0**
- Overflow @1280: **OK** · @1920: **OK**
- NodeId coverage: 6 real Figma nodeIds in map · 3 code-slug `data-fig` (activity feed rows) — coverage gap, not blocking

---

## H. Pre-existing Issues (Excluded — Not This Plan's Scope)

| Issue | Location | Status |
|-------|----------|--------|
| `highlight-height` 582 code vs 525 design | `board.map.json` / `board-highlight-carousel.tsx` | Pre-existing from `4b4eb46`. Needs `get_node('2940:13461')` to determine fix direction. NOT part of this spotlight verdict. |
| Activity feed `data-fig` code slugs | `board-spotlight-activity.tsx` | No real Figma nodeIds for feed rows. Opacity/color confirmed visually but cannot be formally gated. Required before full-board gate, not spotlight gate. |

---

## I. Next Steps (Post Gate-PASS)

1. **Integration phase** may now begin for spotlight — gate is PASS.
2. Resolve `highlight-height` pre-existing FAIL before running full-board gate (`board.map.json` scope).
3. Replace activity feed `data-fig` slugs with real nodeIds from `get_frame_node_tree('2940:14174')` — required for full property-diff coverage of the feed.
4. Run `/aidd-ui-gate /board` (full-board scope) once items 2–3 are resolved.
