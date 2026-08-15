# Phase 02 — Đa ngôn ngữ VN/EN (STT 10, Track B · cross-cutting)

**Priority:** P0 · **Status:** ⚠️ built, EN incomplete.

## Scope
- next-intl wired: `next.config.ts` plugin, `src/i18n/request.ts`, `src/i18n/config.ts` (cookie `NEXT_LOCALE`).
- Switcher: `src/components/language-switcher.tsx` (writes cookie, `router.refresh()`).
- Message catalogs: `messages/vi.json` (complete), `messages/en.json`.

## Gap to close (thiếu)
- **`messages/en.json` kudos keys are empty placeholders** → the Kudos screen has no English strings.
  Populate all in-scope EN keys (kudos + any homepage/awards strings still VN-only).
- Verify every in-scope screen (Login, Homepage, Awards, Countdown, Kudos, Compose) has full VN **and** EN.

## Success criteria
- Switching VN↔EN renders correct strings on all 6 in-scope screens; no raw keys, no empty labels.
