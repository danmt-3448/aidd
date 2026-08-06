---
title: "UI Parity Fixes — SAA 2025 built screens"
description: "Fix audited UI-parity drift across 9 built screens + unblock 3 crashing screens"
status: pending
priority: P1
effort: 17h
branch: develop
tags: [ui-parity, bugfix, responsive, i18n, supabase-config]
created: 2026-08-04
blockedBy: [260806-0711-ui-pixel-parity-fix]
---

# UI Parity Fixes

> **⚠️ Blocked / một phần đã lỗi thời (2026-08-06).** Plan này viết theo chuẩn cũ (**1280 pixel-perfect + responsive 375/768**);
> `.claude/rules/ui-first-gate.md` nay chấm **1440 (ưu tiên 1) + 1280**, BỎ 768/375, và đo bằng pixel-diff ≤1%.
> Các phase UI (05–09) bị `plans/260806-0711-ui-pixel-parity-fix/` thay thế.
> **Vẫn dùng được:** phase 01 (dicebear whitelist), 02 (awards data), 03 (secret-box counter), 04 (countdown i18n), 12 (danh_hieu migration) — thuộc Track B, không đụng UI.

Fix plan for UI-parity drift found in the audit. Source report:
`plans/reports/reviewer-260804-ui-parity-audit.md` (per-screen table + 1440 wide + inventory).

**This is a FIX plan** — the 9 screens are already built. Scope = close the audited gaps only.
UI = Figma source of truth (desktop 1280 pixel-perfect); logic = MoMorph spec.
fileKey `9ypp4enmFmdK3YAFJLIu6C`. Responsive test @ 375 / 768 / 1280 / 1440.

## Tracks

- **Track B** (data/config/i18n/migration) — foundation + content correctness. B-01 is CRITICAL
  (unblocks A-10). B-12 adds `danh_hieu` persistence (migration + RPC) — unblocks A-08's submit wiring.
- **Track A** (per-screen UI) — independent of Track B **except** A-10 re-audit (`blockedBy B-01`) and
  A-08's wire-into-submit step (`blockedBy B-12`). A-08's UI itself renders in parallel.
- **Verify** — final visual-diff pass across all screens.

Track A and Track B never share files → run in parallel when executed via `/tkm:takumi`.

## Phases

| # | Phase | Track | Priority | Status | blockedBy |
|---|---|---|---|---|---|
| 01 | [next/image dicebear whitelist](phase-01-config-dicebear-whitelist.md) | B | CRITICAL | pending | — |
| 02 | [Awards data correctness](phase-02-data-awards-config.md) | B | MAJOR | pending | — |
| 03 | [Secret-box counter data](phase-03-data-secretbox-counter.md) | B | MINOR | pending | — |
| 04 | [Countdown i18n labels](phase-04-i18n-countdown-labels.md) | B | MINOR | pending | — |
| 05 | [Shared max-width layout wrapper](phase-05-ui-shared-layout-wrapper.md) | A | MAJOR | pending | — |
| 06 | [Awards UI (2-col, badges, hero, nav)](phase-06-ui-awards.md) | A | MAJOR | pending | — |
| 07 | [Secret-box UI (overlay, counter, ×)](phase-07-ui-secretbox.md) | A | MAJOR | pending | — |
| 08 | [Kudos modal (Danh hiệu field, caps)](phase-08-ui-kudos.md) | A | MAJOR | pending | — (submit-wire step: 12) |
| 09 | [Login + Countdown UI polish](phase-09-ui-login-countdown.md) | A | MINOR | pending | — |
| 10 | [Re-audit 3 crashed screens](phase-10-reaudit-crashed-screens.md) | A | MAJOR | pending | 01 |
| 12 | [Danh hiệu persistence (migration + RPC)](phase-12-data-danh-hieu-migration.md) | B | MAJOR | pending | — |
| 11 | [Verify — visual-diff all screens](phase-11-verify-visual-diff.md) | Verify | — | pending | 01,02,03,04,05,06,07,08,09,10,12 |

## File-ownership map (no two parallel phases share a file)

- **B-01**: `next.config.ts`, `supabase/seed-auth-users.mjs`
- **B-02**: `src/features/awards/award-config.ts` (+ `.test.ts`)
- **B-03**: `src/features/secret-box/*actions*`, `supabase/seed.sql` (counter rows only)
- **B-04**: verify-only (reads `messages/*.json` + `countdown/**`; edits nothing)
- **B-12**: NEW `supabase/migrations/{ts}_add_danh_hieu_to_kudos.sql`, `src/features/kudos/kudo-actions.ts`,
  `src/features/kudos/hooks/use-create-kudo.ts` (submit-wire only — A-08 does not touch these)
- **A-05**: NEW `src/components/page-container.tsx` (create; phase-09 screens wire it; awards uses own cap)
- **A-06**: `src/features/awards/components/**`, `src/app/awards/page.tsx`, `public/awards/**` (own 1440 cap)
- **A-07**: `src/features/secret-box/components/**`
- **A-08**: `src/features/kudos/components/**`, `kudo-schema.ts` (+`.test.ts`) — NOT actions/hooks (B-12)
- **A-09**: `src/features/auth/components/**`, `src/features/countdown/components/**` (layout only; B-04 is verify-only so no shared-line risk)
- **A-10**: `src/features/{homepage,board,profile}/components/**` (post-B-01 diffs only)

> B-04/A-09 countdown split: B-04 is verify-only (asserts both locales' label strings, edits nothing); A-09 owns countdown **layout/responsive** only. No shared lines — see phase-04 & phase-09 contracts.

## Out-of-scope (DO NOT build here)

Unbuilt screens: Profile-người-khác, View Kudo, full Notifications page, Sửa bài viết, Error 403/404,
entire Admin area (9 screens). Dev-only routes `/dev-login`, `/todo` — do not touch.

## Definition of done

All 12 phases complete; no screen crashes; every built screen meets desktop parity @1280 and
does not break responsive @ 375/768/1440 vs MoMorph refs (`plans/reports/ui-audit/momorph/`).
