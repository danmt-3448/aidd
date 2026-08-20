## Summary

<!-- What changed & why — 1-3 lines -->

## Traceability

- **Plan:** <!-- plans/<slug>/ — the work-unit anchor for this PR (personal project has no ticket tracker) -->
- **Evidence:** <!-- plans/<slug>/evidence/ or plans/<slug>/reports/ path, if any -->
- **Session/commits:** <!-- commits carry `Plan: <slug>` trailer (commit-msg hook nudges this) -->

## Checklist

- [ ] UI-First Gate PASS — ran `/aidd-ui-gate` if this touches a screen (1440 + 1280 property-diff + behavior on real seeded data)
- [ ] Tests pass — `npm run test` (+ `npm run test:e2e` when flows changed)
- [ ] Docs synced — ran `npm run docs:sync` if code with docs was touched (no drift)
- [ ] No secrets committed (`.env*`, `.mcp.json`, credentials)
- [ ] Commits scoped + conventional (`feat:`/`fix:`/`chore:`…), no AI references
