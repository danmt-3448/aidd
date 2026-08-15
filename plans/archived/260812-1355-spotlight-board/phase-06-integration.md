# Phase 06 — Integration (wire real data, verify full flow)

**Context:** [spec.md §9](./spec.md) · [primary-workflow.md](../../.claude/rules/primary-workflow.md)
**Priority:** P2 · **Status:** pending · **Track:** Integration
**Blocked by:** 05 (gate PASS) · **Blocks:** 07

## Overview
Only after `/aidd-ui-gate /board` PASS. WS-1 already wires real activity in build (Track B is real data, not mock), so integration here = verify the full cross-track flow end-to-end on real seeded data and confirm no regressions where Track A + Track B meet in `board-spotlight.tsx` / `board-connected.tsx`.

## Steps
1. `npm run db:reset` → authed session.
2. Verify full flow on `/board`: feed populates (6 rows) + realtime prepend; search-nav → profile; fullscreen toggle + refit + ESC; nebula bg renders.
3. Confirm shared files (`board-spotlight.tsx`, `board-spotlight-word-cloud.tsx`) merged cleanly from 02+03 — no prop/ref conflict, both end ≤200.
4. `board-connected.tsx` ends ≤200 (WS-1 extraction landed).
5. `npx tsc --noEmit` clean; `npm run lint` clean.

## Acceptance
- [ ] Every spec §5 behavior row passes on real seeded data, authed.
- [ ] No console error/warning across the full flow.
- [ ] All touched files ≤200 lines.
- [ ] `tsc --noEmit` + lint clean.

## Risks
- Merge conflict on shared Track-A files if 02/03 ran as separate agents → serialize or single-owner (see plan.md ownership note).
- Realtime channel name collision (`spotlight-activity-realtime` vs `board-feed-realtime`) — distinct names, verify both subscribe.
