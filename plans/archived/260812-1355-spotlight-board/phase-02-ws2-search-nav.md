# Phase 02 — WS-2 Search → Sunner Profile (dropdown match-picker) (Track A: UI)

**Screen:** MoMorph `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ` · Figma node `2940:14174`
**Priority:** P2 · **Status:** pending · **Track:** A (parallel, no block with 01/03/04)
**Detail:** `momorph-implement-design` handles UI at build. See [spec.md §WS-2](./spec.md).

## Goal
Typing shows a dropdown of matching Sunners; pick one → navigate to their profile. Live cloud-highlight as secondary feedback.

## Files
- `board-spotlight.tsx` — match resolver (has `nodes` + `onOpenProfile` in scope); pass `onSelect` down. **No new prop threads to board-screen/board-connected.**
- `board-spotlight-search.tsx` — keep live `onChange`; render dropdown of matches (name+avatar) below input, cap ~8 rows, empty-query = no dropdown. New props: `nodes` + `onSelect?: (receiverId)=>void`. **Add `data-fig="2940:14833"` to the search pill** for `style-assert.mjs`.
  - **⚠️ Portal required:** the container `data-fig="2940:14174"` has `overflow-hidden` (needed for `border-radius:47.14px`). A dropdown as a normal child WILL be clipped. Render it via `ReactDOM.createPortal` to `document.body`, positioned from the input's `getBoundingClientRect()`; `z-index` must exceed the fullscreen overlay's `z-50`. SSR-guard the portal (`typeof document !== 'undefined'`).
  - **Keyboard nav:** ArrowUp/Down move highlight, Enter selects highlighted (single match → direct), Escape closes.
- `board-spotlight-search-results.tsx` (**new**) — dropdown list, if it keeps `board-spotlight-search.tsx` ≤200.
- `board-spotlight-word-cloud.tsx` — matches render in highlight color + scale up (already dims; add color from `get_node` on red name layer — **not guessed**). ~20–30 line extraction (file at 202, must end ≤200).

## Out of scope
- Node **click** nav — already works (`onOpenProfile`). Don't re-implement.
- Fullscreen, activity feed, background.

## Acceptance (spec §5)
- [ ] Empty query → no dropdown (guard `q.trim().length===0`).
- [ ] Typing → dropdown of matching Sunners (name+avatar); also live cloud-highlight + dim others.
- [ ] Pick a row (click / Enter on single match) → `/profile?id=<receiverId>`.
- [ ] 0 matches → dropdown empty-state "Không tìm thấy Sunner", no nav, no console error.
- [ ] **Dropdown NOT clipped** by the `overflow-hidden` container (portal or equivalent); visible above canvas + in fullscreen overlay.
- [ ] Keyboard: ArrowUp/Down highlight, Enter select, Escape close.
- [ ] `board-spotlight-search.tsx` and `board-spotlight-word-cloud.tsx` end ≤200.
