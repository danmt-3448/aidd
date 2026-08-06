# Dogfood — property-diff gate trên UI thật /awards — 2026-08-06

Nghiệm thu engine gate mới (`style-assert.mjs`) trên **UI đang render thật** (`/awards?ui_state=full` @1440, port 3001) + **design thật MoMorph** (`get_node`/`query_component`, screenId `zFYDgyj_pD`). KHÔNG dựa giá trị trong plan.

## Element chấm: H1 "Hệ thống giải thưởng SAA 2025" — node `313:8457` (TEXT)

| prop | code (getComputedStyle) | design (MoMorph node) | verdict |
|---|---|---|---|
| color | rgb(255,234,158) | rgba(255,234,158,1) | ✅ PASS |
| fontWeight | 700 | 700 | ✅ PASS |
| fontSize | 57px | 57px | ✅ PASS |
| letterSpacing | -0.25px | -0.25px | ✅ PASS |
| **lineHeight** | **68.4px** | **64px** | ❌ **FAIL (Δ4.4px)** |

→ `style-assert` exit 1, localize đúng node+prop. 4 prop khớp KHÔNG bị false-fail.

## Kết quả nghiệm thu (3 path, đều trên data thật)
- **PASS path** (prop khớp) → exit 0 ✅
- **FAIL thật** (lineHeight 68.4 vs 64) → exit 1, chỉ đúng element/prop ✅
- **Color defect** (giả rgb(227,6,19) vs #FFEA9E) → exit 1 ✅ (bắt đúng lỗi user than #1)

→ Gate bắt được lỗi **mắt + pixel-diff toàn trang không thấy** (lệch line-height 4.4px vô hình).

## Bug THẬT phát hiện (đưa vào phase-03 /awards)
1. **H1 title `line-height` 68.4px thay vì 64px** — code để leading mặc định (57×1.2). Fix: set `leading-[64px]` cho H1 title. (Áp cho mọi H2 giải thưởng nếu cùng lỗi.)
2. **6–7 console error** trên `/awards?ui_state=full` — vi phạm nhóm B (0 console error). Cần điều tra ở phase-03.

## Ghi chú
- MoMorph biểu diễn màu text ở field `backgroundColor` của node TEXT → design.color lấy từ đó.
- Chưa gắn `data-fig` (hasDataFig=0) → dogfood build map thủ công 1 element; per-screen phase sẽ gắn nhãn + nodemap đầy đủ.
- `--force-color-profile=srgb` chưa set trong phiên Playwright MCP này (màu vẫn khớp tuyệt đối vì #FFEA9E là sRGB thuần) — cần set khi chạy gate chính thức.

## Verdict: engine + pipeline property-diff — WORKS (nghiệm thu PASS)
