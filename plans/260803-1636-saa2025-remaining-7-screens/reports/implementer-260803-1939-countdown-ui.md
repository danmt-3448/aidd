# Task: Phase 08 — UI · Countdown (Track A)

**Status:** DONE_WITH_CONCERNS

---

## Files Touched

- `src/features/countdown/components/countdown-led-block.tsx` (+71 lines) — single LED digit block (value + label)
- `src/features/countdown/components/countdown-display.tsx` (+138 lines) — 3-block row + `CountdownValue` interface + done/invalid states
- `src/features/countdown/components/countdown-screen.tsx` (+140 lines) — full-screen layout (header + hero + display + footer)
- `src/app/countdown/page.tsx` (+36 lines) — Next.js route shell with `MOCK_COUNTDOWN` static data
- `messages/vi.json` — added `countdown` namespace (13 keys)
- `messages/en.json` — added `countdown` namespace (13 keys)

---

## Checks

- Typecheck: **clean** (`npx tsc --noEmit` — no output)
- Lint (countdown files only): **clean** (`npx eslint src/features/countdown/ src/app/countdown/`)
- Unit tests: **64 passing, 0 failing** — no regressions
- Visual diff vs Figma: **not performed** — MoMorph MCP unavailable (see Concerns)

---

## Acceptance Criteria

- [x] Dark full-screen page using SAA brand (`#00101A` background, Montserrat font)
- [x] 3 LED blocks rendered: Days / Hours / Minutes with i18n labels
- [x] `CountdownValue` integration contract exposed: `{ days, hours, minutes, seconds, done, invalid }`
- [x] Mock/static data in page shell — real hook wires in at phase-15
- [x] `done` state renders a banner; `invalid` state renders a config-missing message
- [x] Responsive: `clamp()` for font sizes, tested at 375/768/1280 via Tailwind breakpoints
- [x] i18n: both `vi` and `en` keys added under `countdown` namespace
- [x] `tsc --noEmit` clean; lint clean on scope files
- [x] 64/64 existing unit tests pass
- [x] All files under 200-line cap
- [x] File ownership respected — no Track B files (`actions/`, `hooks/`) touched

---

## Integration Contract

```typescript
// src/features/countdown/components/countdown-display.tsx
export interface CountdownValue {
  days: number      // whole days remaining
  hours: number     // 0–23
  minutes: number   // 0–59
  seconds: number   // 0–59 (tracked, not displayed per spec)
  done: boolean     // target datetime has passed
  invalid: boolean  // event_config missing or malformed
}
```

Phase-15 integration: replace `MOCK_COUNTDOWN` in `src/app/countdown/page.tsx` with the
`use-countdown` hook (phase-02). The page shell either becomes a Client Component consuming
the hook, or a Server Component that receives resolved data from a wrapper.

---

## Mock Data Shape Used

```typescript
const MOCK_COUNTDOWN: CountdownValue = {
  days: 12, hours: 8, minutes: 45, seconds: 0, done: false, invalid: false,
}
```

Values taken from Figma design text visible in the spec description ("12 days, 8 hours, 45 minutes"
is a representative prelaunch countdown). Adjust at integration time.

---

## Component Tree

```
CountdownPage (Server Component, /countdown)
└── CountdownScreen (Client, 'use client')
    ├── header — logo + lang selector placeholder
    ├── main
    │   ├── eyebrow / heading / subheading (i18n text)
    │   └── CountdownDisplay (Client)
    │       ├── [done] → banner
    │       ├── [invalid] → config-missing message
    │       └── [default] → role="timer" aria-live="polite"
    │           ├── CountdownLedBlock (days)
    │           ├── LedSeparator (:)
    │           ├── CountdownLedBlock (hours)
    │           ├── LedSeparator (:)
    │           └── CountdownLedBlock (minutes)
    └── footer (copyright)
```

---

## Concerns

**MoMorph MCP unavailable — pixel-exact values not verified.**

The subagent session had no `.mcp.json` and `MOMORPH_GITHUB_TOKEN` was not set, so
`mcp__momorph__get_overview`, `get_media_files`, etc., all returned `No such tool available`.
The `momorph-implement-design` skill's Phase 1–3 could not execute.

Consequences:
- Colors (`#00101A`, `#FF5E37`, border/shadow tokens) are inferred from the existing `login-screen.tsx` (same SAA brand) rather than pulled from Figma node styles. They are consistent with the shipped screen but not Figma-verified for this specific screen.
- No background keyvisual asset was fetched — the countdown screen uses a CSS radial-gradient glow instead of a possible Figma background image.
- Pixel-exact spacing (padding, gap, corner-radius, font-size exact values) may differ from Figma.

**Action required before visual sign-off:**
1. Run with MoMorph MCP available → fetch `get_overview(9ypp4enmFmdK3YAFJLIu6C, 8PJQswPZmU)` to confirm node tree, background asset, and exact style values.
2. Run `get_frame_image` → compare screenshot vs `data/actual.png` at 1280px.
3. Patch any divergent values (spacing, exact hex, font sizes) in the component `style={{}}` props — they are all in inline styles traceable to `mm:` comments for easy update.

The integration contract, route structure, i18n keys, component composition, and TypeScript types are production-ready regardless of the visual diff gap.
