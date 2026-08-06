# Clarifications — UI Pixel-Parity Fix

## Session 2026-08-06

- Q: Bắt đầu từ đâu để fix UI cho chuẩn 99% — sửa thước đo trước, sửa /awards trước, hay sửa /board trước? → A: Sửa thước đo trước (band-diff cho pixel-diff.mjs)
- Q: Làm sao tách BE ra để chấm UI sạch khi BE đã wire 8/11 màn — mock fixtures + ?ui_state=, seed DB khớp density, hay bàn thêm? → A: Mock fixtures + ?ui_state= (nhân rộng pattern của /board)
- Q: Ba plan pending trùng scope (260804-1452, 260805-1353, 260805-1117) xử lý thế nào? → A: Đánh dấu blockedBy plan mới, giữ nguyên nội dung để tham chiếu, không xoá
- Q: Work-type + spec cho plan này? → A: feature + spec_waived — UI-parity fix trên màn đã build, design source là MoMorph/Figma đã có, không author spec mới (theo tiền lệ plan 260805-1353)

## Còn treo (cần user trả lời trước phase-09)

- Q: Figma "Thể lệ" (`b1Filzi9i6`, artboard 1440×1796) là TRANG RIÊNG hay MODAL? App đang render modal cao ~1024px. → A: _chưa trả lời_
- Q: screenId đúng của màn `/notifications`? → A: **ĐÃ GIẢI QUYẾT 2026-08-06** — 2 màn: "View thông báo" `gWBVcaSVIf` (node 589:9152, dropdown) + "Tất cả thông báo" `6-1LRz3vqr` (node 589:9132, page). Cả hai `spec_status: none` (chỉ có design, không có spec)
- Q: Có authorize figma MCP không? → A: **AUTH OK (2026-08-06, handle danmt) NHƯNG seat "View" trên Enterprise plan bị RATE-LIMIT ngay call nội dung đầu tiên** (`whoami` chạy, `get_metadata`/`get_screenshot` trả "reached tool call limit"). ⇒ KHÔNG dựa được vào figma MCP để đọc annotation/node. **Vẫn phải nhờ user gửi ảnh Figma** cho mọi annotation ngoài artboard. MoMorph là nguồn số chính (get_node cho absolute-Y đã verify OK).
- Q: Awards có spec behavior nào chỉ hiện dạng annotation trên Figma (MoMorph crop mất) không? → A: CÓ — NOTE "Scroll thì phần này sẽ đi theo" trỏ vào **menu list award (Top Talent…MVP, node `mms_C_Menu list` 313:8459) = STICKY/scroll-follow** (scrollspy: menu trái dính, card phải scroll). User xác nhận "có 1 số spec show trên UI Figma" ⇒ **có thể còn annotation khác** — cần user gửi thêm ảnh các vùng còn lại của awards + homepage.
