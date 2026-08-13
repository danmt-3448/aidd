# Spec Verification — /board (Like) — 4 SATISFIED · 3 VIOLATED · 0 UNVERIFIED(clean)

**Date:** 2026-08-11 · screen `MaZUn5xHXZ` · focus `like` · mode `--static-only` (Docker down → no runtime SQL; runtime-provable rules flagged).
**Spec source (truth):** `C.4.1 Hearts` (specs, incl. databaseNote) + test cases `63645b03/91e102ba/31936b72/7a7ec63e/71b3ef43`.

## Verdicts — VIOLATED trước

| R# | Rule (spec src) | Code loc | Verdict | Bằng chứng (verifier / refuter) | Fix |
|----|-----------------|----------|---------|--------------------------------|-----|
| **R4** | Like ngày special-day → tài khoản **+2 tim** (C.4.1, TC 31936b72) | `profile_stats` view `20260731080000:18-20` | **VIOLATED** | `hearts_received = count(*)` — đếm phẳng. Refuter: special-day ×2 chỉ có trong `get_highlight_kudos` (carousel), KHÔNG vào hearts_received/sidebar D.1.4 → like special chỉ +1. | weighted sum `sum(case is_special_day then M else 1)`, M=2 (phase-02) |
| **R5** | Unlike → **thu hồi đúng 1 hoặc 2** (C.4.1 databaseNote) | `profile_stats:18-20` + `heart-actions.ts:117-131` | **VIOLATED** | Coupled R4: vì cộng phẳng +1, unlike xoá 1 row → luôn −1, không bao giờ −2. Không thể thu hồi 2 khi chưa từng cộng 2. | cùng fix R4 (query-time weighted → unlike auto-trừ đúng) |
| **R6** | Toggle like/unlike ổn định, tăng/giảm count (TC 7a7ec63e) | `heart-actions.ts:104-161`, `friendlyHeartError:31-41` | **VIOLATED** | Refuter: SELECT→INSERT/DELETE **không atomic**; double-click → 2 request cùng thấy trống → INSERT thứ 2 lỗi PK **23505**, mà `friendlyHeartError` **không map 23505** → báo generic sai. Comment ghi "idempotent" nhưng đường đi thực race. | `toggle_heart` RPC atomic (phase-01) |
| R1 | Mỗi user chỉ **1 tim/kudo** (TC 91e102ba) | `20260731030000:6-11` PK(user_id,kudo_id) | **SATISFIED** | PK đảm bảo tối đa 1 row/(user,kudo) — refuter không tạo được 2. (Race chỉ phá R6 toggle, không phá R1.) | — |
| R2 | Sender **không** like kudo của mình (TC 63645b03) | RLS `hearts_insert_own` `20260731030000:34-37` | **SATISFIED** (fragile) | RLS WITH CHECK `not exists(sender=auth.uid())` chặn insert. Refuter: chỉ RLS (không app-guard); **RPC security-definer phase-01 BYPASS RLS** → phải re-implement guard trong RPC (plan đã có P0008). | giữ + guard trong RPC |
| R3 | 1 like → tài khoản **+1 tim** (C.4.1) | `profile_stats:18-20` | **SATISFIED** (magnitude) *(⚠ ai nhận: xem flag)* | count(*) +1/heart đúng cho ngày thường. | — |
| R7 | Auth required để thả tim (TC 71b3ef43) | `heart-actions.ts:91-99` | **SATISFIED** | getUser guard, chưa login → chặn. | — |

## Runtime (chưa chạy — Docker down)
R4/R5/R6 **provable bằng SQL** nhưng static đã đủ chắc (đọc thẳng công thức + đường đi). Khi có Docker: `--runtime` để seal — insert special heart đọc `hearts_received` (kỳ vọng +2), gọi toggle 2× concurrent (kỳ vọng no-23505).

## Mâu thuẫn nội bộ SPEC (flag cho user — không tự quyết)
- **Ai được cộng tim: sender vs receiver?** C.4.1 có dòng ghi "tài khoản **gửi** +2" nhưng label D.1.4 "Số tim bạn **NHẬN** được" + databaseNote "người **nhận** kudo" + code hiện tại → **receiver**. Skill theo **receiver** (2/3 tín hiệu + code), nhưng cần user xác nhận vì đảo sender/receiver là thảm hoạ.

## Kết luận
**FAIL** (3 VIOLATED). Trùng khớp + tinh chỉnh chẩn đoán thủ công trước đó: R6 (race) + R4 (special-day đếm phẳng) đã biết; **R5 (unlike không thu hồi 2) là phát hiện MỚI** (coupled R4). R1 được làm rõ = SATISFIED (PK), race phá R6 chứ không phải R1. → Plan phase-01 (R6) + phase-02 (R4+R5) cover đủ. Không integrate/ship Like tới khi 3 VIOLATED fixed + re-verify (ưu tiên `--runtime`).
