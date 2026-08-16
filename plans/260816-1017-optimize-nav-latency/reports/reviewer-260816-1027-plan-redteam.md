# Red-team — Optimize Nav Latency plan

Verdict: **CHANGES_REQUIRED** (2 critical: goal/means mismatch). Plan cấu trúc tốt, ràng buộc chặt, nhưng **2 phase chủ lực tấn công sai chỗ** — sẽ tốn công mà latency thực gần như không đổi.

## CRITICAL

### F1 — Phase 3 cho ~0 latency (query đã chạy song song)
`proxy.ts:69` `event_config` + `profiles` nằm trong **`Promise.all` (song song)** → wall-clock = max(t1,t2), không phải t1+t2. Bỏ `profiles` chỉ giảm **DB load**, KHÔNG giảm latency của nav (vẫn phải đợi `event_config`). Muốn cắt latency post-launch phải **skip CẢ HAI** — mà điều đó cần cache `event_start_at` (đúng cái plan cố tình né vì lo edge module state). ⇒ Phase 3 "option a" mâu thuẫn chính mục tiêu của nó. **Hoặc rework (cache event_start_at + skip cả 2), hoặc hạ Phase 3 xuống "giảm DB load" và bỏ khỏi mục tiêu latency.**

### F2 — `loading.tsx` KHÔNG che được latency proxy/middleware
Kiến trúc App Router: middleware (`proxy.ts`) chạy **TRƯỚC** khi RSC bắt đầu stream. Trong lúc proxy làm `updateSession` (getUser mạng) + gate queries, **trang cũ đứng im** — `loading.tsx` (Suspense fallback) chỉ render **SAU** khi request tới được route segment. ⇒ `loading.tsx` che phần *page component await* (Phase 2 xử lý), **KHÔNG** che phần proxy. Nếu proxy là bottleneck (rất có thể — nó chạy mọi nav), user vẫn thấy đơ. Phase 1 vẫn đáng làm (rẻ, che phần page-render) nhưng **đừng kỳ vọng nó xoá cảm giác đơ** nếu proxy chậm.

## HIGH

### F3 — Cost lặp nhiều nhất KHÔNG có phase nào chạm: getUser trong `updateSession`
`middleware.ts` gọi `supabase.auth.getUser()` — **1 round-trip mạng tới Auth server trên MỖI navigation** (matcher phủ mọi route non-asset). Đây là chi phí per-nav bị lặp nhiều nhất và **ROI cắt latency cao nhất**, nhưng plan để "out of scope". Supabase SSR khuyến nghị getUser trong middleware vì lý do bảo mật (verify token), nhưng `getClaims()` (local JWT verify, có ở supabase-js 2.111 ✓) là ứng viên thay thế đáng **đo**. Ít nhất: đo riêng thời gian updateSession/nav trước khi kết luận Phase 1–5 là đủ. Nghi ngờ mạnh: fix F3 > toàn bộ Phase 3+4+5 cộng lại.

## MEDIUM

### F4 — Đo phải trên PROD build, plan không ghim
Turbopack **dev** không prefetch, compile per-request, không tối ưu → số before/after trên dev **vô nghĩa**. Phải `next build && next start` (hoặc Vercel). Khớp memory `next16-build-no-firstload-table`, `e2e-needs-dev-server-not-prod`. Thêm dòng "measure on prod build only" vào plan.

### F5 — Phase 4 prefetch: caveat server-cost bị bỏ
Prefetch chỉ hoạt động prod; và mỗi link prefetch = 1 RSC request = **chạy middleware (getUser) cho link đó**. Prefetch nhiều link trong viewport → nhân số getUser server-side. Perceived win có thật, nhưng nếu F3 chưa fix thì prefetch **khuếch đại** chi phí getUser. Thứ tự đúng: fix F3 trước, rồi mới prefetch.

## LOW
- **F6** — `## Plan Context` reports path bị **nhân đôi prefix** (`.../aidd/Users/mai.thanh.dan/.../reports/`) — set-active-plan ghi path lỗi. Cosmetic nhưng report sẽ lạc chỗ. (Report này tôi đã ghi vào path đúng `plans/260816-1017-.../reports/`.)
- **F7** — Phase 2 tầng 2: `getClaims` lần gọi đầu có thể fetch JWKS (1 lần, rồi cache) → "0 mạng" không đúng tuyệt đối lúc cold, nhưng vẫn rẻ hơn getUser nhiều. Sửa câu chữ cho chính xác. Phase 2 tầng 1 (`cache()` dedupe) — **chuẩn, an toàn, giữ.**

## Đề xuất reprioritize (theo latency THỰC, không phải perceived)
1. **F3 mới** — đo + (nếu OK) getClaims trong updateSession — *đây mới là đòn chính*.
2. **Phase 2 tầng 1** — cache() dedupe page getUser (2→1).
3. **Phase 1** — loading.tsx (perceived, che page await).
4. **Phase 4** — prefetch (SAU F3).
5. **Phase 3** — rework thành cache event_start_at + skip cả 2 query, HOẶC drop khỏi mục tiêu latency.
6. **Phase 5** — giữ nguyên (đã có guard "bỏ nếu TBT không giảm").

## Unresolved (cần user/đo)
- getClaims trong middleware có chấp nhận được về mặt bảo mật cho project này không? (verify local vs Supabase SSR guidance)
- Đo thực: proxy/middleware chiếm bao nhiêu % thời gian 1 nav vào /board (prod)? Số này quyết định F2/F3 có đáng không.
