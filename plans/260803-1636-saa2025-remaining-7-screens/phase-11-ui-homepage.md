---
title: UI · Homepage
work_type: feature
track: A
status: completed
blockedBy: []
blocks: [15]
spec_source: momorph:i87tDx10uM
---

# Phase 11 — UI · Homepage SAA (Track A)

**Goal:** Build the Homepage UI from Figma via `momorph-implement-design` (sticky header: logo, nav
About/Awards/Kudos, notif bell, lang switch VN/EN, account menu; hero "ROOT FURTHER" + countdown +
event details; 6-award card grid; Kudos promo; fixed widget; footer). Responsive 3→2→1 col.

**Owns:** `src/features/homepage/components/**`, `src/app/(home)/**` or `src/app/home/**` (page shell + mock only).

**Out of scope (Track B / integration):** countdown source (phase 02), notif bell badge count
(phase 03), auth-gated account menu + admin role, active-nav state, real `AWARDS` grid (phase 07),
card→Awards deep-link. Do NOT write i18n message files (phase-07 owns them). Use Figma mock values.

**Integration contract:** header accepts `{ unreadCount, user, isAdmin }`; hero accepts countdown
props (phase-02 shape); grid renders `Award[]` (phase-07 shape); card `onClick` → `/awards#{slug}`.

## MoMorph refs:
- Homepage SAA: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
