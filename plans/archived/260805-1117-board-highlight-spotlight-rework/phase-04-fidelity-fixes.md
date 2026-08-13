# Phase 04 — Fidelity fixes (gap nhỏ toàn page)

**Priority:** Medium · **Status:** ⏳ · **Track:** A
**Goal:** Dọn các mismatch nhỏ vs Figma/spec trên toàn page. Mỗi mục độc lập.

## MoMorph refs
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: plans/260805-1117-board-highlight-spotlight-rework/clarifications.md

## Checklist (mỗi mục = 1 fix)
- [ ] **KV banner height**: 420 → **512px** (Figma 2940:13432). Kiểm không vỡ responsive 768/375. — `board-kv-banner.tsx`
- [ ] **Search placeholder**: "Tìm kiếm profile Sunner" → **"Tìm kiếm sunner"** + thêm **`maxLength={100}`** (TC 9e689933; 101 ký tự chặn). — `board-write-kudo-trigger.tsx`
- [ ] **Footer**: thêm link **"Tiêu chuẩn chung"** (Figma 5 item: About SAA 2025 · Award Information · Sun* Kudos · Tiêu chuẩn chung · Bản quyền © 2025). — `homepage-footer.tsx`
- [ ] **Copy Link localize**: "Copy Link" → tiếng Việt qua next-intl (thống nhất VN/EN). Giữ toast "Link copied — ready to share!" theo TC 0adfd7ce (hoặc localize cả toast — xác nhận). — `board-feed-card.tsx` / atoms
- [ ] **EN flag**: thay emoji 🌐 bằng asset cờ EN (đối xứng cờ VN). — `site-header.tsx`
- [ ] **Hearts x2 badge**: "Số tim bạn nhận được" thêm badge **x2** (special-day multiplier, Figma `mms_D.1.4` group 435 + TC 31936b72). — `board-sidebar-stats.tsx`
- [ ] **Phòng ban dropdown vs chip**: Figma artboard + annotation = **dropdown** (CEVC2/3/4/1/OPD/Infra) giống Hashtag; verify impl (chip row?) → thống nhất dropdown nếu lệch. — `board-department-filter.tsx` / `board-filter-dropdown.tsx`

## Ràng buộc
- Mỗi fix nhỏ, không refactor lan man. File chạm mà >200d (site-header 246, feed-card 249) → tách nhẹ phần đụng.
- Không guess: height/asset/màu lấy từ Figma `get_node`/`get_design_context`.
- `tsc --noEmit` sạch sau mỗi file.

## Success
- Từng mục checklist done, đối chiếu Figma. Không vỡ layout 1440/768/375. 0 console error.
- Handoff: gate ở Phase 05.

## Out of scope
- Không đụng BE. Không viết test (Phase 05). Không rework carousel/spotlight/hover (phase 01–03).
