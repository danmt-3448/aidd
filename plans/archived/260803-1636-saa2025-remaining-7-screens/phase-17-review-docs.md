---
title: Review + security audit + docs
work_type: feature
track: review
status: planned
blockedBy: [16]
blocks: []
spec_source: momorph:MaZUn5xHXZ
---

# Phase 17 — Review + security audit + docs

## Context Links
- All prior phases (01–16). Reviewer/audit/doc-writer roles per `CLAUDE.md` Step→Role→Skill table.
- Docs: `docs/database-schema.md`, `docs/system-architecture.md`, `docs/project-changelog.md`, `docs/development-roadmap.md`.

## Overview
- **Priority:** P1 · **Status:** planned
- Final gate: adversarial code review + focused security audit (auth/DB/storage changed → audit
  mandatory) + docs sync. Nothing ships until review is APPROVED.

## Requirements
### Code review (`/tkm:review-code`, reviewer)
- Review the full diff. CRITICAL findings must be fixed; WARNINGs fixed or deferred with a linked note.
- Verify file-size rule (<200 lines) — split kudos/board/profile components if they overran.

### Security audit (`/tkm:audit-security`, reviewer) — MANDATORY (auth/DB/storage touched)
- Re-verify the load-bearing invariants end-to-end:
  1. `kudos_public` masks anon sender everywhere board/profile read.
  2. Profile OTHER never returns sent feed; `profile_stats.sent` null for non-owner.
  3. `open_secret_box` outcome + count server-authoritative; client cannot forge.
  4. Notifications: no anon sender in title; no cross-user read/write.
  5. Hearts: 1/user/kudo, no self-heart.
  6. No PII (email/auth-id) in profile header or any feed payload.

### Docs sync (`/tkm:manage-docs` + `/tkm:audit-doc-parity`, doc-writer)
- `database-schema.md`: append hearts, special_day_config, secret_box(+badges), event_config,
  notifications, views kudos_public + profile_stats; resolve the M3 note (now handled).
- `system-architecture.md`: add Realtime channels (kudos/hearts/notifications), the two-track build shape.
- `project-changelog.md`: entry for the 7 screens shipped.
- `development-roadmap.md`: move these screens In Progress → Complete.

## Related Code Files
- **Modify:** `docs/**` (doc-writer). Fix-ups from review land in the file that owns each finding (dev roles).
- **Create/Delete:** none.

## Implementation Steps
1. `/tkm:review-code` full diff; loop fixes until APPROVED (max 2 rounds → escalate).
2. `/tkm:audit-security` against the 6 invariants; block on any CRITICAL.
3. Doc sync + parity audit.

## Todo
- [ ] Code review APPROVED (CRITICAL count = 0)
- [ ] Security audit passes all 6 invariants
- [ ] File-size rule holds (<200 lines) or split logged
- [ ] docs/ updated + parity audit clean

## Success Criteria (binary)
- [ ] Reviewer status = APPROVED (or APPROVED_WITH_CONDITIONS with all conditions met).
- [ ] Security audit: all 6 invariants verified, zero CRITICAL findings.
- [ ] `docs/database-schema.md` documents every new table/view; M3 note resolved.
- [ ] Changelog + roadmap reflect the shipped screens.

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| Anon-mask regression slips past review | Low | **High** | Dedicated audit invariant + phase-16 test as proof |
| Docs drift from code | Med | Low | `/tkm:audit-doc-parity` verifies parity |

## Security Considerations
- This phase is the final security gate — the 6 invariants are non-negotiable ship blockers.

## Next Steps
- APPROVED → hand to git-manager (`/tkm:git`) for commit/PR; deployer if go-live requested.

## MoMorph refs:
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
