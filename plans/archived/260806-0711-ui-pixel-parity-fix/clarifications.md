# Clarifications — UI Parity Fix

## Session 2026-08-06 (sáng) — khung plan pixel-parity

- Q: Bắt đầu từ đâu để fix UI cho chuẩn 99% — sửa thước đo trước, sửa /awards trước, hay /board trước? → A: Sửa thước đo trước
- Q: Tách BE ra để chấm UI sạch khi BE đã wire 8/11 màn? → A: Mock fixtures + `?ui_state=` (nhân rộng pattern /board)
- Q: Ba plan pending trùng scope (260804-1452, 260805-1353, 260805-1117) xử lý sao? → A: blockedBy plan này, giữ nội dung tham chiếu, không xoá
- Q: Work-type + spec? → A: feature + spec_waived (UI-parity fix trên màn đã build, design source MoMorph/Figma đã có)
- Q: screenId đúng của `/notifications`? → A: 2 màn — "View thông báo" `gWBVcaSVIf` (589:9152, dropdown) + "Tất cả thông báo" `6-1LRz3vqr` (589:9132, page); cả hai `spec_status: none`
- Q: Figma "Thể lệ" (`b1Filzi9i6`, artboard 1440×1796) là trang riêng hay modal? → A: MODAL — chấm property-diff vùng modal, không so full-page với artboard 1796
- Q: Awards/homepage có annotation Figma nào MoMorph crop mất không? → A: Đã thu đủ — Awards menu list (`313:8459`) = STICKY/scroll-follow (menu trái dính, card phải scroll); không còn annotation treo

## Session 2026-08-06 (chiều) — fold gate-mechanism overhaul

- Q: Gate quét nhiều lần vẫn không bắt sai icon/màu/image-dựng-tay — sửa cây thước hướng nào? → A: Structured property-diff (getComputedStyle vs get_node) làm CỔNG CỨNG; pixel-diff/band hạ xuống overlay
- Q: figma MCP đọc style trực tiếp được không? → A: KHÔNG — seat "View" org Sun* hết quota MCP ngay call nội dung đầu; đọc style qua MoMorph get_node (mirror node Figma, không throttle); annotation ngoài artboard vẫn nhờ user gửi ảnh
- Q: Quan hệ với plan 260806-0711 (pixel-parity 11 màn)? → A: GỘP vào plan này — đổi đích sang property-diff gate, chèn phase-01B + 01C, band-diff thành overlay
- Q: momorph-implement-design (kit global, gitignore) sửa cho team được không? → A: KHÔNG — build convention (data-fig + asset thật) enforce qua .claude/roles/fe-developer.md + gate
- Q: Quy trình triển khai? → A: /tkm:create-plan đầy đủ + red-team (đã chạy, 13 finding accepted) → chờ user duyệt → /tkm:takumi
