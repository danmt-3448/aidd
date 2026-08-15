# Phase 03 — Asset & font delivery (gated on countdown UI)

**Files:** `src/app/globals.css`, `src/app/layout.tsx` (font preload), `src/features/countdown/components/countdown-screen.tsx`.
**Candidates:** C3 (DSEG7 font), C6a (countdown bg image). Both touch /countdown visuals → **must re-pass `/aidd-ui-gate` on /countdown**.

## Steps
1. **C3 — DSEG7 font: PRELOAD ONLY, keep `font-display: block` (review F4 — UI-safe).**
   - **Do NOT change `font-display`.** `optional` would show the system fallback font on the LED digits
     for a cold-cache first-time visitor — a real regression the gate (cache-warm Playwright session) and
     the structural countdown e2e CANNOT catch. `swap` FOUTs. So keep `block` and just make the font arrive early.
   - Add a preload so `block`'s blocking window is minimal: in `layout.tsx`, add a `<head>` element as a
     **sibling of `<body>` inside `<html>`** (App Router merges it — layout currently has no `<head>`):
     ```tsx
     <html lang={locale} className={...}>
       <head>
         <link rel="preload" href="/fonts/DSEG7Classic-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
       </head>
       <body ...>{children}</body>
     </html>
     ```
   - Rationale: preload downloads the LED font in parallel early → `block` window shrinks to ~0 → no
     render-block in practice, and NEVER shows a wrong font. If build/hydration warns about the head, revert to no preload (C3 neutral).
2. **C6a — countdown background image.**
   - `countdown-screen.tsx:44` raw `<img src="/images/countdown/prelaunch-bg.png" style={{objectFit:'cover',objectPosition:'right center',zIndex:0}}>`
     → `next/image` with `fill`, `priority`, `sizes="100vw"`. **Set `objectFit`/`objectPosition`/`zIndex` via the
     `style` prop on `<Image>`, NOT Tailwind** — `object-right-center` is NOT a valid Tailwind v4 class (review F3);
     `next/image` forwards `style` to the underlying `<img>`. Keep `style={{ objectFit:'cover', objectPosition:'right center' }}`.
   - **zIndex trap (review edge-case):** `next/image fill` wraps the img in an absolute `<span>`. Ensure the
     background stays UNDER the gradient overlay (`zIndex:1`, line ~59) — put the image wrapper at `zIndex:0`
     (parent stacking) so the gradient stays on top. Gate property-diff (colors) will catch a stacking regression.
   - **Do NOT change layout/positioning** — visual output must be identical. If next/image forces any layout shift, keep raw `<img>` (add `fetchPriority="high"`) and mark C6a neutral/reverted.

## Measure & gate
- `npx next build` → Turbopack totals → `evidence/after/bundle-after-phase03-turbopack.txt` (image change may reduce transferred bytes, not JS).
- **`/aidd-ui-gate` on `/countdown`** at 1440+1280 — property-diff exit 0 + behavior. Capture report to `plans/reports/`.
- Lighthouse on `/countdown` after (median≥3) → compare LCP vs before.

## Success criteria
- /countdown UI-First Gate PASS (visuals identical), no console error.
- LCP on /countdown same-or-better; render-block from font removed.
- Any candidate that shifts /countdown visuals and can't be made identical → **reverted**.

## Risk / rollback
- Font stays `block` + preload → no wrong-font flash, no render-block in practice. If preload can't be added cleanly, C3 is neutral (revert), not a regression.
- next/image on a full-bleed bg is the classic layout-shift AND z-index trap → the gate is the arbiter. If not pixel-identical → revert C6a to raw `<img>`.
- **Gate limitation to record in report:** the UI-First Gate runs a cache-warm Playwright session; it verifies layout/colors but not cold-cache font behavior. C3-as-preload-only sidesteps this (no font-display change), so no unverified regression ships.
