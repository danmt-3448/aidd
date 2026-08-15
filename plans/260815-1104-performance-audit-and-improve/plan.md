---
title: Performance Audit & Safe Improvement — Plan
status: approved
date: 2026-08-15
spec: ./spec.md
deploy_target: Vercel
risk_policy: config-only / high-safety (no business-logic or UI-behavior change)
constraints: no commit/push · before-after evidence · edit in place · tests+gate green
---

# Performance Audit & Safe Improvement — Plan

Executes the approved [spec.md](./spec.md). Every candidate is **independently gated**:
measure PRIMARY (Turbopack) bundle + its runtime/gate target → **keep only if it improves or is
justified-neutral (§12 of spec) AND passes its verify column**, else **revert that candidate**.

## Golden rules (from spec)
- **No `git commit` / `git push`.** Working tree only.
- **No business-logic / UI-behavior change.** Config, delivery, lazy-load of optional code only.
- **Bundle metric = Turbopack primary** (ships on Vercel); webpack only for analyzer composition.
- A candidate touching a screen's visuals (C3, C6a) is not done until `/aidd-ui-gate` re-passes.
- Revert-friendly: apply candidates in **small, isolated diffs** so any one can be backed out without touching others.

## Phases

| # | Phase | Goal | Candidates | Depends on |
|---|-------|------|-----------|------------|
| 01 | [Complete baseline](./phase-01-complete-baseline.md) | Capture the missing "before" evidence: Lighthouse (median≥3) + DB query timing | — | — |
| 02 | [Config + dead-dep](./phase-02-config-and-deaddep.md) | Lowest-risk wins first | C1, C2, C8 | 01 |
| 03 | [Asset & font delivery](./phase-03-asset-font.md) | LCP/render-block, gated on countdown | C3, C6a | 01 |
| 04 | [Board lazy-load](./phase-04-board-lazyload.md) | Trim /board initial JS, interaction-gated | C4, C5 | 01 |
| 05 | [Re-measure + full test + report](./phase-05-remeasure-test-report.md) | After-evidence, full unit+e2e, UI ok, write report | — | 02,03,04 |

Phases 02/03/04 are **independent** (different files, different candidates) — can run in any order or parallel,
but each must finish its own measure+verify before its candidates are considered kept. Phase 05 is the barrier.

## File ownership (no overlap between phases)
- **02:** `next.config.ts`, `package.json` (remove embla only)
- **03:** `src/app/globals.css`, `src/app/layout.tsx` (font preload), `src/features/countdown/components/countdown-screen.tsx`
- **04:** `src/features/board/components/board-spotlight-word-cloud.tsx`, `board-highlight-carousel.tsx` (+ their dynamic wrappers)
- **05:** evidence/report only (no src edits except reverts)

## Definition of done
1. `evidence/before/*` and `evidence/after/*` complete for bundle (Turbopack), build time, Lighthouse (median≥3), DB timing.
2. Per-candidate verdict recorded (kept / reverted / neutral-kept) with before→after→delta.
3. Full `npm run test` (vitest) + `npm run test:e2e` (playwright) green.
4. `/aidd-ui-gate` re-passed on any screen whose visuals could shift (countdown at minimum).
5. Final report `reports/performance-report.md` — includes the **compression-on-Vercel answer with numbers**.
6. No commit/push. Report notes Vercel-deploy validity of each kept change.

## Rollback
Each candidate is a small isolated diff. If phase 05 test/gate fails → `git diff` locate the offending
candidate → revert only that hunk → re-measure. Working tree stays clean of commits throughout.
