---
title: "Fix Kudos banner + Footer"
phase: 04
priority: MAJOR
status: pending
blockedBy: [01]
spec_source: momorph:i87tDx10uM
---

# Phase 04 — Fix Kudos banner + Footer

**Role:** fe-developer · **Skill:** `/momorph-implement-design` (fix mode) / `/tkm:fix-bug`.

**Goal:** Close drift rows owner=04 for the **Footer** section (logo + nav About/Award/Kudos/Tiêu
chuẩn chung + "Bản quyền thuộc về Sun* © 2025").

**Owns:** `homepage-footer.tsx`.

## ⚠️ Shared component boundary

`KudosPromo` ("Phong trào ghi nhận · Sun* Kudos" banner) lives at
`src/features/awards/components/kudos-promo.tsx` and is **shared** with `/awards`, owned by plan
`260804-1452-ui-parity-fixes` (A-06). **Do NOT edit it here.** If phase-01 flagged KudosPromo drift,
it stays a recorded/deferred item for the awards owner — this phase touches the footer only. Avoids a
file-ownership clash.

## Requirements

- Fix footer per drift table: logo asset, nav item spacing/typography, copyright text/position,
  background, full-width layout.
- Logo = asset ảnh thật, không dựng text.
- Không guess value — dùng số node. Mục tiêu pixel-diff ≤ 1% (chỉ tha AA + mask động).
- Compile: `npx tsc --noEmit`.

## Success criteria

- [ ] Mọi drift row owner=04 (footer) đã fix
- [ ] Footer pixel-diff ≤ 1% @ 1440 và @ 1280
- [ ] KudosPromo drift (nếu có) đã ghi defer sang awards owner, KHÔNG edit ở đây
- [ ] `npx tsc --noEmit` sạch

## Todo

- [ ] Fix footer logo asset
- [ ] Fix footer nav + copyright typography/spacing
- [ ] Confirm no edit to shared KudosPromo (defer note)
- [ ] tsc clean
