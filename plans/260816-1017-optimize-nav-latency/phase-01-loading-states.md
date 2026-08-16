# Phase 01 — Loading states (`loading.tsx`)

**Priority:** P1 · **Risk:** Thấp · **Status:** ✅ DONE (260816)

> **Kết quả:** shared `src/components/route-loading.tsx` (spinner brand `#FFEA9E` trên bg `rgba(0,16,26,1)` — lấy nguyên từ `BoardLoadingGate`, không chế) + `loading.tsx` cho board/profile/notifications/kudos/awards/secret-box. Skeleton hiện tức thì khi nav (che phần page-await). Visual loaded-board KHÔNG đổi. tsc+lint xanh.

> **⚠️ Red-team F2:** `loading.tsx` che phần *page-await* (getUser/query trong Server Component) — **KHÔNG che latency proxy/middleware** (proxy chạy trước khi RSC stream; trang cũ đứng im trong lúc đó). Nếu Phase 00 cho thấy proxy là bottleneck chính, phase này giảm "đơ" chỉ một phần — Phase 06 (proxy getClaims) mới xoá phần còn lại. Vẫn làm (rẻ), đừng kỳ vọng xoá hết cảm giác đơ.

## Context
- `find src/app -name loading.tsx` → **rỗng**. Mọi trang là `async` Server Component `await` mạng trước khi render → client nav giữ trang cũ đứng im tới khi RSC resolve. Đây là thủ phạm #1 của "chuyển trang render chậm" (cảm nhận).
- Next App Router: `loading.tsx` = Suspense fallback tự động cho route segment → hiện ngay khi bắt đầu điều hướng.

## Goal
Mỗi route protected có skeleton/loading tức thì khi điều hướng, che thời gian server component await.

## Requirements
- Thêm `loading.tsx` cho: `/board`, `/profile`, `/notifications`, `/kudos`, `/awards`, `/secret-box`.
- Skeleton bám layout thật của từng màn (khung header + vùng nội dung) — KHÔNG spinner toàn màn trống trơn (giật layout khi content về). Dùng khung shimmer/skeleton của shadcn nếu có (`components/ui/skeleton`).
- KHÔNG dùng giá trị visual tự chế cho skeleton đáng kể — nếu skeleton mô phỏng card/board thật, lấy spacing/size từ layout hiện có (đọc component thật), không bịa.

## Related Code Files
- **Create:** `src/app/{board,profile,notifications,kudos,awards,secret-box}/loading.tsx`
- **Read for context:** mỗi `{route}/page.tsx` + connected component tương ứng để skeleton khớp khung.
- Check `src/components/ui/skeleton.tsx` tồn tại chưa; chưa thì thêm shadcn skeleton primitive.

## Steps
1. Xác nhận `components/ui/skeleton` có sẵn (shadcn). Nếu chưa → thêm.
2. Với mỗi route: đọc page + connected để nắm khung → viết `loading.tsx` skeleton khớp bố cục (header giữ nguyên nếu ở layout, chỉ skeleton phần page).
3. `tsc --noEmit` sau mỗi file.

## Success Criteria
- Điều hướng tới mỗi route thấy skeleton *tức thì* (Network throttle Slow 3G để test).
- Skeleton không gây layout shift lớn khi content thật về (CLS thấp).
- Không console error.

## Verification
- Playwright/manual: throttle mạng, click nav, xác nhận skeleton xuất hiện trước content.
- Nếu skeleton mô phỏng board card đáng kể → `/aidd-ui-gate` cho `/board`; skeleton đơn giản → screenshot evidence (`/aidd-screenshot-report` state `loading`).

## Out of scope
Không đổi data-fetching của page (đó là Phase 2). Chỉ thêm fallback layer.
