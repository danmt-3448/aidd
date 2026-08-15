---
title: UI · Prize
work_type: feature
track: A
status: planned
blockedBy: []
blocks: [15]
spec_source: momorph:zFYDgyj_pD
---

# Phase 09 — UI · Prize / Hệ thống giải (Track A)

**Goal:** Build the awards showcase UI from Figma via `momorph-implement-design` (hero banner +
left-nav 6 categories + right award cards icon/title/qty/prize + Kudos promo footer).

**Owns:** `src/features/awards/components/**`, `src/app/awards/**` (page shell + mock only).

**Out of scope (Track B / integration):** real `AWARDS` config source (phase 07), smooth-scroll +
active-menu wiring, hashtag anchor targets. Do NOT write i18n message files (phase-07 owns them). Figma mock content.

**Integration contract:** cards render from an `Award[]` prop
(`{ slug, title, icon, quantity, prize, hashtagAnchor }` — matches phase-07 `award-config.ts`).

## MoMorph refs:
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
