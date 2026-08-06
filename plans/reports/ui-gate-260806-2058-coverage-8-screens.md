# UI-First Gate — Coverage of requested 8 screens — Summary

**Date:** 2026-08-06 · Branch: develop · Gate: property-diff @1440+1280 + **1920 no-break** (new). All PASS re-verified by orchestrator vs live `get_node` (real nodeId shape + spot-check + `style-assert` re-run). Nothing committed.

## Verdicts

| # | Requested screen | Route | Property-diff 1440/1280 | 1920 no-break | Behavior | Verdict |
|---|---|---|---|---|---|---|
| 1 | Login | `/login` | exit 0 · 8 el · 37 chk | PASS | validation + i18n (cookie) | ✅ **PASS** *(dropdown click HELD)* |
| 2 | Homepage SAA | `/` | exit 0 · 7 el · 26/24 | PASS (swept) | 4 states | ✅ PASS |
| 3 | Hệ thống giải (Awards) | `/awards` | exit 0 (genuine nodeIds) | PASS (swept) | — | ✅ PASS |
| 4 | Countdown Prelaunch | `/countdown` | exit 0 · 7 el · 16 chk | PASS | timer + states | ✅ **PASS** |
| 5 | Đa ngôn ngữ (VN/EN) | switcher | n/a (behavior) | n/a | VN↔EN swap OK (cookie) | ✅ verified *(click HELD)* |
| 6 | Sun* Kudos (Board) | `/board` | exit 0 · 11 el · 14 chk | **PASS (fixed)** | 4 states | ✅ PASS |
| 7 | Viết Kudos | `/kudos` | exit 0 · 6 el · 26 chk | PASS (swept) | modal + validation | ✅ PASS |
| 8 | Like Kudos | board feed | n/a (behavior) | n/a | render + liked/unliked states + counts | ✅ verified *(click HELD)* |

**1920 no-break sweep (done this session):** `/` (1905=1905, hero holds — ROOT FURTHER over dark-left), `/awards` (1905=1905, hero + capped content hold), `/kudos` (board behind 1905=1905; modal is centered fixed-width 752px → cannot overflow). Board was the only 1920 breakage (spotlight + KV banner) — fixed. All 8 clear at 1920.

**All 8 covered.** 5 screens property-diff PASS at 1440+1280; board additionally fixed for 1920; login + countdown newly gated under the 1920 rule; language-switch + like verified at render/state level.

## Skill update this session
- `ui-first-gate.md` + `SKILL.md`: added **1920 no-break** checkpoint (1440 primary; property-diff stays 1440/1280; 1920 asserts no overflow / no zoom / no axis-shift / no clipped text; "vỡ = FAIL"). Rationale: fixed-1440 artboards risk large-screen breakage the old gate never tested (board KV banner miss).
- `style-assert.mjs`: added per-side `border*Color` to `COLOR_PROPS` (now exercised by login footer border).
- `ui-gate-enforcer.cjs`: `slugOf("(feature: board)")` → `board` (was collapsing to `feature`).

## HELD / open items
1. **Interactive clicks unverifiable (all screens)** — Playwright headless doesn't hydrate React 19 + Next 16 Turbopack. Property-diff + render + 4-state + locale-via-cookie ARE verified; click/Escape/dropdown/like-toggle are code-correct but not automated. Fix: behavior pass on `next build && next start` (or `--no-turbo`).
2. ~~1920 re-check for homepage / awards / kudos~~ — **DONE this session, all PASS** (see sweep above). No large-screen breakage beyond the board banner (fixed).
3. Login footer 14px offsetHeight delta (line-height vs Figma text) — checked as style, padding/border match. Countdown font `DSEG7Classic` vs `Digital Numbers` (same 7-seg render). Both low-risk HELD.
4. notifications ×2 still BLOCKED (MoMorph node metadata not synced) — unchanged from prior report.
