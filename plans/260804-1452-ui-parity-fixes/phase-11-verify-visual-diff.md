# Phase 11 — Verify: visual-diff all screens vs MoMorph refs

**Track:** Verify · **Priority:** — · **Status:** pending
**blockedBy:** phase-01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 12 (final gate)

## Context
- Final acceptance gate. Re-runs the audit across every built screen after all fixes land, confirming
  no regressions and full parity. Uses the existing harness — no new tooling.

## Requirements
- Functional: all 9 built screens captured at 375/768/1280/1440 and compared to MoMorph refs;
  no crash anywhere; desktop parity @1280; responsive intact.
- Non-functional: verification only — this phase fixes nothing itself. Any new diff it finds is routed
  back to the owning phase (re-open), not patched here (keeps ownership clean).

## Data flow
Built app → `e2e/audit-capture.mjs` (375/768/1280/1440) → compare to
`plans/reports/ui-audit/momorph/` → pass/fail table → sign-off report in `plans/reports/`.

## Related code files
- Read/run: `e2e/audit-capture.mjs`; refs `plans/reports/ui-audit/momorph/`.
- Create: `plans/reports/verify-260804-ui-parity-signoff.md` (pass/fail table per screen × breakpoint).
- Modify: NONE (verification-only; regressions route back to the owning phase).

## Screens to verify (9)
login · countdown · rules · awards · secret-box · kudos · homepage · board · profile.

## Implementation steps
1. Ensure all upstream phases complete; `npm run build` succeeds.
2. Run `e2e/audit-capture.mjs` for all 9 screens at 375/768/1280/1440.
3. Compare each capture to its MoMorph ref; record pass/fail in the sign-off table.
4. Confirm zero runtime/console errors on every screen (esp. former dicebear crashers).
5. Any fail → re-open the owning phase with the specific diff; re-verify after fix.
6. Write `plans/reports/verify-260804-ui-parity-signoff.md`.

## Todo
- [ ] Build succeeds
- [ ] Capture all 9 screens @ 375/768/1280/1440
- [ ] Pass/fail table vs refs
- [ ] Zero-crash confirmation across all screens
- [ ] Route any fail back to owning phase; re-verify
- [ ] Write sign-off report

## Acceptance criteria (binary)
- [ ] All 9 screens load with zero runtime/console errors at 375/768/1280/1440.
- [ ] Every screen meets desktop parity @1280 vs its MoMorph ref (marked PASS in the table).
- [ ] No screen shows overflow/clip/left-stretch at 375/768/1440.
- [ ] `plans/reports/verify-260804-ui-parity-signoff.md` exists with a full pass/fail matrix.
- [ ] No open (unrouted) failures remain.

## Risk assessment
- **Low.** Verification only. Risk: late-surfacing diff forces a phase re-open → mitigation: each UI
  phase already runs its own visual-diff loop, so this gate should mostly confirm.

## Security considerations
- Confirm no secret/token appears in captured screenshots before committing them.

## Next steps
- On full pass → hand to Testing (Step 2) / Review (Step 3) per primary-workflow, then ship.
