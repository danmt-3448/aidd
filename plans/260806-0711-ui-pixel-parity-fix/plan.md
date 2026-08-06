---
title: "UI Pixel-Parity Fix — 11 màn đạt pixel-diff ≤1% vs Figma"
description: "Sửa thước đo (band-diff) trước, tách BE bằng mock fixtures, rồi fix UI từng màn tới ≤1%"
work_type: feature
spec_waived: "UI-parity FIX trên màn đã build; design source = MoMorph frames + Figma nodes (đã có). Không author spec feature mới."
status: pending
priority: P1
branch: develop
created: 2026-08-06
blockedBy: []
blocks:
  - 260804-1452-ui-parity-fixes
  - 260805-1353-home-ui-parity-check-fix
  - 260805-1117-board-highlight-spotlight-rework
---

# UI Pixel-Parity Fix — 11 màn

**Đích:** mọi màn có Figma reference đạt **pixel-diff ≤ 1% @1440 + 1280** + behavior mock 100% → PASS `/aidd-ui-gate`.

**Hai quyết định đã chốt (2026-08-06):**
1. **Sửa thước đo TRƯỚC.** Ratio toàn cục trên trang dài vô dụng — một lệch 40px ở y=800 đẩy toàn bộ phần dưới thành mismatch, sinh ra 15–25% giả. Bằng chứng: mọi màn 1-viewport PASS (countdown 0.39%, login 0.44%), mọi trang scroll dài FAIL 14.96–23.33%. Không có ngoại lệ.
2. **Tách BE khỏi UI bằng mock fixtures + `?ui_state=`.** BE đã wire 8/11 màn → bug BE làm hỏng verdict UI (đã xảy ra: 36× lỗi 500 realtime làm FAIL gate `/board`).

## Trạng thái xuất phát (từ `plans/reports/ui-gate/`)

| Màn | screenId | Figma node | Artboard | Gate | Supabase files |
|---|---|---|---|---|---|
| countdown | `8PJQswPZmU` | 2268:35127 | 1512×1077 | **PASS 0.39%** | 0 |
| login | `GzbNeVGJHz` | 662:14387 | 1440×1024 | **PASS 0.44%** | — |
| secret-box | `J3-4YFIpMM` | — | modal mobile | **PASS** | 1 |
| awards | `zFYDgyj_pD` | 313:8436 | 1440×6410 | FAIL 14.96% | **0** |
| kudos | `ihQ26W78P2` | 520:11602 | 1440×1024 | FAIL 15.4% | 7 |
| homepage | `i87tDx10uM` | 2167:9026 | 1512×4480 | FAIL 22.6% | 1 |
| board | `MaZUn5xHXZ` | 2940:13431 | 1440×5862 | FAIL 23.33% (×4) | 10 |
| profile | `3FoIx6ALVb` | 362:5037 | 1440×4660 | FAIL (app 1104px — thiếu data) | 2 |
| rules | `b1Filzi9i6` | 3204:6051 | 1440×1796 | FAIL — modal vs full-page, **cần user quyết** | 0 |
| notifications (dropdown) | `gWBVcaSVIf` | 589:9152 | — | chưa chấm — ref đã tìm ra 06/08 | 3 |
| notifications (page) | `6-1LRz3vqr` | 589:9132 | — | chưa chấm — ref đã tìm ra 06/08 | 3 |

## Phases

| # | Phase | Track | blockedBy |
|---|---|---|---|
| 01 | [Band-diff mode cho pixel-diff.mjs](phase-01-band-diff-tooling.md) | Tooling | — |
| 02 | [Mock-fixture infra dùng chung](phase-02-mock-fixture-infra.md) | Infra | — |
| 03 | [/awards — bàn hiệu chỉnh band-diff](phase-03-awards.md) | A | 01 |
| 04 | [Shared chrome (header/footer/card/tokens)](phase-04-shared-chrome.md) | A | 03 |
| 05 | [/homepage](phase-05-homepage.md) | A | 04 |
| 06 | [/profile](phase-06-profile.md) | A | 02, 04 |
| 07 | [/board](phase-07-board.md) | A | 02, 04 |
| 08 | [/kudos](phase-08-kudos.md) | A | 02, 07 |
| 09 | [/rules + /notifications — gỡ chặn](phase-09-rules-notifications.md) | A | quyết định user |
| 10 | [Re-gate toàn bộ + đóng](phase-10-final-sweep.md) | Verify | 03–09 |

**Song song:** 01 ∥ 02 (không chung file). Sau 04: 05 ∥ 06 ∥ 07 ∥ 09. 08 sau 07 (kudos modal nằm trên nền /board).

## Quan hệ với plan cũ

Ba plan pending dưới đây trùng scope nhưng viết TRƯỚC hai quyết định trên → **chờ plan này**, không chạy song song:
- `260804-1452-ui-parity-fixes` — 12 phase, chuẩn cũ (1280 pixel-perfect + 375/768). Phần data/config (B-01 dicebear, B-02 awards data) vẫn dùng được; phần UI đã lỗi thời.
- `260805-1353-home-ui-parity-check-fix` — bị phase-05 ở đây thay thế; phase file cũ dùng làm tham khảo.
- `260805-1117-board-highlight-spotlight-rework` — **phân tích Figma vẫn còn giá trị**, phase-07 tham chiếu chứ không viết lại.

## Ràng buộc

- Không guess visual value — số lấy từ MoMorph `get_node`/`query_component`. Vi phạm = FAIL gate (`.claude/rules/ui-first-gate.md`).
- **figma MCP chưa authorize** → annotation vẽ ngoài artboard phải nhờ user gửi ảnh. Xem `## Rủi ro` từng phase.
- Mỗi màn phải re-gate `/aidd-ui-gate` sau khi fix. Chưa PASS → cấm viết test, cấm ship.
- Không đụng BE/queries/schema. Track B chạy song song, không block.
- Edit tại chỗ; file >200 dòng thì tách khi đụng tới; `tsc --noEmit` sau mỗi file.
