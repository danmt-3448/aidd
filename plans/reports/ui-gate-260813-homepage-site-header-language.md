# UI-First Gate — homepage (/) + shared SiteHeader language dropdown — PASS

Context: `src/components/site-header.tsx` — the shared header (homepage, board, awards, profile,
notifications) rendered the language control as a one-click vi↔en **toggle** despite showing a
chevron-down (dropdown affordance). Changed to a proper **VN/EN dropdown** (open on click, pick to
switch, outside-click closes), matching the login header's `LanguageSelector` pattern. Closed-state
button visuals unchanged.

## A. Property-diff (CỔNG CỨNG) — 1440 + 1280
- **`style-assert` verdict: PASS @1440** — homepage elements=7, checks=26, failed=0 (exit 0).
- **`style-assert` verdict: PASS @1280** — homepage elements=7, checks=24, failed=0 (exit 0).
- Header closed-state (flag + label + chevron) is byte-identical — the change only adds an `open`
  state + a dropdown `<ul>` (new interactive element, no change to existing tagged nodes).
- Overflow: ok at 1440/1280. Port: 127.0.0.1:3001 · font.ready=true. (Only console line is the
  harmless webpack-hmr WebSocket dev artifact — not a page error.)

## B. Behavior (real render, Playwright) — 100%
- [x] Closed by default (no listbox in DOM).
- [x] Click opens dropdown — `aria-expanded=true`, `role="listbox"` present, options = ["VI", "EN"].
- [x] Pick **EN** → cookie `NEXT_LOCALE=en`, button label updates to "EN" (server re-render via router.refresh).
- [x] Pick **VI** → cookie `NEXT_LOCALE=vi` (round-trips).
- [x] Outside-click closes the dropdown.
- [x] **0 console errors** at 1440.
- [x] a11y: trigger has `aria-haspopup="listbox"` + `aria-expanded`; items `role="option"` + `aria-selected`; active locale marked `#FFEA9E`.

## Verdict: PASS
