# Clarifications — Login (screenId GzbNeVGJHz)

## Session 2026-07-30

- Q: Google OAuth giới hạn domain nào? → A: Không — tất cả tài khoản Google được phép
- Q: Redirect sau login thành công? → A: /todo
- Q: Xử lý login thất bại/hủy? → A: Hiển thị "Đăng nhập không thành công. Vui lòng thử lại."
- Q: Trạng thái trong khi xác thực? → A: Nút disabled + loading indicator
- Q: Ngôn ngữ hỗ trợ + mặc định? → A: VN/EN, mặc định VN, lưu cookie NEXT_LOCALE, đổi UI toàn trang
- Q: User đã đăng nhập truy cập /login? → A: Redirect về app (/todo)
- Q: Logo header có click được không? → A: Không interactive
- Q: Footer nội dung? → A: Tĩnh "Bản quyền thuộc về Sun* © 2025"
- Q: Hero visual? → A: Trang trí tĩnh, không tương tác
- Q: Tạo profile khi nào? → A: Khi user đăng nhập lần đầu (bảng profiles theo docs/database-schema.md)
- Q: Backend riêng? → A: Không — Supabase (Auth + DB), không dựng BE service
- Q: Scope? → A: Web only
- Q: Phương thức auth? → A: Google OAuth THẬT (đúng design, cần Google creds free) + magic-link DEV-ONLY (env-gated, không hiện UI production) để test trước khi có creds
- Q: UI production có thêm control login nào ngoài nút Google? → A: KHÔNG — giữ đúng design (chỉ nút "Login with Google"); dev-login tách riêng
