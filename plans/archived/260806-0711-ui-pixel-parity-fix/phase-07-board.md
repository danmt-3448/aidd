# Phase 07 — `/board` (Live board)

**Track:** A · **blockedBy:** 02, 04 · **Status:** ✅ PASS (2026-08-06; heights 525/548/3068 + 1280 spotlight overflow fixed — see summary report)

## MoMorph refs
- Sun* Kudos Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Figma node `2940:13431` · artboard **1440×5862** · app **1440×8622**
- Gate cũ: [run1](../reports/ui-gate/ui-gate-260805-board-fullpage.md) · [run3](../reports/ui-gate/ui-gate-260805-board-run3.md) · [run4](../reports/ui-gate/ui-gate-260805-board-run4.md) — FAIL 4 lần, mới nhất 23.33%
- **Phân tích Figma đã có, KHÔNG viết lại:** [260805-1117-board-highlight-spotlight-rework](../archived/260805-1117-board-highlight-spotlight-rework/plan.md) + `clarifications.md` + `Explore-260805-1135-*`

## Goal
Mọi band ≤1% @1440 + 1280 → PASS `/aidd-ui-gate /board`.

## Vấn đề gốc
App **8622px vs Figma 5862px — dư 2760px (47%)**. Đây không phải drift nhỏ: card/section cao sai tỉ lệ trên diện rộng. Band-diff sẽ chỉ ra section nào phình. Đã biết từ report cũ: **card height/density lệch**, **spotlight word-cloud render thành hàng ngang thay vì scatter cloud**.

## Đầu việc
1. Band manifest theo 5 khối Figma: kv-banner · highlight · spotlight · all-kudos(feed+sidebar) · footer.
2. Ưu tiên band phình nhất trước — 2760px dư nằm ở đâu thì sửa đó.
3. Spotlight: scatter cloud (x/y rải, size ∝ kudoCount), không phải flow rows.
4. **91 duplicate-key errors (hashtag render)** ở run4 → nhóm B FAIL. Phải hết sạch console error.
5. Re-gate 1440 + 1280.

## Out of scope
Shared chrome (phase-04) · BE/queries/realtime · `/kudos` modal (phase-08).

## Rủi ro
| Rủi ro | Đối phó |
|---|---|
| Màn nặng nhất (10 file supabase) — bug BE lẫn vào verdict | Chấm hoàn toàn qua `?ui_state=`, xác nhận 0 request Supabase trước khi chụp |
| Annotation Figma chứa spec behavior (*"Highlight chỉ hiện 1 KUDO ở Center"*) mà MoMorph crop mất | Đã có trong `clarifications.md` của plan 260805-1117 — đọc lại, thiếu thì hỏi user |
