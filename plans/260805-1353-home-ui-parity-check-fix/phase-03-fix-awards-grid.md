---
title: "Fix Awards grid"
phase: 03
priority: MAJOR
status: pending
blockedBy: [01]
spec_source: momorph:i87tDx10uM
---

# Phase 03 — Fix Awards grid ("Hệ thống giải thưởng")

**Role:** fe-developer · **Skill:** `/momorph-implement-design` (fix mode) / `/tkm:fix-bug`.

**Goal:** Close drift rows owner=03 for the 6-award card grid section (eyebrow "Sun* annual awards
2025" + heading "Hệ thống giải thưởng" + 6 cards Top Talent…MVP + "Chi tiết" links), 3→2→1 responsive.

**Owns:** `homepage-awards-grid.tsx`, `homepage-award-card.tsx`.

## Requirements

- Fix per drift table: card artwork (ring/glow asset ảnh thật, không CSS-fake), card bg, title/desc
  typography, "Chi tiết →" link style, grid gap/columns, section heading + eyebrow.
- 3 cột @ 1440/1280 (desktop), layout không vỡ; card đủ nội dung như Figma.
- Award artwork = asset ảnh (verify PNG/SVG thật từ report), không dựng bằng gradient CSS nếu Figma là ảnh.
- Không guess value — dùng số node. Mục tiêu pixel-diff ≤ 1% (chỉ tha AA + mask động).
- Không đổi `AWARDS` data source / onClick behavior (visual-only).
- Compile: `npx tsc --noEmit`.

## Success criteria

- [ ] Mọi drift row owner=03 đã fix
- [ ] Grid 6 card pixel-diff ≤ 1% @ 1440 và @ 1280
- [ ] Card artwork render đúng asset
- [ ] `npx tsc --noEmit` sạch

## Todo

- [ ] Fix section heading + eyebrow
- [ ] Fix card artwork asset + bg
- [ ] Fix card title/desc/link typography
- [ ] Fix grid columns/gap
- [ ] tsc clean
