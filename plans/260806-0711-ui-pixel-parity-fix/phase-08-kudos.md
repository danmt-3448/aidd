# Phase 08 — `/kudos` (modal Viết Kudo)

**Track:** A · **blockedBy:** 02, 07 · **Status:** pending

## MoMorph refs
- Viết Kudo: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Figma node `520:11602` · **1440×1024**
- Gate cũ: [ui-gate-260805-kudos.md](../reports/ui-gate/ui-gate-260805-kudos.md) — 15.4%

## Goal
Band modal ≤1% @1440 + 1280 → PASS `/aidd-ui-gate /kudos`.

## Vì sao chờ phase-07
`/kudos` redirect → `/board`, modal mở đè lên nền board. Report cũ phân tách 15.4% thành 3 nguồn: **(1) modal lệch dọc ~15–20px** (lỗi thật của màn này), (2) **nền board khác ref** (lỗi của `/board` — phase-07 sửa), (3) ref có 5 ảnh mẫu, app trống (đúng state compose ban đầu, không phải defect). Sửa trước phase-07 sẽ đo nhầm lỗi của người khác.

## Điểm nối gate (modal không có `*-connected.tsx`)
`/kudos` = `redirect('/board')`; modal `KudoComposeModal` do state `composeOpen` ở [board-screen.tsx:76](../../src/features/board/components/board-screen.tsx#L76) điều khiển (mở tại `:169`). Để `/aidd-ui-gate` mở được modal mà không click: phase-02 đã thêm init `composeOpen` từ query param (dev-only). Gate navigate `/board?ui_state=full&modal=compose` → modal tự mở trên nền mock board.

## Đầu việc
1. Band chỉ khoanh **vùng modal**, không lấy nền board (nền do phase-07 chịu).
2. Căn vị trí dọc modal theo `get_node(520:11602)` — lấy Y thật, không nhích mò.
3. Re-gate sau khi phase-07 PASS, dùng route `/board?ui_state=full&modal=compose`.

## Out of scope
Nền `/board` · BE/submit action · shared chrome.

## Rủi ro
Data-density khác ref (5 ảnh mẫu) là **đúng** với state compose ban đầu → đưa vào mask, không tính là defect. Ghi rõ mask trong report.
