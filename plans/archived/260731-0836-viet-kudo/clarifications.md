# Clarifications — Viết Kudo (screenId ihQ26W78P2)

## Session 2026-07-31

- Q: Nguồn hashtag? → A: Catalog seed sẵn (bảng hashtags), user chọn từ dropdown
- Q: Image upload làm tới đâu v1? → A: Full — upload Supabase Storage (bucket kudo-images + RLS)
- Q: Render mode? → A: Modal component (đúng spec) mount trên host route /kudos
- Q: Mục Danh hiệu (Frame 552)? → A: Defer — ngoài scope v1, không có trong spec A–H
- Q: Nguồn recipient autocomplete + test data? → A: Seed ~10 profiles test (Sunner giả lập tên VN)
- Q: Hành vi Gửi ẩn danh? → A: is_anonymous + anonymous_name optional alias; sender_id vẫn lưu để audit nhưng ẩn khỏi receiver
- Q: Ngôn ngữ màn này? → A: VN-only qua next-intl keys, cấu trúc sẵn cho EN
- Q: Sau submit thành công? → A: Toast "Đã gửi Kudo thành công" + đóng modal + reset form, ở lại /kudos
- Q: Kudo lưu nội dung dạng gì? → A: content_html từ Tiptap, gồm mention inline
- Q: Recipient có gồm bản thân không? → A: Loại bản thân khỏi danh sách người nhận
- Q: Max length nội dung? → A: Spec không nêu — default soft 2000 ký tự text, hiển thị counter
- Q: Định dạng ảnh hợp lệ? → A: jpg/png, từ chối pdf/mp4/txt, tối đa 5 ảnh, tối đa 5MB mỗi ảnh
