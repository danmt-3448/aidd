# Phase 04 — Board lazy-load (interaction-gated JS)

**Files:** `src/features/board/components/board-spotlight-word-cloud.tsx`, `board-highlight-carousel.tsx` (+ dynamic wrappers).
**Candidates:** C4 (`react-zoom-pan-pinch`), C5 (`swiper`). Both currently static-imported into `/board`.
**Highest-risk phase** — refs + effects fire relative to mount; verify carefully. Gate + e2e /board.

## Steps
1. **C4 — lazy-load `react-zoom-pan-pinch`.** (word-cloud IS below the fold → genuine win.)
   - **Scope: edit ONLY `board-spotlight-word-cloud.tsx`.** Wrap the `TransformWrapper`/`TransformComponent`
     subtree in `next/dynamic(() => import('react-zoom-pan-pinch').then(...), { ssr:false, loading: <fallback/> })`.
   - **Do NOT** `next/dynamic` the word-cloud component from `board-spotlight.tsx`. Its `import type { ReactZoomPanPinchRef }`
     (board-spotlight.tsx:15) is **compile-erased** → pulls no runtime bytes → `board-spotlight.tsx` needs NO edit (review F5).
   - Verify `transformRef` usage still works after hydration (ref only available once the lazy comp mounts).
2. **C5 — `swiper` highlight carousel — MEASURE FIRST, likely SKIP.**
   - Per `board-screen.tsx` layout (KV banner ~512px + toolbar → carousel starts ~660px from top), the carousel
     is **above the fold on 1440×900 and is the LCP candidate** → lazy-loading would **HURT LCP** (review F7).
   - **Expectation: C5 = skip/neutral.** Confirm with one measurement, but do NOT invest in the lazy path
     unless measurement surprises. If (only if) proven below-fold: wrap in `next/dynamic` and verify
     `swiperRef.current?.slideToLoop(0,0)` (carousel.tsx:~89, already guarded by a destroyed-check) doesn't fire pre-mount.

## Measure & verify
- `npx next build` → Turbopack totals → `evidence/after/bundle-after-phase04-turbopack.txt`. Expect /board-attributed JS to drop (confirm via analyzer treemap: swiper/zoom-pan chunk moves out of initial).
- **e2e:** `npx playwright test e2e/board.spec.ts e2e/board-spotlight.spec.ts --project=authed` → green.
- **`/aidd-ui-gate` on `/board`** — carousel + spotlight render identical, no console error, interactions work.

## EXECUTION VERDICT (2026-08-15): C4 SKIPPED, C5 SKIPPED — reasons recorded

- **C4 skipped.** `board-spotlight-word-cloud.tsx:124` applies the parent's `transformRef` as `ref={transformRef}`
  on `TransformWrapper`, and the parent **uses it**: `board-spotlight.tsx:52 handleReset() → transformRef.current?.resetTransform()`.
  A shallow `next/dynamic` of `TransformWrapper` does NOT forward refs → would break `resetTransform()`. Doing it
  cleanly requires extracting the whole interactive canvas (TransformWrapper + TransformComponent + mapped buttons +
  tooltip/search/click closures) into a new lazily-imported child and rewiring the ref as a plain prop — a **logic
  refactor of the spotlight's core interaction**, which crosses the user's hard constraint ("config-safe, đừng làm hư code").
  Win is modest (~30KB raw / ~10KB gzip, one below-fold widget). **Not worth the regression risk without the user present.** Deferred.
- **C5 skipped.** Highlight carousel is above the fold on /board (LCP candidate) → lazy-loading would hurt LCP (plan F7). As predicted.

Net: Phase 04 yields no code change. The bundle wins come from Phase 02/03. This is the plan's gating discipline working as intended (keep only safe wins).

## Success criteria
- /board initial JS reduced OR candidate reverted with reason.
- board + spotlight e2e green; UI-First Gate PASS; no ref/effect errors in console.

## Risk / rollback
- Lazy-loading a ref-holding client comp is the main trap → if any ref/effect breaks, revert that candidate.
- Never lazy-load an above-the-fold LCP element (that's why C5 measures first).
