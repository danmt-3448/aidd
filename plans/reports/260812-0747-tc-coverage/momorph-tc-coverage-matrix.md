# MoMorph Test-Case Coverage Matrix — AIDD SAA 2025

Date: 2026-08-12 · Branch: develop · fileKey: 9ypp4enmFmdK3YAFJLIu6C
Nguồn: `download_test_cases` (9 màn design-ready) × e2e spec titles + unit test inventory.

> Kết luận nhanh: **267 TC MoMorph tổng. Test tự động (unit+e2e) KHÔNG phủ hết.** Phủ tốt: Viết Kudo, Homepage, Countdown, Profile (self). Phủ MỎNG (nhiều behavior TC bỏ trống): **Board, Secret-box, Awards, Rules**, + **Profile security (SEC_001–004)**.

## Tổng quan (screen-level)

| Màn | TC MoMorph | E2E tests | Unit liên quan | Coverage định tính | Cụm TC CHƯA phủ (đáng lo) |
|-----|:---:|:---:|:---:|---|---|
| **Login** | 17 | 12 | login-screen, guard-rules | 🟡 Trung bình | Google OAuth flow thật (60bc/37ea/e76a — không tự động được), redirect authenticated (f62b) |
| **Viết Kudo** | 57 | 40 | kudo-schema, use-update-kudo, **use-kudo-image-cleanup** (mới) | 🟢 Tốt | multi-image 3/5/6 ẩn nút (ID-18/19/20), png accept (ID-22), required-field errors (ID-11/14/50/51/52), **orphan cleanup chỉ có unit hook mới — chưa có e2e** |
| **Homepage** | 62 | 42 | homepage-* (6 file), use-countdown | 🟢 Tốt | countdown invalid/ISO env (ID-56/57/60 → 1 phần unit), broken-links (ID-59), award hashtag-scroll (ID-47–52 một phần) |
| **Board** | 41 | 14 | board-queries, leaderboard, spotlight, feed-card, tier-badge | 🔴 **Mỏng** | **hashtag filter (0e56)**, **department filter (159f)**, spotlight pan/zoom + node hover/click (cac4/33ca), leaderboard hover preview (6b1e), **empty states (926d/d662/d035)**, **like business rules: cấm self-like (6364), 1-like/user (91e1), special-day +2 (3193)**, view-details nav (8c0d), gallery click full-size (f9b6) |
| **Awards (Hệ thống giải)** | 15 | 2 | award-config, awards-showcase | 🔴 **Mỏng** | menu scroll + active state (ID-9/10/11), Chi tiết nav (ID-12), error handling (ID-13/14). ⚠️ Spec route `/he-thong-giai` ≠ code `/awards` (drift) |
| **Countdown** | 17 | 5 | countdown, use-countdown, launch-gate | 🟢 Tốt (unit) | access-control theo session-expire (17aa) — e2e chỉ unauth redirect |
| **Rules (Thể lệ)** | 9 | 2 | rules-content | 🔴 **Mỏng** | scroll (FUN_001/002), close (FUN_003), **Viết KUDOS mở modal (FUN_004)**, disabled button (GUI_003/FUN_005), hover |
| **Profile** | 30 | 21 | profile-queries, profile-route, profile-hero | 🟡 Trung bình | **SEC_001 sent ẩn ở profile người khác (case quan trọng nhất)**, **SEC_002 anon riêng trong Sent**, **SEC_003 không lẫn user (cần 2 session)**, **SEC_004 không lộ email**, heart refusals (FUN_014), direction-switch discard (FUN_010), empty-per-direction (FUN_012), infinite-scroll (FUN_013), badge collection (GUI_002/003), sparse profile (GUI_009), i18n (GUI_008) |
| **Secret box** | 19 | 1 | secret-box-connected, secret-box-modal | 🔴 **Mỏng** | access-control (entitled/unauth/0-box 84a5), open flow click→badge+decrement (7c3c), disabled @0 (2a8a), **badge probability 30/25/10/5/20/10% (d566)**, invalid-badge fallback (43ba), **client-manipulation security (5cc0/2e7b)** |
| **TỔNG** | **267** | ~141 | 40 file unit | — | — |

## Nhận định

1. **"TC MoMorph đã test hết chưa?" → CHƯA.** Không có mapping 1:1; nhiều TID behavior/security bỏ trống, tập trung ở **Board (27/41 behavior chưa e2e), Secret-box (18/19 chưa e2e), Awards (13/15), Rules (7/9)**.
2. **Security-critical chưa phủ** (ưu tiên cao nếu ship): Profile `SEC_001–004` (lộ số kudo ẩn danh / email), Secret-box client-manipulation (5cc0/2e7b), Viết Kudo image orphan (vừa fix — chỉ có unit hook, chưa e2e).
3. **Phủ tốt** ở màn form-heavy (Viết Kudo 40 e2e map thẳng ID-*, Homepage 42) và logic thuần (Countdown qua unit).
4. **Spec-drift**: Awards route MoMorph `/he-thong-giai` vs code `/awards` — cần đối chiếu lại (có thể spec cũ).

## Unresolved / cần quyết
- Có build bộ e2e cho **Board behavior** (filters, empty, like-rules) + **Profile SEC_001–004** + **Secret-box open/security** không? Đây là phần "chưa test hết" rõ nhất.
- Nhiều TC là GUI-layout (thuộc phạm vi **UI-First Gate** property-diff, không nhất thiết e2e) — cần thống nhất: GUI-layout TC tính là "đã phủ bởi gate" hay phải có e2e riêng.
