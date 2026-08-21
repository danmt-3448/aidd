---
title: "Spotlight Board — live activity feed, search-nav, fullscreen, visual fidelity"
description: "Fix 4 Spotlight gaps: realtime activity feed, search→profile nav, fullscreen, Figma nebula bg"
status: completed
priority: P2
effort: 12h
branch: develop
tags: [board, spotlight, realtime, ui-first-gate]
created: 2026-08-12
---

# Spotlight Board — Implementation Plan

> Spec (authoritative): [spec.md](./spec.md) · Clarifications: [clarifications.md](./clarifications.md)
> Screen: `/board` §B.7 Spotlight · MoMorph `MaZUn5xHXZ` · Figma node `2940:14174`
> All decisions, verified contracts, file-size ceilings live in spec.md — this file is the phase map only.

## Phases

| # | Phase | Track | Status | Blocks |
|---|-------|-------|--------|--------|
| 01 | [WS-1 Realtime activity feed (DB+query+hook+wire)](./phase-01-ws1-activity-feed.md) | B (backend/data) | pending | 05 |
| 02 | [WS-2 Search → Sunner profile](./phase-02-ws2-search-nav.md) | A (UI) | pending | 05 |
| 03 | [WS-3 Fullscreen (CSS scale refit)](./phase-03-ws3-fullscreen.md) | A (UI) | pending | 05 |
| 04 | [WS-4 Visual fidelity (nebula bg)](./phase-04-ws4-visual-fidelity.md) | A (UI) | pending | 05 |
| 05 | [UI-First Gate `/aidd-ui-gate /board`](./phase-05-ui-first-gate.md) | Gate | pending | 06 |
| 06 | [Integration (wire real data, full flow)](./phase-06-integration.md) | Int | pending | 07 |
| 07 | [Testing (Vitest + Playwright)](./phase-07-testing.md) | Test | pending | 08 |
| 08 | [Review (reviewer agent)](./phase-08-review.md) | Review | pending | — |

## Dependency graph

```
Track A: 02 (search-nav) ─┐
         03 (fullscreen) ─┤
         04 (visual bg)  ─┤   all 4 build in parallel, NO cross-block
Track B: 01 (activity)   ─┘
                          ↓
                    05  UI-First Gate  ← HARD GATE (must PASS)
                          ↓
                    06  Integration (wire real activity data, verify full flow)
                          ↓
                    07  Testing (Vitest + Playwright) ← no test-first before gate
                          ↓
                    08  Review
```

- **01–04 are parallel-runnable.** No `blocks`/`blockedBy` between Track A (02/03/04) and Track B (01) — file ownership is disjoint (see per-phase "Files").
- **05 blocks everything downstream.** Per `ui-first-gate.md`: no integration, no test code, no ship until `/aidd-ui-gate /board` returns PASS (1440+1280 property-diff exit 0 + behavior on real seeded data).
- **06 → 07 → 08** strictly sequential.

## Key decisions (see spec §1–§3 for full rationale)

- ⤢ = **Fullscreen** toggle, **plus a small pan/zoom reset button kept** (`handleReset` stays). Refit via **CSS scale wrapper** (decided), hook is **SSR-guarded**.
- Search resolver lives in **`board-spotlight.tsx`**; `BoardSpotlightSearch` gets `nodes` + `onSelect?: (receiverId)=>void`; **dropdown match-picker** (name+avatar, cap ~8, **portaled** past `overflow-hidden`); empty query = no dropdown; 0 matches = "Không tìm thấy Sunner" in dropdown; exact single match + Enter → direct nav.
- Activity feed = **6 recent kudos from `list_recent_activity` RPC + realtime prepend**. `time` = `hh:mmA` (no space), **pinned formatter**, TZ Asia/Saigon.
- **No guessed visual values** — nebula bg + all colors/opacity from `get_media_files`/`get_node`.
- **i18n out of scope** — new spotlight strings hardcoded VN (consistent with existing spotlight components).

## File-size guard (hard: every touched file ends ≤200 lines)

- `board-connected.tsx` = 219 (over) → extract ~20 lines during WS-1 wiring.
- `board-spotlight-word-cloud.tsx` = 202 (over) → extract ~20–30 lines during WS-2/WS-3 (leave headroom, not just clear 200).
- `board-spotlight.tsx` = 183 → WS-2 + WS-3 add ~27 lines → will exceed 200. **During Phase 03, extract the background image layer block (~lines 90–120, ~30 lines) out of `board-spotlight.tsx` into a new `src/features/board/components/board-spotlight-bg.tsx` client component**, so `board-spotlight.tsx` ends ≤200.
- `board-queries.ts` = 542 (pre-existing over) → **new `getRecentActivity` + keys land in `board-queries.ts` only if it does not grow; otherwise put activity query in the new `use-spotlight-activity.ts` colocated module.** Prefer keeping WS-1 query logic in a new file to avoid growing the already-oversized queries file.

## File ownership (parallel-safe, per spec §4)

- **01 (B):** migration, `use-spotlight-activity.ts`, `board-spotlight-activity.tsx`, `board-connected-helpers.ts`, activity query module. Touches `board-connected.tsx` (wire) + `board-types.ts` comment.
- **02 (A):** `board-spotlight-search.tsx`, `board-spotlight.tsx` (resolver), `board-spotlight-word-cloud.tsx` (highlight color).
- **03 (A):** `use-fullscreen.ts`, `board-spotlight.tsx` (ref), `board-spotlight-controls.tsx`, `board-spotlight-word-cloud.tsx` (scale).
- **04 (A):** spotlight bg layer assets, `data-fig` tags on measured elements.
- ⚠ **Shared-file note:** `board-spotlight.tsx` (02+03) and `board-spotlight-word-cloud.tsx` (02+03) are touched by two Track-A phases. If run by separate parallel agents, serialize 02→03 on these two files, or one agent owns both. Track B (01) never touches them → still parallel with A.
