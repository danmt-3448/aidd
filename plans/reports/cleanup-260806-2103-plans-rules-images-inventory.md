# Repo Housekeeping Inventory — plans / reports / rules / skills / images

Date: 2026-08-06 · Scope: AIDD (Next.js) · Active plan `260806-0711-ui-pixel-parity-fix` untouched.

> ⚠️ **`rm` was NOT permitted in this session** — no files were deleted. All DELETE-ALLOWED items are
> confirmed-safe and listed with exact ready-to-run commands under "Recommend delete (ready commands)".
> Everything else is REPORT-ONLY per task rules.

---

## 1. Images / diagnostic screenshots

| Item | Status | Evidence | Action |
|---|---|---|---|
| `plans/reports/ui-gate/*.png` (18, ~13MB) | Superseded (old pixel-diff era) | New gate = property-diff (`_gate-ref/nodemap/*.json`). Active plan cites the `.md` reports for text, not PNGs. | 11 unreferenced → DELETE (see cmds); 7 embedded in referenced old `.md` → REPORT-ONLY |
| ↳ 11 UNREFERENCED: `board-audit-full`, `board-check-top`, `board-figma-ref`, `board-p2-top`, `board-p3-card`, `board-p3-full`, `board-p3-top`, `board-p4-banner`, `board-p4-footer`, `board-p4-full`, `profile-1440-actual` | UNUSED | `grep -rln <name> --include=*.md` → no hits | **DELETE** |
| ↳ 7 REFERENCED: `board-1440-actual`, `board-1440-diff`, `board-1440-fullpage`, `board-mock-full`, `board-mock-top`, `board-rework-full`, `board-rework-top` | UNUSED-but-embedded | Embedded only in old `ui-gate-260805-board*.md` (which the active plan links for their *conclusions*) | REPORT-ONLY — user decide (see note) |
| `plans/reports/ui-gate/_golden/*.png` (2) | UNUSED | No md/script/config reference (`board-1440.golden.png`, `board-1280.golden.png`) | **DELETE** |
| `plans/reports/ui-gate/stats-icons/*.png` (9) | UNUSED | No md reference for any of the 9 | **DELETE** |
| `plans/reports/ui-audit/momorph/*.png` (9) | **USED / KEEP** | Referenced by kept plan `260804-1452-ui-parity-fixes` + reviewer/researcher reports | KEEP (do not touch) |
| `plans/reports/_gate-ref/**` PNGs (~81MB) + `nodemap/*.json` | Mixed; **gitignored** (`.gitignore:78`) | `nodemap/` = CURRENT property-diff refs cited by active plan; PNGs = local scratch, not committed | KEEP nodemap; PNGs are gitignored scratch — optional local trim, REPORT-ONLY |
| `plans/board-rework-pass2/data/preview.png` + `media_files.json` | Plan-dir data | git-tracked; not referenced by active plan/docs | REPORT-ONLY (plan history) |

**Note on the 7 referenced PNGs:** the active plan links `ui-gate-260805-board-run3.md`, `-board.md`, `-fullpage.md`, `-run4.md`
for their *textual conclusions* (e.g. "FAIL do PHƯƠNG PHÁP ĐO"). Those `.md` embed these PNGs. Deleting the PNGs leaves
broken image embeds inside reports the active plan still points at. Conservative call: keep unless user OKs the broken embeds.

## 2. `.playwright-mcp/` (browser scratch)

| Item | Status | Evidence | Action |
|---|---|---|---|
| `.playwright-mcp/console-*.log` + `page-*.yml` (~114 files, ~2.6MB) | Temp scratch | **gitignored** (`.gitignore:74`); MCP session logs/snapshots, none referenced | **DELETE** (regenerated on next run) |

## 3. Empty directories

| Item | Status | Evidence | Action |
|---|---|---|---|
| `plans/reports/board-visual-fix/` | Empty, untracked | 0 files, 0 in git | **DELETE (rmdir)** |
| `plans/reports/_gate-ref/screenshots/` | Empty | 0 files (gitignored parent) | **DELETE (rmdir)** |
| `plans/reports/ui-audit/shots/` | Empty | 0 files | **DELETE (rmdir)** |
| `plans/260804-1703-error-screens/`, `260804-1713-notifications-ui/`, `260804-profile-ui/`, `260805-1714-login-fix/` | Empty plan scaffolds | 0 files, 0 git-tracked each | REPORT-ONLY (plans/* rule) — recommend rmdir; pure empty scaffolds, no user content |

## 4. Plan directories (REPORT-ONLY — user-owned, none deleted)

| Plan dir | Status | Evidence | Recommend |
|---|---|---|---|
| `260806-0711-ui-pixel-parity-fix` | **CURRENT / active** | Property-diff gate + 11-screen parity | KEEP — do not touch |
| `260804-1452-ui-parity-fixes` | Kept-by-user-decision | clarifications.md of active plan; still referenced (ui-audit PNGs) | KEEP (reference) |
| `260805-1353-home-ui-parity-check-fix` | Kept-by-user-decision | same | KEEP (reference) |
| `260805-1117-board-highlight-spotlight-rework` | Kept-by-user-decision | same | KEEP (reference) |
| `260730-1150-login` | Delivered (login shipped) | login feature live | Archive/mark completed |
| `260731-0836-viet-kudo` | Delivered + reviewed | plan.md "APPROVE-WITH-FIXES, đã fix hết" | Archive/mark completed |
| `260803-1636-saa2025-remaining-7-screens` | Delivered (7 screens) | 40 files, superseded by parity work | Archive/mark completed |
| `260804-1120-deploy-fe-be-free-production` | Delivered (deploy plan) | deploy report exists | Archive/mark completed |
| `260805-0729-saa2025-required-8-features` | Delivered | gap report `gap-260805-0729` | Archive/mark completed |
| `board-rework-pass2` | Orphan data-only (no plan.md) | 2 files, superseded by board-highlight-rework plan | Archive or fold into board plan |

## 5. Gate reports in `plans/reports/` (top-level + `ui-gate/`)

| Item | Status | Recommend |
|---|---|---|
| `ui-gate-260806-1850-*`, `-2058-*`, `-1934-*`, `-1922-feature-*` summaries | CURRENT (task-protected) | KEEP |
| Latest per-screen `ui-gate-260806-1740-*` (board/homepage-redo/kudos/profile/rules-notifications) | CURRENT | KEEP (latest per screen) |
| Older `ui-gate-260806-{0652,1009,1352,1407,1430,1616}-*` | Superseded by 1740/1850+ but distinct topics (header-overlay, modal-zindex, dogfood) | REPORT-ONLY — keep; no exact newer dup for same topic |
| `ui-gate/ui-gate-260805-board{,-fullpage,-run2,-run3,-run4,-visual}.md` (6 board runs) | OVERLAP — 6 runs of same screen, pixel-diff era | REPORT-ONLY: active plan cites run3/run4/fullpage/board → keep those 4; `run2` + `board-visual` are dup candidates, user decide |
| `ui-gate/ui-gate-260805-{awards,countdown,homepage,kudos,login,notifications,profile,rules,secret-box}.md` | Historical (old era) | REPORT-ONLY — keep as history; superseded by 260806 property-diff reports |
| `ui-gate/be-audit-260805-screens.md`, `board-figma-spec-brief.md` | Unique | KEEP |

## 6. `.claude/rules/` (REPORT-ONLY)

| File | Status | Note |
|---|---|---|
| `ui-first-gate.md` | CURRENT, UNIQUE | Intentional OVERRIDE of momorph-development + primary-workflow (by design) |
| `momorph/momorph-development.md`, `primary-workflow.md` | CURRENT | Overlap with ui-first-gate is intentional (cross-referenced, not redundant) |
| `development-rules.md`, `documentation-management.md`, `orchestration-protocol.md`, `team-coordination-rules.md`, `grill-loop-protocol.md`, `momorph/momorph-awareness.md` | CURRENT, UNIQUE | KEEP — no redundancy found |

**Verdict:** rules set is coherent; no outdated/orphan rule. No action.

## 7. Project skills (committed) (REPORT-ONLY)

| Skill | Status | Note |
|---|---|---|
| `.claude/skills/aidd-ui-gate/` | CURRENT | Property-diff gate tooling (style-assert.mjs, pixel-diff.mjs, hooks). SKILL.md:99 writes to `plans/reports/ui-gate-{date}-*.md` (flat) — consistent. KEEP |
| `.claude/skills/check-progress/` | CURRENT | KEEP |
| All other skills listed under `.claude/skills/` | Global kit (gitignored) | Out of scope — ignore per task |

## 8. `docs/` (REPORT-ONLY)

`code-standards.md`, `database-schema.md`, `development-roadmap.md`, `getting-started-guide.html`,
`performance-guidelines.md`, `project-changelog.md`, `system-architecture.md` — all standard doc set, no orphans/dupes.
Recommend a parity pass (`/tkm:audit-doc-parity`) after the current parity work lands, but no cleanup needed now.

---

## Deleted this run
**NONE** — `rm`/`rmdir` not permitted in this session. Nothing was removed.

## Recommend delete (ready commands — all verified safe: gitignored scratch OR unreferenced)
```bash
cd /Users/mai.thanh.dan/Desktop/Sun/AI/aidd
# playwright scratch (gitignored, regenerated)
rm -f .playwright-mcp/console-*.log .playwright-mcp/page-*.yml
# 11 unreferenced old pixel-diff diagnostics
rm -f plans/reports/ui-gate/{board-audit-full,board-check-top,board-figma-ref,board-p2-top,board-p3-card,board-p3-full,board-p3-top,board-p4-banner,board-p4-footer,board-p4-full,profile-1440-actual}.png
# golden + stats-icons (unreferenced)
rm -f plans/reports/ui-gate/_golden/*.png && rmdir plans/reports/ui-gate/_golden
rm -f plans/reports/ui-gate/stats-icons/*.png && rmdir plans/reports/ui-gate/stats-icons
# empty dirs
rmdir plans/reports/board-visual-fix plans/reports/_gate-ref/screenshots plans/reports/ui-audit/shots
```
Est. reclaim: ~2.6MB (playwright) + ~13MB (ui-gate PNGs) ≈ 15MB.

## Recommend user decide
1. **7 board PNGs embedded in referenced old reports** (`board-1440-actual/diff/fullpage`, `board-mock-full/top`, `board-rework-full/top`) — delete only if OK with broken embeds inside `ui-gate-260805-board*.md` that the active plan links for text.
2. **4 empty plan scaffolds** (`260804-1703-error-screens`, `260804-1713-notifications-ui`, `260804-profile-ui`, `260805-1714-login-fix`) — 0 files, untracked; `rmdir` them?
3. **Delivered plan dirs** (login, viet-kudo, remaining-7-screens, deploy, required-8-features, board-rework-pass2) → mark completed / move to `plans/_archive/`.
4. **Overlapping board gate reports** — `ui-gate-260805-board-run2.md` + `-board-visual.md` are dup candidates vs run3/run4.
5. **`_gate-ref/*.png` (~81MB, gitignored)** — local-only scratch; optional local trim (keep `nodemap/*.json`).

## Unresolved
- None. All delete candidates verified via grep against `*.md`/scripts/config; only the 7 referenced PNGs and plan-dir moves need a user call.

**Status:** DONE
Inventoried 5 domains; identified ~15MB safe-to-delete scratch/diagnostics (playwright logs + 11 unreferenced ui-gate PNGs + golden/stats-icons + 3 empty dirs) with ready commands — but could NOT execute (`rm` unpermitted). All plan dirs, rules, skills, docs left untouched with archive/keep recommendations.
