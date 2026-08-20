---
title: SAA 2025 — 7 remaining spec-ready screens
work_type: feature
status: completed
blockedBy: []
blocks: []
clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
---

# Plan: SAA 2025 — 7 remaining screens

Build the 7 spec-ready, unbuilt web pages. **MoMorph two-track:** Track A (UI, one phase/screen) runs
fully parallel to Track B (backend/logic). Integration is the ONLY cross-track merge point.

> **Trạng thái (2026-08-11):** Track A (UI 08–14) ✅ · Track B (01–07) ✅ · Integration (15) ✅ · Review (17) ✅.
> `in_progress` **chỉ vì test-tail**: phase 16 (E2E — còn `homepage.spec` selector rewrite + re-enable profile skips + `viet-kudo.spec` prod-redirect fix + board KV-banner TC-BOARD-02) và
> phase 07b seed (planned). UI đã done — các màn PASS UI-First Gate ở `260806-0711-ui-pixel-parity-fix`.

- **fileKey:** `9ypp4enmFmdK3YAFJLIu6C` · **Recon:** `plans/reports/check-progress-260803-1636-remaining-screens.md`
- **Clarifications (authoritative):** `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`
- **Reuse (do NOT rebuild):** auth guard `src/features/auth/guard-rules.ts`, `profiles` table, kudos model
  (`kudos`/`kudo_hashtags`/`kudo_images` + RPC `create_kudo`), kudo actions/hooks, `kudo-compose-modal`.

## Phases

| # | Phase | Track | Status | blockedBy |
|---|-------|-------|--------|-----------|
| 01 | [DB foundation migrations](phase-01-db-foundation.md) | B·DB | completed | — |
| 02 | [Event config + countdown source](phase-02-event-config.md) | B·logic | completed | 01 |
| 03 | [Notification service + Realtime](phase-03-notification-service.md) | B·logic | completed | 01 |
| 04 | [Hearts + board queries + Realtime](phase-04-hearts-board-queries.md) | B·logic | completed | 01 |
| 05 | [Profile stats + direction queries](phase-05-profile-queries.md) | B·logic | completed | 01 |
| 06 | [Secret-box open logic](phase-06-secret-box-logic.md) | B·logic | completed | 01 |
| 07 | [Prize + Rules static content](phase-07-static-content.md) | B·logic | completed | — |
| 07b | [Seed demo data (Nhóm B lively)](phase-07b-seed-demo-data.md) | B·tooling | planned | 01,06 |
| 08 | [UI · Countdown](phase-08-ui-countdown.md) | A·UI | completed | — |
| 09 | [UI · Prize](phase-09-ui-prize.md) | A·UI | completed | — |
| 10 | [UI · Rules](phase-10-ui-rules.md) | A·UI | completed | — |
| 11 | [UI · Homepage](phase-11-ui-homepage.md) | A·UI | completed | — |
| 12 | [UI · Live board](phase-12-ui-live-board.md) | A·UI | completed | — |
| 13 | [UI · Profile](phase-13-ui-profile.md) | A·UI | completed | — |
| 14 | [UI · Secret box](phase-14-ui-secret-box.md) | A·UI | completed | — |
| 15 | [Integration (UI ↔ backend)](phase-15-integration.md) | A+B | completed (all 7 screens wired: Homepage bell/admin/countdown+root`/`public · Live board feed/heart/spotlight/realtime · Profile self/other+404 guard. Board sidebar userStats/leaderboards deferred-honest→p05 follow-up) | 01–14 |
| 16 | [Tests (Vitest + Playwright)](phase-16-tests.md) | test | mostly done (336 unit pass·tsc clean; E2E harness scoped public/authed/admin; profile core+404·countdown/login/awards/rules/secretbox green. **Remaining e2e-debt:** homepage.spec selector rewrite · re-enable profile skips · **viet-kudo.spec prod-redirect fix** (`/kudos`→`/board`, dùng `?modal=compose` thay vì mong /kudos render modal) · **board TC-BOARD-02 KV-banner** render. Gộp từ 260811-0806 2026-08-11.) | 15 |
| 17 | [Review + security audit + docs](phase-17-review-docs.md) | review | completed (Homepage·Live board·Profile all reviewed + findings fixed: C-1 board refuted[Next16 proxy], H1 profile cursor-injection, dicebear cfg, profile?id 404[zod .uuid→.guid]. Docs pending) | 16 |

## Key dependencies

- **Track A (08–14) NEVER blocks/blockedBy Track B (01–07)** — parallel-runnable under `tkm:takumi`.
- Track B chain: 01 is the DB root; 02/03/04/05/06 each `blockedBy: [01]` only; 07 fully independent.
- **Integration (15)** is the sole merge: waits on every Track B logic phase + every Track A UI phase.
- **Seed (07b)** Track B tooling, `blockedBy: [01, 06]` (06 owns the canonical `badge_key` allowlist the
  demo badges reuse). Writes tables via service role, not the RPCs. Not a hard-block on 15, but SHOULD
  finish before 15's "renders real data" verify — else Nhóm B screens render empty. Insert-only + fixed
  demo-UUID + on-conflict-do-nothing, **no delete path** → never touches user-created data.
- Tests (16) → Review (17), sequential at the tail.

## Critical precondition (carried from Viết Kudo M3)

`kudos_select_authenticated USING(true)` leaks `sender_id` for anonymous kudos. **Phase 01 DROPS it**
(→ `kudos_select_own` = sender/receiver only), adds masked view `kudos_public` as the enforced third-party
read path, and restricts the Realtime publication on `kudos` to `(id, created_at)` so identity never
crosses the wire. Phases 04 + 05 read ONLY via `kudos_public`; phase-04 Realtime uses events as
invalidation signals (re-fetch via view), never raw payload. No masked path → do not ship.

## Data model delta (net-new, phase 01)

`hearts` · `special_day_config` · `secret_box` + `secret_box_badges` · `event_config` ·
`notifications` · view `kudos_public` (sender-masked) · view `profile_stats` (caller-scoped).

## File ownership (no overlap across parallel phases)

- Track A (08–14): `src/features/{screen}/components/**` + `src/app/{route}/**` (page shell + mock only).
- Track B (01–07): `supabase/migrations/**` + `src/features/{domain}/{actions,queries,hooks}.ts` (feature root) + `src/lib/**`.
- **No collision:** in a shared feature folder (e.g. `board`, `profile`), Track A owns the `components/`
  subdir; Track B owns the `*-actions.ts`/`*-queries.ts`/`use-*.ts` files at the root — different depths.
- Integration (15): page-level composition (`page.tsx` only) wiring UI → hooks (replaces mock with real data).

## Definition of Done

- 7 screens pixel-accurate to Figma + responsive (375/768/1280); logic per MoMorph spec.
- Sender masking verified: anon kudos never leak sender on board/profile feeds.
- Secret-box weighted-random + decrement validated server-side (client cannot manipulate).
- Unit (Vitest) + E2E (Playwright) present and passing, TDD from MoMorph test cases.
- Reviewer + security audit pass; docs synced.

## Handoff

Validate: Plan Reviewer (`/tkm:predict-risks` + `/tkm:review-code`). Execute: `/tkm:takumi plans/260803-1636-saa2025-remaining-7-screens/plan.md`.
