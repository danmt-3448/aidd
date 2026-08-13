# Phase 06 — Integration (Track A + B)

**Track:** A+B · **Depends:** 01, 05

## Context
Gắn UI modal (phase 01) với data thật (hooks phase 05). Thay mock Figma bằng API thật. Đây là điểm hợp nhất — không có blocking merge, integrate khi cả 01 và 05 xong.

## Requirements
1. **Host route `/kudos`**: page tối giản (đã auth-guard qua proxy) có nút "Viết Kudo" mở modal.
2. **Recipient**: nối `use-recipient-search` vào autocomplete; chọn → set `receiverId`; loại self.
3. **Rich-text editor (Tiptap)**: bold / italic / strike / ordered-list / link / quote + **@mention** (suggestion từ profiles) → xuất `content_html`. Placeholder đúng spec.
4. **Hashtag**: `+ Hashtag` mở dropdown catalog (`use-hashtags`); chip add/remove; enforce 1–5, tag thứ 6 chặn + báo "Tối đa 5 hashtag".
5. **Image**: `+ Image` file picker; validate jpg/png ≤5MB; thumbnail + x; ẩn nút khi đủ 5, hiện lại khi xóa. **Sinh `kudoId` (uuid v4) ở client khi mở form**, upload ảnh vào Storage `{uid}/{kudoId}/` trước, truyền `kudoId` + image paths vào `createKudo`. <!-- Updated: Validation Session 1 - client-uuid + storage ordering -->
6. **Ẩn danh**: checkbox toggle field alias (show/hide); map `isAnonymous` + `anonymousName`.
7. **Submit/Cancel**: Gửi disabled tới khi đủ 3 field bắt buộc; submit → `use-create-kudo` → loading → success: toast "Đã gửi Kudo thành công" + đóng modal + reset. Hủy: đóng + bỏ data (xóa ảnh temp đã upload nếu có). Lỗi field → viền đỏ + message.
   - **Bảo mật:** `content_html` được sanitize server-side ở phase 04 (write); khi màn read (board) render sau này PHẢI sanitize lại (defense-in-depth).
8. **i18n**: toàn bộ text qua next-intl keys (VN điền, EN để trống structure).

## Related files
- Create: `src/app/kudos/page.tsx`, `src/features/kudos/components/*` (compose-modal, recipient-select, rich-text-editor, hashtag-picker, image-uploader, anonymous-toggle, submit-bar), toast setup.
- Mỗi component < 200 dòng — tách nhỏ.

## Success criteria
- Flow đầy đủ: mở modal → điền → submit → row `kudos` + quan hệ + ảnh Storage thật.
- Validation + disabled/enabled Gửi khớp test cases ID-46..ID-56.
- Pixel-perfect giữ nguyên sau khi nối data.

## Todo
- [ ] Host `/kudos` + trigger modal
- [ ] Recipient autocomplete (real)
- [ ] Tiptap editor + @mention → HTML
- [ ] Hashtag picker (catalog, 1–5)
- [ ] Image uploader (validate + Storage)
- [ ] Anonymous toggle
- [ ] Submit/Cancel + toast + errors
- [ ] i18n keys
