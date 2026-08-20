---
status: cancelled
superseded_by: 260806-0711-ui-pixel-parity-fix
blockedBy: [260806-0711-ui-pixel-parity-fix]
---

# Plan — Board /board full-page rework (Sun* Kudos)

> **✅ Superseded (2026-08-11).** `/board` đã build lại + PASS gate ở `260806-0711-ui-pixel-parity-fix`
> phase-07 (property-diff exit 0 @1440+1280 + 1920 no-break fix). Plan này khép — giữ làm tham khảo phân tích.
> **Phân tích Figma + `clarifications.md` ở plan này VẪN CÒN GIÁ TRỊ** — phase-07 của plan mới tham chiếu, không viết lại.

**Screen:** Sun* Kudos (Live board) · MoMorph `MaZUn5xHXZ` · route `/board` · Figma frame 2940:13431
**Track:** A only (UI + behavior mock). BE/data đã wire sẵn — plan này KHÔNG đụng BE/queries.
**Đích:** Toàn bộ page đúng Figma (~95% @1440) + behavior đúng spec (gồm interactive states từ Figma annotation) → PASS `/aidd-ui-gate /board`.
**Nguồn:** MoMorph frame image + test_cases + Figma trực tiếp (metadata + motion + ảnh annotation user gửi) + audit code (Explore ×2). Chi tiết: `clarifications.md`, reports `Explore-260805-1135-*`.

## Nguyên tắc
- Không animation bắt buộc (Figma motion rỗng) — micro-interaction nhẹ do mình chọn.
- Không guess visual — số từ MoMorph `get_node` / Figma `get_design_context`. Mock density dày như Figma.
- Edit tại chỗ; file >200d tách khi đụng (site-header 246, highlight-carousel 221, feed-card 249). `tsc --noEmit` sau mỗi file.
- Không viết/sửa test code cho tới khi PASS gate (UI-First).

## Phases

| # | Phase | Quy mô | File | Song song |
|---|---|---|---|---|
| 01 | Highlight carousel 3-up (Embla) | Lớn | [phase-01-highlight-carousel.md](phase-01-highlight-carousel.md) | ✅ |
| 02 | Spotlight pan/zoom + search + tooltip | Lớn | [phase-02-spotlight-board.md](phase-02-spotlight-board.md) | ✅ |
| 03 | Hover states — avatar popover + tier tooltip | Vừa | [phase-03-hover-states.md](phase-03-hover-states.md) | ✅ |
| 04 | Fidelity fixes (banner/search/footer/i18n/badge) | Nhỏ ×N | [phase-04-fidelity-fixes.md](phase-04-fidelity-fixes.md) | ✅ |
| 05 | Gate + đóng | — | (dưới) | sau 01–04 |

Phase 01–04 **không chung file** (trừ feed-card ở 03+04 — điều phối tuần tự nếu cần) → chạy song song bằng nhiều implementer.

## Phase 05 — Gate + đóng (sau 01–04)
1. Dựng render được: start supabase local + `npm run seed:auth` → login user seed (nguyen.van.an@sun-asterisk.com / TestPass123!) HOẶC dùng `?ui_state=`.
2. `/aidd-ui-gate /board` — visual 1440 ~95% (full-page tới footer) + behavior mock: carousel center+peek, spotlight pan/zoom/search/tooltip, hover popover/tooltip, 4 dropdown, 4 state `?ui_state=`. PASS mới đi tiếp.
3. Re-run + cập nhật unit test board theo hành vi mới (CHỈ sau gate PASS).
4. `reviewer` review diff → `/tkm:git` commit + `/tkm:manage-docs` nếu cần.

## Out of scope (cả plan)
- BE / server actions / queries / schema. Chỉ presentational + client behavior + mock fixtures.
- Các màn khác ngoài /board.
