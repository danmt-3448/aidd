# UI-First Gate — Countdown (Prelaunch) — PASS (changed-surface re-gate)

Screen: "Countdown - Prelaunch page" · screenId `8PJQswPZmU` · route `/countdown` · fileKey `9ypp4enmFmdK3YAFJLIu6C`
Server: prod build `next start` @ `127.0.0.1:3001` · event set pre-launch (future) · real seeded data (`npm run db:reset`)
Date: 2026-08-15

## Scope of this re-gate
Performance change touched ONLY: `src/features/countdown/components/countdown-screen.tsx` (bg raw `<img>` → `next/image fill priority`)
and `src/app/layout.tsx` (a font preload that was then **reverted** — see below). No other countdown element changed.
This is a **focused re-gate of the changed surface** (render-mechanism swap that preserves geometry + a reverted preload),
not a full property re-diff — the geometry/props are unchanged by an `<img>`→`<Image>` swap at the same box.

## A. Visual fidelity (vs Figma `get_frame_image`)
- [x] **Background illustration** renders via `next/image` (fill, priority, object-cover, object-position right center) — visually
  identical to Figma reference: multicolor organic art anchored right, feathery flow pattern. Screenshot: `evidence/gate/countdown-final-1440.png`.
- [x] **Gradient overlay stays ON TOP** of the image (18deg, darkens left) — z-index correct (image zIndex:0 < gradient zIndex:1). No stacking regression.
- [x] **LED digits render in DSEG7 font** (7-segment look with ghost segments) — `font-display: block`, loads fine same-origin.
- [x] **Layout composition** matches: centered title "Sự kiện sẽ bắt đầu sau" → LED row → labels (NGÀY/GIỜ/PHÚT, VN locale).
- [x] **No layout shift** vs the prior raw-`<img>` version (same absolute full-bleed box).
- [x] **1920 no-break**: `evidence/gate/countdown-1920-nobreak.png` — image covers via object-cover, art right, gradient left, digits
  centered, no horizontal overflow, no zoom distortion/broken layout.

## B. Behavior (real seeded data, authed, pre-launch state)
- [x] Countdown renders live from `event_config.event_start_at` (set to now + 3 days) → LED digits count down (02 / 23 / 56).
- [x] Background + gradient + digits all present at initial paint region.
- [x] **Console: 0 errors, 0 warnings** (`browser_console_messages`).
  - Note: the earlier font `<link rel=preload>` caused a "preloaded but not used within a few seconds" warning (the LED
    digits are client-rendered post-hydration, so the font isn't needed at initial paint). C3 preload was **reverted** to keep console clean; verified 0 warnings after revert.

## Verdict: PASS
The next/image background swap (C6a) is visually identical to Figma and the prior version, with correct z-index layering and
no console noise. C3 (font preload) reverted. Changed surface is clean → C6a is safe to keep.

## Kept vs dropped (see evidence/after/candidate-verdicts.md)
- KEEP: C6a (next/image — 3.0MB PNG → 129KB webp LCP), C1 (sourcemaps off), C8 (dead-dep embla removed).
- DROP: C2 (no-op), C3 (preload → console warning, negligible benefit), C4/C5 (lazy-load — behavior risk / above-fold LCP).
