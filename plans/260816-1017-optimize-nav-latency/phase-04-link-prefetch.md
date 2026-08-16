# Phase 04 — Link prefetch (điều hướng chính)

**Priority:** P2 · **Risk:** Thấp · **Status:** pending · **Làm SAU Phase 06**

> **⚠️ Red-team F5:** mỗi link prefetch = 1 RSC request = **chạy middleware (getUser) cho link đó**. Prefetch nhiều link trong viewport → nhân số getUser server-side. Vì vậy **làm sau Phase 06** (đã hạ cost getUser proxy); nếu làm trước, prefetch khuếch đại đúng cost đang muốn giảm. Prefetch chỉ hoạt động trên **prod build**.

## Context
`grep prefetch=` → rỗng; **42** chỗ `useRouter/router.push`. Next `<Link>` prod tự prefetch route khi vào viewport/hover; `router.push()` thì KHÔNG → click xong mới bắt đầu tải route.

## Goal
Điều hướng chính (header nav, tab, link giữa các screen) dùng `<Link>` để prefetch; giữ `router.push` chỉ cho điều hướng imperative thật sự (sau submit form, sau action).

## Requirements
- Audit 42 usage: phân loại "điều hướng do user click 1 link" (→ nên `<Link>`) vs "điều hướng lập trình sau side-effect" (→ giữ `router.push`).
- Đổi các nav link chính sang `<Link>` (Next mặc định prefetch, không cần `prefetch` prop).
- KHÔNG đổi những chỗ push sau mutation (vd sau tạo kudo → /board) — đó là imperative đúng.

## Related Code Files
- **Read/Modify:** component header/nav dùng chung (tìm trong `src/components/**` + `src/features/**/header*`, `*nav*`), các nút "Xem chi tiết"/tab.
- Grep điểm bắt đầu: `grep -rn "router.push\|useRouter" src --include=*.tsx`.

## Steps
1. Liệt kê 42 usage → gắn nhãn Link-able / keep-push.
2. Đổi Link-able sang `<Link href=...>` giữ nguyên style (asChild với shadcn Button nếu cần).
3. `tsc --noEmit`; smoke click các nav chính.

## Success Criteria
- Nav chính hover/viewport → thấy request `?_rsc` prefetch trong Network trước khi click.
- Không đổi đích điều hướng nào; không double-navigation.

## Out of scope
Không refactor mutation-then-redirect flows.
