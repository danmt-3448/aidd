# UI-First Gate — /board (Sun* Kudos, MaZUn5xHXZ) — **FAIL (A) · PASS (B)**

260805 run3 · port 127.0.0.1:3001 · skill `/aidd-ui-gate board` · ref = momorph `get_frame_image(2940:13431)` (Figma artboard 1440×5862).

## A. Visual — pixel-diff (`scripts/pixel-diff.mjs`)
- **1440: pixel-diff = 24.60%** (similarity 75.40%) → **FAIL** (bar ≤1%). diff: `board-1440-diff.png`.
- 1280: skip (cùng nguyên nhân content).

**24.6% KHÔNG phải "layout sai 24%":**
1. **Density**: app mock **12 feed card** vs Figma artboard **4 card** → nửa dưới trang lệch hoàn toàn (~40% diện tích), không align được.
2. **Content ≠ Figma placeholder**: tên/avatar/word-cloud/ảnh khác hẳn → vùng data diff 100%.
3. **Scrollbar**: app 1425 (1440−15) → scale lệch ngang.
4. **Font** next/font ≠ raster Figma; chưa mask vùng động.
→ ≤1% vs Figma-export bất khả thi cho trang data-driven. Model-visual (mắt) suốt session: layout/section/màu/asset ~khớp Figma.

## B. Behavior (mock) — ✅ PASS
- 4 state `?ui_state=` (full/empty/error/loading) đúng · 0 app-error (10 lỗi = HMR sandbox).
- Interactive (hover/carousel/pan): không verify được ở sandbox (không hydrate).

## Verdict: FAIL A (24.6% > 1%) · PASS B — FAIL do PHƯƠNG PHÁP ĐO, không phải layout defect cụ thể.

## Quyết để gate A có nghĩa
1. **[Recommend] Golden-screenshot** baseline (bắt regression — đúng mục đích pixelmatch). `board-1440-actual.png` sẵn sàng làm baseline nếu duyệt.
2. Hoặc Figma-export ref + mock đúng content Figma + mask + nới threshold (~5-10%, do font).
