# Phase 08 — Review

**Context:** [spec.md](./spec.md) · [primary-workflow.md Step 3](../../.claude/rules/primary-workflow.md)
**Priority:** P2 · **Status:** pending · **Track:** Review
**Blocked by:** 07 (tests green)

## Overview
Reviewer agent (`/tkm:review-code`, role `code-reviewer.md`) reviews the full diff. `/tkm:audit-security` in parallel (new RPC + DB read touches data path).

## Review focus
- New migration: `list_recent_activity` `security definer` + grant scope correct; no privacy leak (recipient name public; sender anonymity preserved).
- No guessed visual values — every visual traces to a Figma node.
- File-size: all touched files ≤200 (`board-connected.tsx`, `board-spotlight-word-cloud.tsx` post-extraction).
- SSR guard in `use-fullscreen.ts`; pinned time formatter (no `toLocaleTimeString`).
- Realtime cleanup (`removeChannel`) present; no channel-name collision.
- i18n: new VN strings hardcoded intentionally (consistent, in scope per spec §7).

## Acceptance
- [ ] Review APPROVED (CRITICAL findings fixed; WARNINGS fixed or deferred with linked issue).
- [ ] Security audit clean on RPC/DB/realtime.
- [ ] Docs impact assessed (`docs/database-schema.md` += `list_recent_activity`; `docs/api-by-screen.md` board section).

## Open questions to resolve at review
- Multi-match search: keep best-match nav or add match-picker dropdown? (spec §8)
- Drop pan/zoom reset entirely now ⤢ = fullscreen, or keep an affordance? (spec §8)
