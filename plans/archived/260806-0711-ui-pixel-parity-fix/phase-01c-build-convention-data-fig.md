# Phase 01C — Build convention: `data-fig` + export asset thật

**Track:** Convention · **Priority:** HIGH (gate property-diff cần nhãn để map) · **Status:** pending · **blockedBy:** — (∥ 01/01B/02; chỉ sửa `fe-developer.md`)

## Vì sao

Property-diff (phase-01B) chỉ đo được element **có gắn nhãn** node. Không có convention thì gate không biết `<div class="cta">` ứng với node Figma nào → không so số được. Đồng thời phải chặn từ gốc thói quen build sai: thay icon thật bằng lucide, dựng wordmark bằng text (đúng thứ user than). `momorph-implement-design` là skill kit **global + gitignore** → không sửa cho team được; nên convention phải sống ở file committed: `.claude/roles/fe-developer.md` (mọi Track A subagent prepend role này).

## Thiết kế — convention gắn vào `fe-developer.md`

**1. Nhãn map element ↔ node (fix RT-2/scope: CAP để không phình):**
- `data-fig="{nodeId}"` — section root, text chính (heading/label/giá trị), card, button, input. `nodeId` lấy từ `get_node`/`get_frame_node_tree` khi build.
- `data-fig-asset="{tên}"` — logo, wordmark, artwork, ảnh minh hoạ (bất kỳ chỗ Figma là image fill / export).
- `data-fig-icon="{tên}"` + `data-fig-icon-exported="true"` — icon; attribute `-exported` là **lời cam kết SVG lấy từ `get_media_files`** (không phải lucide/vẽ tay). Thiếu attribute này khi Figma là custom icon = gate FAIL (xem phase-01B icon check).
- **CAP ~5–8 element/màn** — chỉ element **rủi ro cao nhất** (wordmark · CTA chính · text-node chủ đạo · icon brand · section-bg/height). KHÔNG gắn mọi `<div>`. Số tối thiểu (`--min-elements`) + danh sách chốt ở nodemap per-screen (phase-01B). Cap giữ chi phí get_node mỗi lần gate ở mức thấp.

**2. Asset thật, cấm dựng tay (đóng đinh lại — SKILL momorph đã có nhưng team hay quên):**
- Logo/wordmark/artwork Figma là image → `get_media_files`/`get_figma_image` export → **verify file là PNG/SVG thật** (không phải XML "AccessDenied", signed URL ~10 phút tải ngay) → lưu `/public` → render `<Image>`. **CẤM** `<h1>`+font.
- Icon Figma custom → export SVG thật, **render inline `<svg>` ưu tiên** (để gate đọc `fill/stroke`), set màu theo `get_node`, gắn `data-fig-icon-exported="true"`. Nếu buộc dùng `<img src=*.svg>` thì file phải parse được fill. **Lucide chỉ khi Figma đúng là icon phổ thông chuẩn** — và vẫn set màu từ node; icon custom mà thay lucide = FAIL (phase-01B).

**3. Màu/số từ node, không từ ảnh:** mọi giá trị visual (màu/weight/size/spacing/radius) đọc `get_node`, KHÔNG sample từ `get_frame_image` (ảnh nén, trên gradient → lệch). (Đã là rule `ui-first-gate.md` — nhắc lại ở role để subagent nhớ.)

## Files

**Sửa:**
- `.claude/roles/fe-developer.md` — thêm mục "## Data-fig & asset convention (BẮT BUỘC)" với 3 điểm trên + ví dụ ngắn. Nhắc: gate property-diff (`/aidd-ui-gate`) sẽ FAIL nếu asset dựng bằng text hoặc element trọng yếu không gắn `data-fig`.

**Ghi chú (không sửa được):**
- `momorph-implement-design` (kit global) — không vendor vào repo. Convention chỉ enforce qua `fe-developer.md` + gate. Nêu rõ giới hạn này trong role để không ai đi tìm sửa skill global.

## Steps

1. Thêm section convention vào `fe-developer.md` (ngắn, có ví dụ `data-fig`/`data-fig-asset` + 1 ví dụ export asset thật vs sai).
2. Kiểm chéo với `ui-first-gate.md` mục "CẤM TỰ CHẾ VISUAL VALUE" — không mâu thuẫn, chỉ bổ sung nhãn map.
3. Không đụng code màn ở phase này — việc gắn `data-fig` thực tế nằm ở từng per-screen phase (03–09) theo addendum `plan.md`.

## Success criteria

- [ ] `fe-developer.md` có mục convention: 3 nhãn `data-fig`/`data-fig-asset`/`data-fig-icon` + quy tắc asset thật + màu-từ-node
- [ ] Có ví dụ ĐÚNG vs SAI cho asset (`<Image src=export>` vs `<h1>KUDOS</h1>`)
- [ ] Nêu rõ momorph-implement-design là global, enforce qua role + gate
- [ ] Không mâu thuẫn với `ui-first-gate.md`

## Rủi ro

| Rủi ro | Đối phó |
|---|---|
| Subagent Track A dùng session riêng, có thể bỏ qua role | Gate property-diff (01B) là lưới bắt cuối: thiếu `data-fig` ở element trọng yếu → checklist per-screen FAIL. Convention + gate đi đôi. |
| Gắn `data-fig` lан tràn làm bẩn markup | Chỉ element trọng yếu; attribute thuần data-*, 0 ảnh hưởng style/a11y. |

## Next

Xong → per-screen phase (03–09) gắn `data-fig` theo addendum; gate 01B đo được.
