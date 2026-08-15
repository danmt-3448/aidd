---
title: UI · Secret box
work_type: feature
track: A
status: planned
blockedBy: []
blocks: [15]
spec_source: momorph:J3-4YFIpMM
---

# Phase 14 — UI · Open Secret Box (Track A)

**Goal:** Build the secret-box success modal UI from Figma via `momorph-implement-design` (title +
conditional guidance when unopened>0 + box image with badge + unopened counter; box clickable to open).

**Owns:** `src/features/secret-box/components/**`, `src/app/secret-box/**` (page shell + mock only).
**Do NOT implement open logic** — that is Track B (phase 06, server-authoritative RPC).

**Out of scope (Track B / integration):** entitlement + weighted-random badge + decrement (phase 06),
disable-at-zero, badge asset allowlist. Do NOT write i18n message files (phase-07 owns them). Figma mock values.

**Integration contract:** modal props `{ unopened: number, currentBadge: { key, imageSrc }|null,
isOpening: boolean }`; `onOpen()` callback (fires phase-06 `openSecretBox`); box disabled when
`unopened === 0` OR `isOpening` (spinner while RPC in flight).

## MoMorph refs:
- Open Secret Box: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/J3-4YFIpMM
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
