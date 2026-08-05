# Phase 09 — Login + Countdown + Rules UI polish (MINOR)

**Track:** A · **Priority:** MINOR · **Status:** pending · **blockedBy:** —

## MoMorph refs
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- Countdown - Prelaunch: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Thể lệ UPDATE: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/b1Filzi9i6
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Context
- Source report §2 + §3b. **login:** "ROOT FURTHER" heading wraps 2 lines (ref 1 line) → nowrap/clamp;
  right-side artwork darker/duller than ref → check blend-mode/opacity/gradient; @1440 content drifts
  left, needs centered max-width. **countdown:** @375 clock overflows/clips last group (scale-down /
  flex-wrap); content drifts left + artwork doesn't cover the extra width @wide (background-position
  right / cover); @1440 needs centering. **rules:** minor spacing/bg-color drift + missing max-width
  cap (already high fidelity — lowest priority).
- UI = Figma source of truth; pull values from the refs above.

## Ownership note — countdown split with phase-04
- **phase-04 (Track B) owns countdown label STRINGS / locale.** This phase owns countdown
  **layout/responsive/artwork only** — do NOT edit `messages/*.json` or the label text here.
  Shared file caution: both may touch `countdown-*` components. To stay conflict-free, this phase
  edits only layout/style attributes (positioning, flex-wrap, background) and never the `t('...')`
  label bindings. If a single line must change for both, phase-04 lands first.

## Requirements
- Functional: login heading on 1 line at desktop; login artwork matches ref brightness; login +
  countdown + rules content centered @1440 (via `PageContainer`); countdown clock fits @375; countdown
  artwork covers wide viewports; rules spacing/bg match ref.
- Non-functional: components < 200 lines; no fixed width on >50%-viewport elements.

## Data flow
Screen components → apply `PageContainer` (from phase-05) for centering; adjust artwork CSS
(blend/opacity/background-position/cover) + responsive clock layout.

## Related code files
- Modify: `src/features/auth/components/login-screen.tsx`, `login-header.tsx` (heading nowrap, artwork,
  center); `src/features/countdown/components/countdown-screen.tsx`, `countdown-display.tsx`,
  `countdown-led-block.tsx` (layout/responsive/artwork ONLY — no label strings); `src/app/rules/page.tsx`
  + `src/features/rules/components/rules-panel.tsx` (spacing/bg + max-width cap).
- Import: `@/components/page-container` (phase-05).
- Do NOT edit `messages/*.json` (phase-04) or countdown label bindings.

## Implementation steps
1. Login: make "ROOT FURTHER" render on one line at desktop (nowrap/clamp); wrap content in
   `PageContainer`; match artwork brightness (fix blend-mode/opacity/gradient) vs `GzbNeVGJHz`.
2. Countdown: wrap content in `PageContainer`; make the clock fit @375 (scale/flex-wrap, no clip);
   make artwork cover wide viewports (`background-position: right` / `cover`) vs `8PJQswPZmU`.
3. Rules: apply max-width cap + fix spacing/bg-color drift vs `b1Filzi9i6`.
4. Visual-diff all three at 375/768/1280/1440 until parity.

## Todo
- [ ] Login heading 1-line desktop + artwork brightness + PageContainer
- [ ] Countdown @375 clock fits; wide artwork cover; PageContainer
- [ ] Rules max-width cap + spacing/bg
- [ ] Visual-diff parity @ 375/768/1280/1440 (3 screens)

## Acceptance criteria (binary)
- [ ] Login "ROOT FURTHER" heading renders on a single line at ≥1024.
- [ ] Login right-side artwork brightness matches the `GzbNeVGJHz` ref (no dull/dark cast).
- [ ] Login, countdown, and rules content is centered (max-width capped) at 1440.
- [ ] At 375 the countdown clock shows all groups with no clip/overflow.
- [ ] Countdown artwork covers the full width at 1440 (no bare gap on the right).
- [ ] Rules max-width is capped and spacing/bg match the ref.
- [ ] No `messages/*.json` or countdown label binding changed in this phase (git diff).
- [ ] `tsc --noEmit` + `npm run build` succeed; components < 200 lines.

## Risk assessment
- **Low–Med.** Shared countdown files with phase-04 → mitigation: strict layout-only ownership here;
  phase-04 lands first if a line overlaps.

## Security considerations
- None.

## Next steps
- Feeds phase-11 verify.
