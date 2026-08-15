---
title: Event config + countdown source
work_type: feature
track: B
status: planned
blockedBy: [01]
blocks: [15]
spec_source: momorph:8PJQswPZmU
---

# Phase 02 — Event config + countdown source (Track B · logic)

## Context Links
- Recon: `plans/reports/check-progress-260803-1636-remaining-screens.md` (§3 Countdown, §6 Homepage)
- DB: phase-01 `event_config` table
- Clarifications: `plans/260803-1636-saa2025-remaining-7-screens/clarifications.md`

## Overview
- **Priority:** P1 · **Status:** done
- The single source of truth for the event-start datetime consumed by both Countdown (screen 3) and
  Homepage (screen 6). Server reads `event_config`, exposes it; client ticks per-second.

## Key Insights
- One config, two consumers → put the read in `src/features/event/event-actions.ts`, the tick logic
  in a pure util `src/lib/time/countdown.ts` (testable without a clock).
- TZ is Asia/Ho_Chi_Minh; store as `timestamptz` (absolute instant) — client computes remaining from
  `now()` vs target. No per-client TZ math needed.
- Graceful fallback: invalid/missing datetime → countdown renders `--:--:--`, nav stays locked (fail closed).

## Requirements
### Server action (`src/features/event/event-actions.ts`)
- `getEventConfig()`: returns `{ eventStartAt: string /*ISO*/, heartsSpecialMultiplier: number } | null`.
  Auth-guarded (Countdown is behind the route guard). Null on missing row → client fallback.

### Pure countdown util (`src/lib/time/countdown.ts`)
- `computeRemaining(targetIso: string, nowMs: number): { days, hours, minutes, seconds, done: boolean }`.
- Clamp negatives to 0; `done = true` when remaining ≤ 0 (unlocks nav).
- `isValidTarget(iso)`: guards the fallback path.

### Client hook (`src/features/event/use-countdown.ts`)
- Wraps `getEventConfig` (TanStack Query) + a `setInterval` per-second tick calling `computeRemaining`.
- Returns `{ days, hours, minutes, seconds, done, invalid }`. Cleans interval on unmount.

## Architecture — data flow
```
event_config row ──getEventConfig()──▶ eventStartAt(ISO) ──use-countdown──▶ per-second tick
   ──computeRemaining(target, Date.now())──▶ {d,h,m,s,done} ──▶ Countdown UI (08) + Homepage hero (11)
```

## Related Code Files
- **Create:** `src/features/event/event-actions.ts`, `src/features/event/use-countdown.ts`,
  `src/lib/time/countdown.ts`.
- **Modify:** none (page wiring is phase 15).
- **Delete:** none.

## Implementation Steps
1. `computeRemaining` + `isValidTarget` as pure functions (no Date.now inside — inject `nowMs`).
2. `getEventConfig` server action reading `event_config` (single row id=1).
3. `use-countdown` hook: query config, interval tick, cleanup, invalid fallback flag.

## Todo
- [x] `computeRemaining` pure util (clamp, done flag)
- [x] `isValidTarget` guard
- [x] `getEventConfig` server action
- [x] `use-countdown` hook (tick + cleanup + invalid)

## Success Criteria (binary)
- [ ] `computeRemaining('<past>', now)` returns all-zero + `done: true`.
- [ ] `computeRemaining('<invalid>', now)` → caller sees `invalid: true`, nav stays locked.
- [ ] Unit tests cover: future target, exact-zero, past target, invalid string.
- [ ] Interval is cleared on unmount (no leak — tested via hook teardown).

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| Clock drift / TZ confusion | Med | Med | Store timestamptz absolute; compute from Date.now() only |
| Missing config row | Low | Med | Null → fallback `--:--:--`, nav locked (fail closed) |
| Interval leak | Med | Low | Cleanup in hook; teardown test |

## Security Considerations
- Read-only; auth-guarded via route. No write path exposed to client.

## Next Steps
- Consumed by Countdown UI (08) + Homepage (11) in integration (15).

## MoMorph refs:
- Countdown: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
