# Phase 03 — WS-3 Fullscreen (Track A: UI)

**Screen:** MoMorph `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ` · Figma node `2940:14174`
**Priority:** P2 · **Status:** pending · **Track:** A (parallel, no block with 01/02/04)
**Detail:** `momorph-implement-design` handles UI at build. See [spec.md §WS-3](./spec.md).

## Goal
⤢ bottom-right button toggles fullscreen (immersive). Pan/zoom stays on mouse.
**Refit — simplest-first (predict-risks rec #1):** first ship `requestFullscreen` + let the pan/zoom wrapper fill the viewport (no manual scale math). Apply the **CSS scale wrapper only as a fallback** if the gate shows clip/dark-void at a tall viewport — no re-run of collision layout either way.

## Files
- `use-fullscreen.ts` (create) — `{ isFullscreen, toggle, ref }`; `ref.requestFullscreen()`/`document.exitFullscreen()`; `fullscreenchange` listener; fallback CSS `fixed inset-0 z-50` overlay if API unavailable; ESC exits (native + overlay keydown). **SSR-guard all `document`/`requestFullscreen` access** (`typeof document !== 'undefined'`).
- `board-spotlight.tsx` (183 → WS-2+WS-3 add ~27 lines → will exceed 200) — attach ref to `<div data-fig="2940:14174">`; pass `toggle`+`isFullscreen` to controls. **Extract the background image layer block (~lines 90–120, ~30 lines) into a new `src/features/board/components/board-spotlight-bg.tsx` client component** so `board-spotlight.tsx` ends ≤200.
- `board-spotlight-bg.tsx` (create) — client component holding the extracted background image layer block.
- `board-spotlight-controls.tsx` — **two buttons**: keep the existing pan/zoom **reset** button (`handleReset` stays), add the ⤢ **fullscreen** toggle; ⤢ icon → collapse glyph when `isFullscreen`.
- `board-spotlight-word-cloud.tsx` — fullscreen `transform: scale()` on inner TransformWrapper container to fill viewport height, preserve aspect ratio (keeps `CANVAS_W/CANVAS_H`, no `board-spotlight-layout.ts` re-run). File at 202 → must end ≤200.

## Scale contract (FALLBACK only — implement if simplest-first clips)
`use-fullscreen.ts` exposes `containerHeight: number` (from a resize/`fullscreenchange` listener on the fullscreen element). `board-spotlight.tsx` passes it to `BoardSpotlightWordCloud` as `fullscreenHeight?`. Word-cloud computes `scale = (fullscreenHeight − topBarH − bottomBarH) / CANVAS_H` and applies it to the `TransformWrapper` wrapper `<div>`. Skip entirely if pan/zoom-fill passes the gate.

## Out of scope
- Search, activity feed, background fidelity (other phases).

## Acceptance (spec §5)
- [ ] ⤢ enters fullscreen; icon → collapse; ESC + collapse-click exit. Reset button still resets pan/zoom.
- [ ] Refit: no clip/overlap at 900–1080px viewport; feed + search + `NNN KUDOS` all visible.
- [ ] Mouse pan/zoom works in normal + fullscreen.
- [ ] `BoardSpotlightControls` interface = `{ onReset, toggle, isFullscreen }`; collapse glyph renders when `isFullscreen===true`.
- [ ] SSR-safe: no `document`/`requestFullscreen` access at module/render top-level. No hydration error, no console error.
- [ ] `board-spotlight.tsx` (after bg extraction) and `board-spotlight-word-cloud.tsx` end ≤200.
