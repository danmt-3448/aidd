# Báo cáo — Tối ưu Nav Latency: chạy 1 mạch (06→02→01) · 260816

Nhánh: `develop` · Chạy tự chủ, vừa build vừa phản biện. Env: colima+supabase local, prod build verify.

## Đã SHIP (3 phase, 4 commit)
| Commit | Phase | Nội dung | Bằng chứng |
|---|---|---|---|
| `f40dc1b` | 06 | Middleware `getUser()` → `getClaims()` local (ES256/JWKS) + fallback | prod: 24–134ms → **1–6ms**/request |
| `815413e` | 02 | `getCurrentUser` (React `cache()`) dedupe + `toHeaderUser` (DRY 6 page) | prod: 1 render = **1 getUser** (trước 2) |
| `05b09f7` | 01 | `loading.tsx` × 6 route + shared `RouteLoading` | skeleton tức thì khi nav |
| `d130559` | docs | changelog + ghi outcome các phase | — |

## Phản biện → KHÔNG làm (có lý do, không phải bỏ ngang)
- **Phase 07 (gộp 8 board action) — DEFER.** Đọc code thật: **4/8 hook có realtime subscription** (feed/highlights/spotlight/spotlight-activity) → gộp phải rewire realtime trên board live (rủi ro cao); 4 hook còn lại **staleTime lệch** (catalog 5min vs stats 60s) → gộp ép chung cache. Quan trọng nhất: **Phase 06 đã xoá cost chính/POST** → ROI marginal. Bản "8→1-2 sạch" plan tưởng tượng không khớp thiết kế hook. YAGNI → defer.
- **Phase 04 (Link prefetch) — NO-OP.** `SiteHeader` **đã dùng `<Link>`** (prefetch active, baseline xác nhận). `router.push` còn lại là imperative đúng (filter hashtag/dept, redirect sau login, link notification động). Convert = churn + sai ngữ nghĩa. Không làm.
- **Phase 05 (board Suspense) — DEFER.** Board đã render feed-first qua `BoardLoadingGate`. "Behavior chậm" thực chất = JS client nặng (swiper/zoom-pan-pinch) — Suspense **không giảm TBT** (TBT là exec JS, không phải data waterfall). YAGNI → defer.
- **Phase 03 (proxy skip query) — DROP** (user chốt). 2 query đã `Promise.all` song song → lợi latency ~0.

## Kiểm thử (sau toàn bộ thay đổi)
- Unit **581 pass** (gồm 5 test mới `middleware.test.ts`). tsc `--noEmit` **0 lỗi**. Lint sạch.
- E2E **public 5 pass** (countdown auth guard + pre/post-launch gate) · **authed 15 pass** (board/auth-check identity-critical).
- Reviewer Phase 06: APPROVED_WITH_CONDITIONS → đã fix (guard `exp>now`, comment, log fallback).
- Flaky profile/homepage = pre-existing (dicebear config + next-intl locale timing), KHÔNG do thay đổi này.

## Tổng lợi ích latency (đo prod)
- **Auth per request: 24–134ms → 1–6ms** (Phase 06) — áp cho MỌI nav/action/prefetch.
- **Page render: 2 getUser → 1** (Phase 02).
- **Perceived: skeleton tức thì** thay vì đơ trang cũ (Phase 01).
- Trên Vercel↔Supabase cloud (mạng thật) mức lợi Phase 06 còn lớn hơn nhiều local.

## Lưu ý / còn lại
- **Property-diff gate board KHÔNG chạy lại** — chủ ý: không phase nào đổi markup loaded-board (06=middleware, 02=server logic, 01=transient loading). Behavior đã verify bằng e2e authed board (15 pass). Nếu cần chốt fidelity: `/aidd-ui-gate /board`.
- **Env:** colima+supabase local đang chạy; `.next` là build tạm `NEXT_PUBLIC_ENABLE_DEV_LOGIN=true` → **rebuild sạch trước khi deploy thật**.
- Trade-off Phase 06 (revoke chỉ hiệu lực sau khi token hết hạn ≤TTL) đã ghi vào code + docs.

## Câu hỏi mở
- Có muốn tôi chạy `/aidd-ui-gate /board` để chốt property-diff (rủi ro: có thể lộ drift board pre-existing, không do thay đổi này)?
- Deploy: cần rebuild sạch (bỏ dev-login flag) + smoke test.
