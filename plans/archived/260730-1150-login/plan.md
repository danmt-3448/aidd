---
title: Login screen (SAA 2025)
work_type: feature
status: completed
spec_source: momorph:GzbNeVGJHz
clarifications: plans/260730-1150-login/clarifications.md
blockedBy: []
blocks: []
---

# Plan: Login screen

Màn đăng nhập SAA 2025 — Google OAuth qua Supabase, i18n VN/EN, UI pixel-perfect từ Figma. Màn đầu tiên để validate flow Takumi + MoMorph.

- **MoMorph:** https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz
- **Context:** `CLAUDE.md`, `docs/database-schema.md`
- **Nguồn sự thật:** Figma (UI) + MoMorph screen spec (logic) + `clarifications.md`

## Two-track structure

Track A (UI) và Track B (backend/logic) **chạy song song** — không block nhau. Integration ở phase cuối.

## Phases

| # | Phase | Track | Status | Depends |
|---|-------|-------|--------|---------|
| 01 | [Login UI](phase-01-login-ui.md) | A · UI | completed | — |
| 02 | [Supabase schema: profiles](phase-02-supabase-schema-profiles.md) | B · DB | completed | — |
| 03 | [Supabase clients + Google provider](phase-03-supabase-auth-clients.md) | B · auth | completed | 02 |
| 04 | [Auth flow + route guard](phase-04-auth-flow-guard.md) | B · logic | completed | 03 |
| 05 | [i18n setup (next-intl)](phase-05-i18n-setup.md) | B · i18n | completed | — |
| 06 | [Integration](phase-06-integration.md) | A+B | completed | 01, 04, 05 |
| 07 | [Tests (Vitest + Playwright)](phase-07-tests.md) | test | completed | 06 |

## Key dependencies

- Track A (01) độc lập hoàn toàn với Track B (02–05) — parallel-runnable.
- Integration (06) chờ UI (01) + auth flow (04) + i18n (05).
- Tests (07) chạy sau integration.

## Definition of Done

- UI pixel-perfect Figma + responsive (breakpoint 640/768/1024/1280).
- Google login qua Supabase hoạt động; success → `/todo`; fail → error message.
- profiles row tạo khi đăng nhập lần đầu; RLS bật.
- i18n VN/EN đổi được, cookie `NEXT_LOCALE`.
- Unit (Vitest) + E2E (Playwright) pass.

## Handoff

Thực thi: `/tkm:takumi plans/260730-1150-login/plan.md`
