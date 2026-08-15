# Phase 02 — Test-case matrix (MoMorph → gap vs existing e2e)

**Priority:** High · **Owner:** test-writer · **Depends:** none · **Blocks:** 04

## Goal
Một ma trận per-screen: MoMorph TC (High + happy/error) ↔ đã cover bởi e2e/unit nào ↔ thiếu gì cần viết.

## Inputs (MoMorph test cases đã kéo/ cần kéo)
- Đã có (turn trước): board `MaZUn5xHXZ`(41) · profile `3FoIx6ALVb`(30) · secret-box `J3-4YFIpMM`(19) · homepage `i87tDx10uM`(62).
- **Cần kéo:** kudos `ihQ26W78P2` (+ `5c7PkAibyD` lỗi validate) — `download_test_cases` ở MAIN thread (MCP fail trong subagent — memory [[spec-verify-subagent-momorph-empty]]).

## Steps
1. Kéo kudos TCs còn thiếu (main thread).
2. Lọc mỗi màn: Priority=High + luồng happy + error/empty/edge + business-rule critical. Bỏ TC thuần GUI (để UI-gate lo).
3. Đọc e2e hiện có (`e2e/board.spec.ts` 226, `profile.spec.ts` 254, `homepage.spec.ts` 468, `viet-kudo.spec.ts` 673, `awards-rules-secret-box.spec.ts` 118 [secret-box]) → map TC→spec test đã có / thiếu.
4. Ghi ma trận `plans/.../reports/test-matrix.md`: cột `Screen | TC_ID | Rule | Covered by | Status(covered/gap/stale)`.
5. Đánh dấu **stale**: test cũ chưa cover profile V1/V2/V3 (FUN_007/014/GUI_006) + spec-verify runtime rules.

## Success criteria
- [ ] Ma trận đủ 5 màn, mỗi High/critical TC có trạng thái covered/gap/stale.
- [ ] Danh sách test cần VIẾT/ SỬA rõ ràng (feed phase-04).

## Risk
Kudos TC chưa kéo → phải lấy trước. E2E cũ có thể assert theo mock cũ, không phải data seed mới → đánh stale.
