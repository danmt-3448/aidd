# Phase 05 — UI-First Gate (`/aidd-ui-gate /board`)

**Context:** [ui-first-gate.md](../../.claude/rules/ui-first-gate.md) · [spec.md §5–§6](./spec.md)
**Priority:** P1 (hard gate) · **Status:** pending · **Track:** Gate
**Blocked by:** 01, 02, 03, 04 (all four workstreams built) · **Blocks:** 06, 07, 08

## Overview
HARD GATE. `/board` Spotlight must PASS before any integration, test code, or ship. Run `/aidd-ui-gate /board` — Playwright captures 1440 (primary) + 1280 (secondary) with authed session on **real seeded data** → property-diff vs Figma `2940:14174` + walk behavior checklist. 1920 no-break check.

## Precondition
- `npm run db:reset` (schema + seed:auth) → real seeded data; verify seed has ≥6 distinct kudos (spec §8) so feed shows 6 rows.
- Authed storageState `e2e/.auth/user.json` present.

## Gate criteria (both groups PASS)
**A. Visual (property-diff SỐ = hard gate, 1440 + 1280)**
- [ ] `style-assert.mjs` exit 0 — colors (rgba+alpha), font-weight/size, padding/gap, w/h, radius, border on `data-fig` elements match `get_node`.
- [ ] Nebula/constellation bg = real exported Figma asset (`<img>/<svg>`, not CSS-guessed).
- [ ] Highlight color, feed opacities, `NNN KUDOS` type, search pill — from `get_node`.
- [ ] 1920 no-break (no overflow, no clip/cut text, layout not distorted).

**B. Behavior (real seeded data, authed — 100%, no concession)**
- [ ] Feed = 6 real recipients, newest top, `hh:mmA` Asia/Saigon.
- [ ] New kudo INSERT → prepends live ~300ms.
- [ ] Typing highlights matches + dims others.
- [ ] Enter/magnifier + match → `/profile?id=<receiverId>`; empty → no-op; 0 matches → hint, no nav.
- [ ] ⤢ fullscreen; icon→collapse; ESC + collapse-click exit; refit no clip; pan/zoom works normal+fullscreen.
- [ ] `NNN KUDOS` = Σ kudoCount real data.
- [ ] 0 console error/warning.

## On result
- **PASS** → unblock 06 (integration). Save gate report to `plans/reports/`.
- **FAIL** → localize failing element/prop per `style-assert.mjs`, hand back to the owning Track-A/B phase, re-run gate. Do NOT proceed to integration/tests.

## Risks
- Behavior/interactive checks unverifiable on Turbopack dev headless (memory: hydration) → use prod build for behavior walk; property-diff still valid on dev.
- Empty/error/loading states not forceable without mock → document "not verifiable without scenario", not a hard-fail (spec, gate §B).
