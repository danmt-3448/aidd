---
title: "Home UI Parity Check & Fix — SAA 2025"
description: "Audit built Homepage (screen i87tDx10uM) vs MoMorph + Figma at 1440/1280 pixel-perfect ≥99%, then fix visual drift"
status: pending
priority: P1
effort: 9h
branch: develop
tags: [ui-parity, ui-first-gate, homepage, visual-fidelity, fix]
work_type: feature
spec_waived: "UI-parity FIX against existing built screen; reference = MoMorph frame i87tDx10uM + Figma node 2167:9026. No new feature spec authored."
created: 2026-08-05
blockedBy: [260806-0711-ui-pixel-parity-fix]
---

# Home UI Parity Check & Fix

> **⚠️ Blocked (2026-08-06).** Bị `plans/260806-0711-ui-pixel-parity-fix/phase-05-homepage.md` thay thế —
> plan mới đo bằng band-diff (per-section) thay vì ratio toàn cục. Phase file ở đây giữ làm tham khảo phân tích.

**FIX plan** — Homepage (`/`, screen `i87tDx10uM`) is already built (phase-11 of
`260803-1636-saa2025-remaining-7-screens`, status completed). This plan **re-audits its visual
fidelity** vs MoMorph frame + Figma at **pixel-perfect ≥ 99%**, then closes the drift. Scope decided
with user:

- **Visual-only** — chấm **pixel-perfect ≥ 99% (pixel-diff ≤ 1%)** ở **1440 (ưu tiên 1) + 1280 (ưu
  tiên 2)** bằng auto pixel-diff (pixelmatch vs ảnh Figma). KHÔNG chấm behavior/4-state lần này (user:
  "ưu tiên UI"). Chỉ tha anti-alias/subpixel + vùng mask động (countdown).
- **Reference** — MoMorph frame image + node values (màu/spacing/font/size, không guess) **+ đối chiếu
  Figma trực tiếp** cho annotation/NOTE crop ngoài artboard. Mâu thuẫn: ảnh render > brief; MoMorph vs
  Figma → **Figma thắng**. Theo `.claude/rules/ui-first-gate.md`.

## Mock-data-first — gate độc lập BE (BẮT BUỘC)

Homepage hiện wire thẳng real hooks (`useCountdown`, `useUnreadCount`) + server-component
`supabase.auth.getUser()` — **chưa có mock fixtures, chưa support `?ui_state=`**. Nếu BE/Supabase lỗi
hoặc down, `/` render trang lỗi/loading → screenshot audit sai. **Gate KHÔNG được phụ thuộc BE.**

→ Phase-01 phải bảo đảm màn render bằng **mock data đầy đủ density lấy từ Figma** (`?ui_state=full`,
dev-only), độc lập BE. Nếu homepage thiếu convention mock → **tạo** theo `ui-first-gate.md`:
`src/features/homepage/mocks/homepage.mock.ts` (export `mockFull` — nội dung/mật độ khớp Figma, KHÔNG
bịa) + nhánh dev-only đọc `?ui_state=` trong lớp connected. BE lỗi → mock đầy đủ để chấm UI, không block.

**MoMorph ref:** Homepage SAA — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
**Figma node:** `2167:9026` ("Homepage SAA") · fileKey `9ypp4enmFmdK3YAFJLIu6C`

## Sections (top→bottom, per `homepage-screen.tsx`)

1. Header (sticky) — logo, nav About/Awards/Kudos, notif bell, lang VN/EN, account menu
2. Hero — keyvisual "ROOT FURTHER" + countdown flip-cards + event details + CTAs + fixed FAB
3. Awards grid — "Hệ thống giải thưởng" 6-card (Top Talent … MVP), 3→2→1 responsive
4. Kudos promo — "Phong trào ghi nhận · Sun* Kudos" banner (shared `awards/components/kudos-promo`)
5. Footer — logo + nav + copyright

## Phases

| # | Phase | Priority | Status | blockedBy |
|---|---|---|---|---|
| 01 | [Capture reference & audit drift](phase-01-audit-reference-drift.md) | CRITICAL | pending | — |
| 02 | [Fix Header + Hero + shell layout](phase-02-fix-header-hero.md) | MAJOR | pending | 01 |
| 03 | [Fix Awards grid](phase-03-fix-awards-grid.md) | MAJOR | pending | 01 |
| 04 | [Fix Kudos banner + Footer](phase-04-fix-kudos-footer.md) | MAJOR | pending | 01 |
| 05 | [Verify — UI gate 1440 + 1280](phase-05-verify-gate.md) | CRITICAL | pending | 02,03,04 |

Phase 01 produces the drift table that phases 02-04 consume. 02/03/04 own disjoint files → run in
parallel via `/tkm:takumi`. Phase 05 is the closing visual-diff gate.

## File-ownership map (no two parallel phases share a file)

- **01 (audit + mock scaffold)**: writes report `plans/reports/reviewer-260805-home-ui-drift.md`;
  may CREATE `src/features/homepage/mocks/homepage.mock.ts` + dev-only `?ui_state=` branch in
  `homepage-connected.tsx` (mock scaffolding only — enables BE-independent render for the gate)
- **02**: `src/features/homepage/components/homepage-header.tsx`, `homepage-account-menu.tsx`,
  `homepage-hero.tsx`, `homepage-root-further-card.tsx`, `homepage-widget-fab.tsx`,
  `homepage-screen.tsx` (shell/layout container)
- **03**: `src/features/homepage/components/homepage-awards-grid.tsx`, `homepage-award-card.tsx`
- **04**: `src/features/homepage/components/homepage-footer.tsx`
  - ⚠️ `KudosPromo` (`src/features/awards/components/kudos-promo.tsx`) is **shared** with `/awards`
    (owned by plan `260804-1452-ui-parity-fixes` A-06). Phase 04 **does NOT edit it** — if drift found,
    record in the audit report and defer to the awards owner. Homepage phase touches footer only.

**Container-ownership rule (tránh clash song song):** Awards grid (P03) và Footer (P04) được compose
bên trong `homepage-screen.tsx` (owned by P02). Mọi drift ở **container / max-width / spacing wrapper
quanh section → owner = P02**, bất kể ảnh hưởng section nào. P03/P04 CHỈ sửa nội bộ component của mình,
không sờ `homepage-screen.tsx`.

## Key dependencies

- Requires `dev` server + MoMorph MCP + Playwright MCP for capture/screenshot.
- **BE-independent:** gate render qua mock (`?ui_state=full`), KHÔNG cần Supabase local up. BE lỗi →
  mock đầy đủ (xem "Mock-data-first" trên). Chỉ đụng code presentational + mock scaffold, không đổi DB.
- **Countdown value = behavior (out of scope):** screenshot hiện countdown "0 0 0 0 0 0". Chỉ chấm
  layout/style của flip-card, KHÔNG chấm con số. Mock `mockFull` set countdown về giá trị demo giống
  Figma để chấm hình, không phải để verify logic đếm.
- No cross-plan blocker: homepage/* files are not owned by any open plan
  (`260804-1452-ui-parity-fixes` owns awards/secretbox/kudos/auth/countdown, not homepage).

## Out of scope

- Behavior / 4-state (`?ui_state=`) / interactive / console-error checks — deferred (visual-only pass).
- Backend / integration / real-data wiring.
- Editing shared `KudosPromo` (awards-owned).
- Writing e2e/unit tests (test-after gate, per `ui-first-gate.md`).
