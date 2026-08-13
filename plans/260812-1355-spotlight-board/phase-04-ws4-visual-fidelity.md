# Phase 04 — WS-4 Visual Fidelity / Nebula Background (Track A: UI)

**Screen:** MoMorph `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ` · Figma node `2940:14174`
**Priority:** P2 · **Status:** pending · **Track:** A (parallel, no block with 01/02/03)
**Detail:** `momorph-implement-design` handles UI at build. See [spec.md §WS-4](./spec.md).

## Goal
Match Figma nebula background: dark nebula + faint constellation network + orange/teal feather bleed at edges. **Export real assets** — do NOT reconstruct with eyeballed gradients.

## Files
- Spotlight background layer (in `board-spotlight.tsx` / word-cloud container) — swap to exported Figma assets via `get_media_files`/`get_figma_image` on `2940:14174` (+ children); render layered `<Image>`/CSS.
- `data-fig` tags on measured frame + text elements for `style-assert.mjs`.

## Out of scope
Activity, search, fullscreen behavior. Mobile artboard (gate = 1440+1280 only).

## Acceptance (spec §6 — WS-4 deliverables only)
- [ ] Nebula/constellation bg = exported Figma asset (`get_media_files`, not guessed).
- [ ] `data-fig` on measured frame/background elements.
- [ ] 1920 no-break check passes.
- [ ] Every value answers "which Figma node?" — no guessed visuals.

> Feed opacities (WS-1), highlight color (WS-2), and the holistic gate §A `style-assert.mjs` exit-0 check live in their own phases — the whole-screen gate runs in phase-05.
