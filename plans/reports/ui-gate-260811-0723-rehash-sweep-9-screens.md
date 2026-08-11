# UI-First Gate — Re-gate confirmation sweep on HEAD (develop) — Summary

**Date:** 2026-08-11 · Branch: `develop` · HEAD `a45d822` · fileKey `9ypp4enmFmdK3YAFJLIu6C`
**Why:** confirm the 9 previously-PASS screens still hold after heavy UI churn since the 2026-08-06 reports
(profile-hero 206 LOC, board-kv-banner, countdown-display/led-block, homepage-hero, shared chrome…).
**Method:** headless capture harness `capture-code.mjs` refreshes the CODE half of each committed map from the
LIVE dev DOM (`--force-color-profile=srgb`, `fonts.ready`), keeps authoritative DESIGN (get_node), runs
`style-assert.mjs`. Property-diff @1440+1280 · overflow @1440/1280/1920 · 4-state render + console probe.
Nothing committed.

## Verdicts

| # | Screen | Route | Property-diff 1440 | 1280 | overflow 1920 | 4-state / console | Verdict |
|---|--------|-------|--------------------|------|---------------|-------------------|---------|
| 1 | Login | `/login` | exit 0 · 8 el · 37 chk | exit 0 | no overflow | static · 0 err | ✅ PASS |
| 2 | Homepage | `/` | exit 0 · 7 el | exit 0 | no overflow | renders · 0 err | ✅ PASS |
| 3 | Awards | `/awards` | exit 0 · 7 el | exit 0 | no overflow | static · 0 err | ✅ PASS |
| 4 | Rules | `/rules` | exit 0 · 6 el | exit 0 | no overflow | static · 0 err | ✅ PASS |
| 5 | Profile | `/profile` | exit 0 · 7 el | exit 0 | no overflow | 4 states differ · 0 err | ✅ PASS |
| 6 | Board | `/board` | exit 0 · 11 el · 14 chk | exit 0 | no overflow | 4 states differ · 0 err | ✅ PASS |
| 7 | Countdown | `/countdown` | exit 0 · 7 el · 16 chk | exit 0 | no overflow | full renders · 0 err | ✅ PASS |
| 8 | Viết Kudo (modal) | `/kudos` | — | — | no overflow | board-behind OK · 0 err | ⚠️ HELD |
| 9 | Secret box (modal) | `/secret-box` | n/a (mobile modal, no desktop map) | — | — | blank headless · 0 err | ⚠️ HELD |

**7/9 re-confirmed PASS on HEAD. 0 app console errors on any screen/state.** 2 modals HELD — see below.

## HELD (not regressions — headless hydration limit)
- **kudos + secret-box** are client modals. On Turbopack **dev headless** the modal never mounts:
  `/kudos?ui_state=full` renders the **board DOM** (33 board nodeIds, none of the modal's `520:*`);
  `/secret-box` renders 0 innerText. Property-diff + interactive for these needs the **prod-build**
  behavior pass (`next build && next start`) — matches the known Turbopack-headless-hydration limitation.
  Prior modal-fidelity reports (kudos 6 el/26 chk; secret-box modal PASS) stand as the last verified state.

## Gate-tooling fixes applied this session (NOT product code — product UI unchanged & correct)
The 7 PASS were reached after correcting **automation artifacts** in the re-gate harness, not the app:
1. **Nodemap schema variance** — hand-authored maps use 3 array names (`elements` / `nodes` / `entries`);
   harness now reads all three.
2. **Map-key ≠ nodemap-key** (board, countdown) — added `--selmap` key→selector overrides.
3. **Reused nodeId selector ambiguity** (board `3127:21871` appears 8×) — `querySelector`-first grabbed the
   highlight-carousel card (16px/24px) instead of the all-kudos feed card. Scoping the selector inside
   `[data-fig='2940:13482']` yields the real feed card = **24px/40px = exact design match**. Board code correct.
4. **Full-bleed root vs artboard height** (countdown `min-h-screen`) — root offsetHeight == viewport height
   (900→900, 1024→1024, 1400→1400). Measured at artboard height (900@1440, 800@1280) → exit 0. Not a regression.

## Artifacts
- Harness: `.claude/skills/aidd-ui-gate/scripts/capture-code.mjs` (new, reusable)
- Refreshed maps + reports: `/tmp/gate-out/*.{1440,1280}.json` + `*.report.txt`
- Overrides: `/tmp/gate-out/{board,countdown}.selmap.json`

## Open items
1. kudos + secret-box modal property-diff/interactive → run behavior pass on **prod build** (only place the
   modal hydrates); until then they stay at last-verified state.
2. Interactive clicks/validation/nav across ALL screens remain HELD on Turbopack dev headless (unchanged from
   2026-08-06). Property-diff + render + 4-state + 0-console ARE verified on HEAD.
3. Consider committing the scoped selectors + `--selmap`/`--vh` support back into the nodemap artifacts so the
   next re-gate is push-button (no per-run overrides).
