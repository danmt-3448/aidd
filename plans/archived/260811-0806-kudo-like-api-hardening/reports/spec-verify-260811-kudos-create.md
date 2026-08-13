# Spec Verification — /kudos (create-kudo) — 8 SATISFIED · 1 VIOLATED · 1 ROBUSTNESS

**Date:** 2026-08-11 · screen `ihQ26W78P2` · focus `create-kudo` · mode `--static-only` (runtime pending Supabase start).
**Spec:** specs B/C/D/E/F/G/H + test cases ID-7..56.

| R# | Rule (spec src) | Code loc | Verdict | Bằng chứng | Fix |
|----|-----------------|----------|---------|-----------|-----|
| **R2** | Người nhận phải là **Sunner tồn tại** (spec B "must select a valid existing Sunner") | `kudo-schema.ts:27-29` + RPC `20260804010000` | **VIOLATED[static]** | Zod chỉ `regex(UUID)` — không check tồn tại; RPC không có check → receiver UUID-hợp-lệ-nhưng-không-tồn-tại → lỗi FK Postgres thô. | P04: RPC thêm P0007 receiver-exists |
| R1 | Người nhận required (B.2, ID-7/50) | `kudo-schema.ts:77` receiver required + H.2 disable | SATISFIED[static] | required + button disable | — |
| R3 | Nội dung required (D, ID-11/51) | `kudo-schema.ts:35-45` `.min(1)`+refine | SATISFIED[static] | — | — |
| R4 | Hashtag 1–5, required (E, ID-14/16/17) | `kudo-schema.ts:47-50` + RPC P0003 | SATISFIED[static] | min(1).max(5) + RPC guard | — |
| R5 | Image ≤5, optional (F, ID-18/20) | `kudo-schema.ts:52-54` + RPC P0005 | SATISFIED[static] | max(5) | — |
| R6 | Image chỉ jpg/png; pdf/mp4/txt invalid (ID-21..24/55) | `image-uploader.tsx:30,66,199` | SATISFIED[static] | ALLOWED_TYPES jpeg/png + file.type check + accept attr | — |
| R7 | Ẩn danh → mask sender (G, ID-43/44) | schema `is_anonymous`+`anonymous_name` + `kudos_public` view | SATISFIED[static] | mask ở view | — |
| R8 | Submit disable tới khi đủ required (H.2, ID-48/49) | client form (FE) | SATISFIED[static] | H.2 disable logic | — |
| R9 | Sanitize HTML server-side | `kudo-actions.ts:13-39` sanitize-html | SATISFIED[static] | allowlist | — |
| R-orphan | (không phải rule spec) ảnh upload trước, insert fail → mồ côi | `kudo-actions.ts` | ROBUSTNESS gap | không cleanup path | P04: cleanup on failure |

## Kết luận
Viết Kudo **chắc** — chỉ **1 VIOLATED (R2 receiver-exists)** + 1 robustness (orphan ảnh). Đúng khớp plan phase-04. Không phát sinh scope mới.
Runtime seal (khi Supabase up): `create_kudo(<uuid-không-tồn-tại>, ...)` kỳ vọng P0007 thân thiện, không FK thô.

## Cập nhật plan
Plan phase-04 chính xác, không cần đổi. create-kudo KHÔNG có bug ẩn ngoài R2 + orphan.
