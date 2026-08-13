---
title: "Audit — capture reference & drift table"
phase: 01
priority: CRITICAL
status: pending
blockedBy: []
spec_source: momorph:i87tDx10uM
---

# Phase 01 — Capture reference & audit drift

**Role:** code-reviewer · **Skill:** `/aidd-ui-gate` (visual portion) + MoMorph MCP + Playwright MCP.

**Goal:** Build the authoritative reference for Homepage and produce a per-section **drift table** at
1440 + 1280 that phases 02-04 fix against. Output = report (+ mock scaffold if missing, see step 0).

## Precondition — render độc lập BE (BẮT BUỘC)

Gate KHÔNG được phụ thuộc Supabase. Trước khi screenshot, bảo đảm `/` render bằng **mock data đầy đủ
density từ Figma** (`?ui_state=full`, dev-only). Nếu BE lỗi/down mà màn không render sạch → phải mock,
không được để trang lỗi/loading làm sai drift table.

## Steps

0. **Mock scaffold (nếu thiếu)** — homepage hiện chưa có mock fixtures / `?ui_state=`. Tạo theo
   `ui-first-gate.md`: `src/features/homepage/mocks/homepage.mock.ts` export `mockFull` (countdown demo
   values, unreadCount, user — nội dung/mật độ khớp Figma, KHÔNG bịa) + nhánh dev-only trong
   `homepage-connected.tsx` đọc `?ui_state=full` (chỉ khi `NODE_ENV !== 'production'`) → dùng mock thay
   real hooks. Đây là scaffold để chấm, không phải fix UI.

1. **MoMorph reference** — for screen `i87tDx10uM`:
   - `get_frame_image` (full frame) — the artboard render is CHÂN LÝ khi mâu thuẫn brief.
   - `get_frame` / `get_frame_node_tree` — section structure.
   - `get_node` / `query_component` for exact color / spacing / font-size / size values per section
     (KHÔNG guess — lấy số từ node).
   - `get_media_files` — verify logo/wordmark/keyvisual/award artwork là asset ảnh thật (PNG/SVG),
     không phải dựng text/CSS.
2. **Figma direct** — open Figma node `2167:9026` (figma MCP `get_screenshot` / `get_metadata`) to catch
   annotation/NOTE/callout cropped ngoài artboard mà MoMorph frame image mất. Figma vs MoMorph → Figma
   thắng. Ghi mỗi NOTE thành 1 dòng drift nếu build chưa phản ánh.
3. **Current build capture** — `npm run dev` (port 3001), Playwright MCP navigate `/?ui_state=full`:
   - Screenshot fullPage @ **1440** width, rồi @ **1280** width.
   - Chấm CẢ TRANG tới footer (không chỉ above-the-fold).
   - **Countdown = behavior:** chỉ chấm layout/style flip-card, KHÔNG log con số countdown thành drift.
4. **Diff (auto pixel-diff ≥ 99%)** — chạy `.claude/skills/aidd-ui-gate/scripts/pixel-diff.mjs`
   screenshot vs ảnh Figma reference cho 1440 + 1280 (align width, mask countdown/avatar, `--aa`). Ghi
   **ratio % tổng** mỗi viewport. Rồi soi vùng đỏ trên `-diff.png` + model-visual per section (Header /
   Hero+countdown / Awards grid / Kudos banner / Footer). For each mismatch record: section · viewport ·
   what's wrong (layout/màu/font/size/vị trí/asset) · reference value · **which fix phase owns it**
   (02/03/04). Mục tiêu sau fix: mỗi viewport ≤ 1% pixel-diff.
5. Mật độ nội dung: xác nhận mock data đủ dày như Figma (6 award cards đủ nội dung, countdown 3 block
   NGÀY/GIỜ/PHÚT, nav đủ item). Thưa data = drift visual.

## Output

- `plans/reports/reviewer-260805-home-ui-drift.md` — drift table grouped by fix phase (02/03/04),
  + reference asset list, + any Figma-only NOTE items, + KudosPromo drift (defer note if any).

## Success criteria

- [ ] Màn render độc lập BE qua `?ui_state=full` (mock scaffold tạo nếu thiếu)
- [ ] Reference captured từ MoMorph + Figma (không guess value nào)
- [ ] Current build screenshot @ 1440 + 1280 fullPage
- [ ] Drift table đầy đủ, mỗi dòng gán severity + owner phase (countdown value KHÔNG tính là drift)
- [ ] Report written to reports path

## Todo

- [ ] Mock scaffold homepage (`homepage.mock.ts` + `?ui_state=full`) nếu thiếu
- [ ] MoMorph frame image + node values
- [ ] Figma node 2167:9026 direct (annotations)
- [ ] Playwright screenshot 1440 + 1280 @ `?ui_state=full`
- [ ] Diff per section → drift table
- [ ] Write report
