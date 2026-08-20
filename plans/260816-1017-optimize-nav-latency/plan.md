---
title: Optimize navigation latency (App Router + Supabase)
status: completed
work_type: deliverable
spec_waived: "Behavior-preserving performance refactor — no new business logic or screen spec. Config-safe; every phase must preserve current behavior. Verified by existing unit + e2e suites."
blockedBy: []
blocks: []
related: [260815-1104-performance-audit-and-improve]
branch: develop
created: 2026-08-16
level: medium
revision: "260816-1027 — red-teamed (reviewer-260816-1027-plan-redteam.md). Reprioritized by REAL latency: proxy/middleware getUser is the #1 per-nav cost; loading.tsx only masks page-await not middleware; proxy queries already parallel so removing one ≠ latency."
---

# Optimize Navigation Latency — Plan

## Problem

Chuyển trang "render chậm / behavior chậm". Không phải bundle (audit `260815` đã loại). Nguyên nhân: **mỗi navigation chờ nhiều round-trip mạng auth + DB xong mới vẽ.**

Đo từ code, 1 nav vào `/board`:
- `proxy.ts` → `updateSession` (`middleware.ts`) `getUser()` — **network, MỖI nav** (matcher phủ mọi route).
- `proxy.ts:69` gate: `event_config` + `profiles` (**Promise.all — song song**).
- `board/page.tsx:19` `getUser()` — network.
- `get-is-admin.ts:18` `getIsAdmin()` → `getUser()` lần nữa — network + query `profiles`.

**Không có `loading.tsx` nào** (`find src/app -name loading.tsx` → rỗng).

## Kiến trúc latency (đọc trước — quyết định thứ tự phase)

```
[nav click] → middleware/proxy (getUser + gate)   ← trang CŨ đứng im ở đây, loading.tsx KHÔNG che
            → route segment stream (loading.tsx hiện) → page await (getUser×2 + profiles) → content
```

- **proxy chạy TRƯỚC khi RSC stream** → `loading.tsx` chỉ che phần *page-await*, KHÔNG che phần proxy. Muốn hết "đơ" phải giảm proxy trước.
- **proxy `event_config` + `profiles` đã song song** → bỏ 1 query ≠ giảm latency (giảm DB load thôi). Muốn cắt latency post-launch phải skip *cả hai* (cache `event_start_at`).
- **cost lặp nhiều nhất = `getUser()` trong `updateSession`** (mỗi nav). Đây là đòn ROI cao nhất.

## Constraints (BẮT BUỘC)
- **Behavior-preserving** — không đổi logic nghiệp vụ / auth semantics / route-guard *hành vi*.
- **Đo trên PROD build** (`next build && next start` hoặc Vercel) — KHÔNG Turbopack dev (dev không prefetch, compile per-request → số vô nghĩa). Ref memory `next16-build-no-firstload-table`, `e2e-needs-dev-server-not-prod`.
- Đụng `src/proxy.ts` / `middleware.ts` → **chạy e2e countdown** (`countdown.spec.ts`, project `public`) + xác nhận pre/post-launch gate đúng. CD-E2E-04 flaky sẵn (memory) — repro baseline trước khi quy lỗi.
- `getClaims()` thay `getUser()` chỉ khi verify JWT cục bộ hợp lệ + chấp nhận được về bảo mật với config Supabase hiện tại (supabase-js 2.111 có getClaims). **Verify trước, fallback = giữ getUser + chỉ dedupe.**
- Screen đụng UI (loading skeleton, board Suspense) → UI-First Gate / screenshot evidence.

## Baseline đo được (prod) — `reports/baseline-260816-prod-nav.md`

- **1 render `/board` = 3× getUser** (MW 46ms + page 37ms + getIsAdmin 3ms ≈ 86ms serial). ✔ đúng giả định.
- **Board mount fan-out = 8× `POST /board` server action** — mỗi cái 1 middleware getUser (24–102ms). ← "spam" thực sự (PHÁT HIỆN MỚI → Phase 07).
- **`MW getUser` 24–134ms, chạy MỌI request** (document + mỗi action + mỗi prefetch) — thuế lớn nhất → Phase 06 = đòn số 1, xác nhận bằng số.
- **Prefetch tax (F5 confirmed):** mỗi page prefetch ~3 route anh em, mỗi cái 1 full getUser ~100ms.
- Không polling (`refetchInterval`=0), `refetchOnWindowFocus:false`. Trên Vercel↔Supabase cloud getUser đắt hơn nhiều local → tác động Phase 06 còn lớn hơn.

## Phases (thứ tự = ROI latency THỰC, đã hiệu chỉnh theo baseline)

| Thứ tự | Phase | Prio | Risk | Đòn vào |
|---|-------|------|------|---------|
| 0 | [Baseline measurement (prod)](phase-00-baseline-measurement.md) | ✅ DONE | — | đã đo — xem trên |
| 1 | [updateSession getUser → getClaims](phase-06-updatesession-getclaims.md) | ✅ DONE | TB (auth/guard) | **MW getUser 24–134ms → getClaims local 1–6ms**; test 5/5, e2e pass |
| 2 | [Board data consolidation 8→1–2 actions](phase-07-board-data-consolidation.md) | ⏸️ DEFER | TB–Cao | **DEFER 260816** — 4/8 hook realtime-coupled (rewire rủi ro); 4 còn lại staleTime lệch (gộp ép chung cache); Phase 06 đã xoá cost chính/POST → ROI marginal. Xem note phase file. |
| 3 | [Dedupe page auth (React cache)](phase-02-dedupe-auth.md) | ✅ DONE | Thấp | page getUser **2→1 (đo prod: awards render = 1 call)**; +DRY toHeaderUser |
| 4 | [Loading states (loading.tsx)](phase-01-loading-states.md) | ✅ DONE | Thấp | 6 route có skeleton tức thì; shared RouteLoading (brand spinner, giá trị lấy từ BoardLoadingGate) |
| 5 | [Link prefetch](phase-04-link-prefetch.md) | ✅ NO-OP | Thấp | **Đã thoả sẵn** — SiteHeader đã dùng `<Link>` (prefetch active, baseline xác nhận); router.push còn lại là imperative đúng (filter/redirect/link động). Không churn. |
| 6 | [Proxy post-launch skip 2 query (cache)](phase-03-proxy-shortcircuit.md) | ❌ DROPPED | TB (route guard) | **DROP 260816** — baseline: 2 query đã Promise.all song song → lợi latency ~0, không bõ độ phức tạp cache edge (YAGNI, user chốt) |
| 7 | [Board hydration Suspense](phase-05-board-hydration.md) | ⏸️ DEFER | TB | board đã feed-first (BoardLoadingGate); "chậm" thực = JS client nặng (swiper/zoom-pan-pinch) mà Suspense KHÔNG giảm TBT. YAGNI → defer. |

File-ownership: middleware / board-data / page / loading / links tách nhau → song song được. #2 & #7 cùng đụng board → **#2 trước #7** (đừng để xung đột board-connected). Thứ tự trên là ROI, không phải block.

## Success Criteria (toàn plan)
- Số đo prod: getUser network/nav vào `/board` giảm (mục tiêu ≥1 round-trip từ proxy nếu F3 áp dụng + 1 từ page dedupe). TTFB-to-first-byte của nav giảm rõ so baseline Phase 0.
- Mọi route protected có `loading.tsx`.
- `npm run test` xanh · e2e `authed` + `public` xanh (trừ flaky đã biết) · `tsc --noEmit` sạch · không regression auth/gate/redirect.

## Handoff
Build: `/tkm:takumi plans/260816-1017-optimize-nav-latency/plan.md`
Red-team: `reports/reviewer-260816-1027-plan-redteam.md`
