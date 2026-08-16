# Báo cáo — Tối ưu Nav Latency: Phase 06 (getClaims) · 260816

Nhánh: `develop` · Discipline: code (theo plan) · Trạng thái: **HOÀN THÀNH, chưa commit**
Plan: `plans/260816-1017-optimize-nav-latency/`

## 1. Vấn đề & bối cảnh
Chuyển trang chậm, "behavior chậm". Audit trước (`performance-report.md`) chỉ đo bundle/ảnh → kết luận app không nặng bundle. Nhưng chưa ai đo **nav latency** — đúng cái user than.

Đo baseline trên **prod build** (report `baseline-260816-prod-nav.md`) phát hiện:
- **Mỗi request qua middleware gọi `getUser()` = 1 round-trip mạng tới Supabase Auth, 24–134ms**, chạy trên MỌI navigation, MỌI server action, MỌI prefetch.
- 1 lần render `/board` = **3× getUser** (middleware + page + getIsAdmin ≈ 86ms auth nối tiếp trước khi vẽ).
- Board mount còn bắn **8× `POST /board`** (8 server action song song) → mỗi cái lại 1 getUser middleware. Đây là "spam" thực (đã tách thành Phase 07).

## 2. Đã làm (Phase 06 — đòn ROI số 1)
Đổi `updateSession()` trong `src/lib/supabase/middleware.ts`:
- `getUser()` (mạng mỗi request) → **`getClaims()`** verify chữ ký **ES256 cục bộ qua JWKS** (dự án dùng asymmetric signing keys — đã xác nhận: session token ES256, kid khớp JWKS).
- Chỉ nhận claims khi **còn hạn (`exp > now`)**; token hết hạn / getClaims lỗi / thiếu `sub` → **fallback `getUser()`** (vừa refresh cookie session vừa xác thực đầy đủ).
- Route guard `proxy.ts` chỉ cần `user.id` + truthiness → không đổi hành vi redirect / pre-launch gate.

## 3. Kết quả đo (prod, chứng minh không phải no-op)
| | getUser cũ | getClaims mới |
|---|---|---|
| Auth cost / request (middleware) | **24–134 ms** (mạng) | **1–6 ms** (cục bộ) |
| Tỉ lệ call cục bộ (authed) | — | 27/28 (1 fallback đúng ở /dev-login pre-auth) |
| JWKS fetch | — | 1 lần (cold ~23ms) rồi cache |

→ Xoá round-trip mạng auth trên mọi nav authed. Trên Vercel↔Supabase cloud (mạng thật) mức lợi còn lớn hơn nhiều local.

## 4. Kiểm thử & review
- **Reviewer:** APPROVED_WITH_CONDITIONS → bắt đúng 1 lỗ: comment sai ("getSession auto-refresh" — sai; refresh nằm ở nhánh getUser) + thiếu guard token hết hạn. **Đã fix cả 3:** guard `exp > now`, sửa comment, log lỗi fallback.
- **Test:** `src/lib/supabase/middleware.test.ts` **5/5** (gồm case token hết hạn → fallback refresh). Full unit **581/581** (46 file). `tsc --noEmit` sạch.
- **E2E:** public (countdown gate) + authed (board/profile/auth-check) PASS; **session-longevity OK** (session giữ qua nhiều lần nav). 3 fail còn lại = flaky Radix/Turbopack có sẵn trên baseline (không do thay đổi này).

## 5. Trade-off (đã ghi vào docs + code)
getClaims verify cục bộ → **user bị ban/revoke vẫn hợp lệ tới khi token hết hạn (≤ TTL)**. Chấp nhận được cho guard chỉ gate navigation + đọc `is_admin`. Cần revoke tức thì cho route nhạy cảm → giữ getUser riêng cho route đó (chưa cần).

## 6. File thay đổi (scoped, chưa commit)
- `src/lib/supabase/middleware.ts` (+26/−4) — thay đổi chính
- `src/lib/supabase/middleware.test.ts` — mới (5 test)
- `docs/system-architecture.md`, `docs/project-changelog.md`, `docs/performance-guidelines.md` — doc-writer đồng bộ
- `plans/260816-1017-optimize-nav-latency/` — plan (8 phase) + report (baseline, tester, reviewer, báo cáo này)

## 7. Còn lại trong plan (chưa làm)
| Phase | Việc | Ưu tiên |
|---|---|---|
| 02 | Dedupe page getUser 2→1 (React `cache()`) | P0, an toàn |
| 07 | Gộp 8 board action → 1–2 (RPC/action) — "spam" thực | P1 |
| 01 | `loading.tsx` 6 route (perceived) | P1 |
| 04 | `<Link>` prefetch + giảm scope prefetch (sau 06) | P2 |
| 03 | Proxy skip 2 query post-launch (cache) — cân nhắc drop | P3 |
| 05 | Suspense widget board (nếu TBT giảm) | P3 |

## Câu hỏi mở
- Commit Phase 06 ngay (nhánh develop) hay gộp với Phase 02/07 thành 1 đợt?
- Môi trường: colima+supabase local đang chạy; `.next` đang là build tạm `NEXT_PUBLIC_ENABLE_DEV_LOGIN=true` — cần rebuild sạch trước khi deploy thật.
