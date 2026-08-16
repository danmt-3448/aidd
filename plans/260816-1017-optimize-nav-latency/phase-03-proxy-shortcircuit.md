# Phase 03 — Proxy post-launch: skip cả 2 query (cache event_start_at)

**Priority:** P2 · **Risk:** TB (đụng route guard) · **Status:** pending · **Depends:** Phase 00

## Context (red-team F1 — REWORKED)
`proxy.ts:69` chạy `event_config` + `profiles` trên **mọi navigation** cho route gated có session. **Hai query này ở trong `Promise.all` (song song)** → wall-clock = max(t1,t2). **Bỏ 1 query KHÔNG giảm latency** — chỉ giảm DB load. Muốn cắt latency post-launch phải **skip CẢ HAI**.

Post-launch, cả pre-launch gate lẫn profiles-cho-isAdmin đều vô nghĩa (gate không bao giờ redirect nữa). `event_start_at` là **1 timestamp cố định trong 1 event** → cache được.

## Goal
Post-launch: bỏ **cả** `event_config` + `profiles` query trên hot path route gated (chỉ đọc 1 lần rồi cache) → cắt hẳn latency DB của nav. GIỮ hành vi gate.

## Requirements
- **Cache `event_start_at`** với TTL (vd 5 phút). Sau khi biết post-launch từ giá trị đã cache → route gated return `response` ngay, KHỎI query gì.
- ⚠️ **Edge module state không bền giữa invocations** — cache in-module có thể miss thường xuyên trên serverless/edge. Phải chấp nhận: cache là *best-effort* (miss → query 1 lần rồi cache lại). Ngay cả hit-rate vừa phải cũng cắt phần lớn query. Đo hiệu quả thực ở Phase 00-style sau khi làm.
- **Fail-open giữ nguyên tuyệt đối:** config null/lỗi/anon → không lock. Cache lỗi → fallback query như cũ. Không được biến thành lock cứng.
- `/countdown` path: giữ nguyên (cần config tươi để quyết post-launch lock) — chỉ dùng cache cho nhánh gated non-countdown, hoặc share cache nhưng /countdown vẫn verify.
- Pre-launch: giữ nguyên đủ logic (event_config + profiles cho isAdmin) — chỉ post-launch mới short-circuit.

## Related Code Files
- **Create:** `src/features/event/event-start-cache.ts` — cache `event_start_at` (module-level, TTL, fail-open).
- **Modify:** `src/proxy.ts` (nhánh gated: dùng cache; post-launch → skip cả 2 query).
- **Read:** `src/features/event/launch-gate.ts`.

## Steps
1. Viết cache helper: `getEventStartAt(supabaseFactory)` — trả cached nếu còn TTL, else query + cache; lỗi → null (fail-open).
2. proxy nhánh gated: lấy start-at từ cache → `isPostLaunch` → return `response` (khỏi profiles). `isPreLaunch` → query profiles cho isAdmin như cũ.
3. `tsc --noEmit`.
4. Đo lại: post-launch nav → còn query DB nào trong proxy không (mục tiêu: 0 khi cache hit).

## Success Criteria
- Post-launch route gated (cache hit): **0 DB query** trong proxy. Cache miss: 1 query (event_config), vẫn không query profiles.
- Pre-launch: giữ nguyên (event_config + profiles). Admin pre-launch vào được; user pre-launch bị đẩy /countdown.
- **e2e `public` countdown xanh** (pre-launch redirect + post-launch /countdown→/board lock đúng). Seed cả 2 trạng thái event_config (memory `local-e2e-db-setup`). CD-E2E-04 flaky đã biết.

## Risk & Mitigation
- Route guard = hot path bảo mật/điều hướng. Cache stale → tối đa là gate 1 event_config cũ trong ≤TTL; vì `event_start_at` cố định trong 1 event nên stale gần như vô hại. Vẫn fail-open.
- Nếu Phase 00 cho thấy proxy DB query chiếm % nhỏ (vì đã song song + nhanh) → **cân nhắc DROP phase này** (YAGNI); win latency có thể không bõ độ phức tạp cache trên edge.

## Out of scope
Không đổi updateSession (Phase 06), auth fast-path, RLS.
