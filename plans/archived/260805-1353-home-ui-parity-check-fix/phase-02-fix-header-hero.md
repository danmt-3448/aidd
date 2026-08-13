---
title: "Fix Header + Hero + shell layout"
phase: 02
priority: MAJOR
status: pending
blockedBy: [01]
spec_source: momorph:i87tDx10uM
---

# Phase 02 — Fix Header + Hero + shell layout

**Role:** fe-developer · **Skill:** `/momorph-implement-design` (fix mode) / `/tkm:fix-bug`.

**Goal:** Close all drift rows the audit assigned to this phase for the **Header**, **Hero
(keyvisual + countdown + event details + CTAs + FAB)**, and the **shell/layout container**.

**Owns:**
`homepage-header.tsx`, `homepage-account-menu.tsx`, `homepage-hero.tsx`,
`homepage-root-further-card.tsx`, `homepage-widget-fab.tsx`, `homepage-screen.tsx`.

## Requirements

- Fix per drift table (phase-01 report) — layout / màu / font / size / vị trí / asset mismatches.
- Logo/wordmark/keyvisual/artwork = **asset ảnh thật** (Image), CẤM dựng text/CSS/font.
- Không guess visual value — dùng số node từ report. Mục tiêu pixel-diff ≤ 1% (chỉ tha AA + mask động).
- Không đè/cắt chữ; giữ đúng full-width vs cột.
- Compile sau mỗi file: `npx tsc --noEmit`.
- Không đổi behavior/logic (visual-only) — giữ nguyên props, auth-gate FAB, countdown wiring.
- **Countdown flip-card:** chỉ sửa layout/style (kích thước card, số, nhãn NGÀY/GIỜ/PHÚT); KHÔNG động
  logic đếm / giá trị. Chấm hình qua mock `?ui_state=full`.

## Success criteria

- [ ] Mọi drift row owner=02 đã fix
- [ ] Header + Hero pixel-diff ≤ 1% @ 1440 và @ 1280 (no overflow ngang / vỡ layout)
- [ ] Asset ảnh render đúng (logo, keyvisual, countdown cards)
- [ ] `npx tsc --noEmit` sạch

## Todo

- [ ] Fix Header (logo/nav/bell/lang/account)
- [ ] Fix Hero keyvisual + wordmark asset
- [ ] Fix countdown flip-cards + event detail text
- [ ] Fix CTAs (About Awards / About Kudos) + FAB
- [ ] Fix shell container spacing/max-width
- [ ] tsc clean
