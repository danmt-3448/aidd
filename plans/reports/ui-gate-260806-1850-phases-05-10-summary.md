# UI-First Gate — Phases 05–10 Autonomous Run — Summary

**Date:** 2026-08-06 · Plan: `260806-0711-ui-pixel-parity-fix` · Branch: develop
**Run mode:** orchestrator + per-screen `implementer` subagents (fe-developer role), each claimed PASS **independently re-verified** by orchestrator (real nodeId shape + fresh `get_node` spot-check + `style-assert` re-run). Nothing committed — working tree left for review.

## Verdict per screen

| Phase | Screen | Property-diff @1440 | @1280 | Behavior (render+state) | Verdict | Verified vs live get_node |
|---|---|---|---|---|---|---|
| 05 | homepage | PASS (7 el, 26 chk) | PASS (24) | PASS | ✅ **PASS** | yes — `2167:9063` padding/radius/bg match |
| 06 | profile | PASS (7 el, 20) | PASS (20) | PASS | ✅ **PASS** | yes — `362:5055` 36/700/44 + fill match |
| 07 | board | PASS (11 el, 14) | PASS (14) | PASS | ✅ **PASS** | yes — `3127:21871`, heights 525/548/3068 |
| 08 | kudos | PASS (6 el, 26) | PASS (26) | render PASS; interactive HELD | ✅ **PASS** | yes — `520:11647` bg/radius/padding/gap match |
| 09 | rules (modal) | PASS (6 el, 28) | PASS (28) | PASS | ✅ **PASS** | yes — `3204:6052` bg/padding/width match |
| 09 | notifications-dropdown | — | — | render PASS | ⚠️ **BLOCKED/HELD** | n/a — MoMorph has no node metadata |
| 09 | notifications-page | — | — | render PASS | ⚠️ **BLOCKED/HELD** | n/a — MoMorph has no node metadata |

**5 of 7 screens genuinely PASS both viewports. 2 blocked on external MoMorph sync.**

## Key finding — phase-05 was a FALSE pass, now fixed
The pre-existing homepage gate (16:16 report) PASSED with a **circular map**: fabricated nodeIds (`hero-frame-523-coming-soon`, `mms_B3_Call-To-Action-1`) and `design` values sourced from code, not `get_node` — proving nothing (flagged in memory `ui-gate-subagent-momorph-provenance`). Redone with real nodeIds (`2167:9036`, `2167:9063`, `2167:9073`, `2167:9068`, `2788:12911`) + real `get_node` design values. Caught+fixed a genuine CTA bug (code `padding 12/16 fontSize~21` → design `16/24 fontSize 22`).

## Corrections the orchestrator made to subagent output
- **Board 1280 horizontal overflow (real FAIL the agent left HELD):** spotlight hardcoded `width:1157px` → page `scrollWidth 1301 > clientWidth 1265` at 1280. Fixed to responsive `width:100%; maxWidth:1157` (no fixed width > 50% viewport). Re-verified live: no overflow at 1280 (977px) or 1440 (1137px); height/border/radius intact. Dropped the exact-width property check (width is responsive; height 548 + border #998C5F + radius 47.14px remain the fidelity signals).
- **Board first fix-up agent went off-task** (rewrote CLAUDE.md instead of board heights) — re-dispatched with authoritative `get_node` values + hard scope limits. (The CLAUDE.md expansion it wrote — route map, tech-stack, mock-system docs — is accurate, so left in place.)
- **Un-did an unwanted commit:** the rules/notifications agent committed its 8 files despite "no commit"; `git reset --mixed HEAD~1` returned them to the working tree. HEAD unchanged at `6890759`.

## HELD / open items (need user or external action)
1. **notifications-dropdown (`gWBVcaSVIf`) + notifications-page (`6-1LRz3vqr`) property-diff BLOCKED** — MoMorph frames are `design_status: in_progress`; `get_node` returns "Frame metadata does not contain node style information". Behavior/render passes. **Unblock:** trigger MoMorph node sync for both frames, then build real-nodeId maps + `style-assert`. Not a code issue.
2. **Interactive behavior not automatable (all screens)** — Playwright headless against the **Turbopack** dev server does not hydrate (zero React fiber keys). Property-diff (SSR HTML + `getComputedStyle`) and 4-state render + 0-console-error + no-overflow ARE verified. But click/Escape/outside-close/form-validation interactions were verified by **code inspection only**, not live automation. **Fix:** run behavior gate against `next build && next start` (or `next dev --no-turbo`). Recommend a follow-up behavior pass before ship.
3. **board `body-box-radius` 12px** — inferred, not `get_node`-confirmed (passes gate). Low risk.
4. **`style-assert.mjs` tooling gap** — `borderTopColor`/side border colors not in `COLOR_PROPS` → string-compares `rgb` vs `rgba` and always mismatches cross-format. Agents dropped border-color checks (kept border-width). Upstream fix: add the 4 border-color props to `COLOR_PROPS`.

## Density note (cross-validated)
Figma kudo lists use **4 cards** (board all-kudos `2940:13482` = 3068px = 4×749 + 3×24; profile list = 4). Earlier trims to 6/12/22 were wrong; both now match Figma density.

## Next steps
- Trigger MoMorph node sync → gate the 2 notification screens.
- Production-build behavior pass (interactions) across all 5 passed screens.
- Then per UI-First Gate: integration (wire real BE) → test → review. **Nothing here is committed.**
