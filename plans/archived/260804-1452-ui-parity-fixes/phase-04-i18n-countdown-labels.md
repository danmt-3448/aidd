# Phase 04 — Countdown i18n label verification

**Track:** B · **Priority:** MINOR · **Status:** pending · **blockedBy:** —

## Context
- Source report §2 + §4: screenshot showed VN "NGÀY/GIỜ/PHÚT" vs Figma EN "DAYS/HOURS/MINUTES".
- **Resolved (clarifications.md 2026-08-04):** keep VN per i18n — rendering per the active locale is
  correct; Figma is just an EN artboard. Countdown label is NOT a parity bug. **No JSON edits, no
  overwriting VN with EN.** This phase is verification-only.
- Labels already come from `next-intl` (`src/features/countdown/components/countdown-display.tsx` →
  `useTranslations('countdown')`; strings in `messages/en.json` + `messages/vi.json`).

## Requirements
- Functional: countdown renders labels per the active locale (VN strings stay VN, EN strings stay EN).
- Non-functional: both locales retain non-empty countdown label strings.

## Data flow
Active locale (cookie `NEXT_LOCALE`) → next-intl request config → `t('days'|'hours'|'minutes')` →
countdown labels. Nothing changes — this phase only asserts the wiring is intact.

## Implementation steps
1. Assert `messages/en.json` has non-empty `countdown.days/hours/minutes` (EN forms).
2. Assert `messages/vi.json` has non-empty `countdown.days/hours/minutes` (VN forms).
3. Verify the component renders per active locale (VN under VN, EN under EN) — no JSON edit.
4. Confirm `timerAriaLabel` is grammatical in each locale.

## Related code files
- Read only: `src/features/countdown/components/countdown-display.tsx`, `countdown-led-block.tsx`,
  `messages/en.json`, `messages/vi.json`.
- Do NOT edit any JSON string here. Do NOT edit countdown layout/responsive (phase-09 owns that).

## Todo
- [ ] Assert both locales have non-empty `countdown.days/hours/minutes`
- [ ] Verify component renders per active locale (no JSON change)
- [ ] Confirm `timerAriaLabel` grammatical per locale

## Acceptance criteria (binary)
- [ ] `messages/en.json` and `messages/vi.json` both contain non-empty `countdown.days/hours/minutes`.
- [ ] Countdown renders VN labels under VN locale and EN labels under EN locale (verified in render).
- [ ] No JSON string is modified in this phase (git diff shows no `messages/*.json` change).
- [ ] `npm run build` succeeds.

## Risk assessment
- **Low.** Verification-only; no edits. No regression surface.

## Security considerations
- None.

## Next steps
- phase-09 handles countdown layout/responsive independently (no shared lines with this phase).
