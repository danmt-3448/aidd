---
title: UI · Live board
work_type: feature
track: A
status: planned
blockedBy: []
blocks: [15]
spec_source: momorph:MaZUn5xHXZ
---

# Phase 12 — UI · Sun* Kudos Live board (Track A)

**Goal:** Build the Live board UI from Figma via `momorph-implement-design` (KV banner → write-kudo
input → highlight carousel top-5 → all-kudos feed + spotlight word-cloud → sidebar stats/leaderboards;
heart button, copy-link, hashtag filter chips, avatar → profile). Dept filter DROPPED (phase-04: no data model).

**Owns:** `src/features/board/components/**`, `src/app/board/**` (page shell + mock only).
**Do NOT create data hooks/queries** — those are Track B (phase 04). **Do NOT create a kudo modal** — reuse `kudo-compose-modal`.

**Out of scope (Track B / integration):** heart toggle, ranking/feed/spotlight queries + Realtime
(phase 04), filter sync via `?hashtag` URL param, keyset pagination, avatar→profile nav. Do NOT write
i18n message files (phase-07 owns them). Figma mock kudos.

**Integration contract:** feed card props `{ id, senderName, senderAvatarUrl|null, receiverName,
receiverAvatarUrl|null, contentHtml, heartCount, likedByMe, createdAt }` (matches `kudos_public`, phase 04;
`senderId` masked null for anon); spotlight consumes `[{ receiverId, name, avatar, kudoCount }]`; `onToggleHeart(kudoId)`.

## MoMorph refs:
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
