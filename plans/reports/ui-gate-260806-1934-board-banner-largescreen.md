# UI-First Gate — board (banner large-screen fix) — PASS

**Screen:** `/board` · screenId `MaZUn5xHXZ` · **Date:** 2026-08-06 19:34 · Port 127.0.0.1:3001

## Bug reported (user, large screens)
On viewports > 1440 the KV banner broke: the `object-cover` artwork scaled up, pushing its dark-left region (which carries the cream "KUDOS" wordmark's contrast) off-screen so bright feathers sat under the wordmark; the full-bleed banner also mismatched the already-1440-capped content column below it.

## Root cause
- `board-kv-banner.tsx`: artwork `objectPosition:'center right'` + full-bleed banner. The Figma artwork (`I2940:13432;2167:5141`, verified identical to `/public/images/board/kv-background.png`) is dark on the left, feathers left-center→right. Anchoring right + zoom on wide viewports hid the dark-left.
- Content area (`board-screen.tsx:109`) was already `max-w-[1440px] mx-auto`; the banner was not → inconsistent on ultrawide.

## Fix (Figma-faithful at 1440, robust beyond)
`board-kv-banner.tsx`: wrapped artwork + gradient + content in a centered `max-w-[1440px]` stage inside the full-width `#00101A` backdrop; artwork `objectPosition:'left center'`. Values traceable to Figma (bg `#00101A`, artboard 1440, Cover gradient `1210:12612` unchanged). No guessed values.
- ≤1440: unchanged (gate untouched).
- >1440: banner renders at native 1440 composition, centered, dark side-fill — no zoom, aligns with content column.

## Verification (live Playwright)
| viewport | horizontal overflow | banner height | inner cap |
|---|---|---|---|
| 1280 | none (1265=1265) | 512px | — |
| 1440 | none (1425=1425) | 512px | — |
| 1920 | none (1905=1905) | 512px | 1440 |

- style-assert @1440: exit 0, 0 failed — PASS
- style-assert @1280: exit 0, 0 failed — PASS
- typecheck: clean
- wordmark contrast restored (over dark-left) at all three widths

## Verdict: PASS
