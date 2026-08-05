---
title: UI · Profile
work_type: feature
track: A
status: completed
blockedBy: []
blocks: [15]
spec_source: momorph:3FoIx6ALVb
---

# Phase 13 — UI · Profile bản thân (Track A)

**Goal:** Build the dual-mode Profile UI from Figma via `momorph-implement-design`. SELF: hero
(avatar/name/dept/tier/stars) + 6 greyed badge slots + stats card + direction dropdown (received/sent)
+ feed. OTHER: same hero+badges + write-kudo bar + received-only feed.

**Owns:** `src/features/profile/components/**`, `src/app/profile/**` (page shell + mock only).
**Do NOT create data hooks/queries** — Track B (phase 05). **Reuse** `kudo-compose-modal` for the OTHER write-bar.

**Out of scope (Track B / integration):** stats/direction queries + UUID route validation (phase 05),
sent hidden for OTHER, anon masking, tier/stars gating (received≥10), heart toggle (phase 04).
Do NOT write i18n message files (phase-07 owns them). Badge slots = 6 greyed placeholders. Figma mock data.

**Integration contract:** header props `{ name, avatar, dept, title, tier, stars }`; stats props
`{ received, sent|null, hearts, boxesOpened, boxesRemaining }`; feed same card shape as board (phase 04);
`mode: 'self'|'other'` toggles write-bar + sent-dropdown visibility.

## MoMorph refs:
- Profile bản thân: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
