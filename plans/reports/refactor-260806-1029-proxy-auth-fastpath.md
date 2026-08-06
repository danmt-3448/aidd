# Middleware auth fast-path + parallel pre-launch gate — `src/proxy.ts`

## Yêu cầu user
"Chưa login → vào `/login` luôn, khỏi check gì thêm. Login rồi thì mới check."
Đồng thời sửa: nav header chậm + đôi khi bị đá ra login.

## Trước
Mỗi request non-bypass chạy **3 round-trip Supabase tuần tự**:
`getUser()` → `event_config` → `profiles(is_admin)` — kể cả khi CHƯA login (pre-launch gate chạy cho cả anonymous trước cả auth guard).

## Sau
Thứ tự mới trong `proxy.ts`:
1. `updateSession()` → `getUser()` (1 round-trip, bắt buộc cho secure guard).
2. **Auth fast-path (KHÔNG chạm DB):**
   - logged-in ở `/login` → `/`.
   - **chưa login + route protected → `/login` NGAY** (bỏ hẳn 2 query pre-launch). Đây là hot-path khi bấm link header.
   - chưa login + route public → rơi xuống gate (để anon ở `/` vẫn ra `/countdown` khi pre-launch).
3. **Pre-launch gate** (chỉ khi logged-in, hoặc anon trên public path): `event_config` + `profiles` chạy **song song** (`Promise.all`) thay vì tuần tự. `is_admin` chỉ query khi có session.

### Chi phí round-trip / nav
| Case | Trước | Sau |
|---|---|---|
| Chưa login → protected (hot path) | getUser + event_config (+redirect) | **getUser only** rồi redirect /login |
| Đã login → protected | getUser + event + profiles (3 tuần tự) | getUser + **Promise.all(event, profiles)** (≈2 lần thời gian) |
| Anon → `/` public | getUser + event | không đổi |

## "Đá ra login dù đã login"
Nguyên nhân đã xác định: Supabase local **down** → `getUser()` fail → user=null → redirect `/login`. Nay Supabase up thì hết. (Chưa thêm fail-soft cho getUser lỗi hạ tầng — để tách riêng, đụng bảo mật; xem Open items.)

## Verify (@127.0.0.1:3001)
- `tsc --noEmit` = 0 · `eslint src/proxy.ts` = clean.
- **Anon → `/board`** (protected) → redirect `/login` ✓ (fast-path, 0 query DB).
- **Anon → `/`** (public) → HTTP 200, 0 redirect, 0.25s ✓ (không loop).
- Credentials seed hợp lệ (test trực tiếp GoTrue `token?grant_type=password` → trả access_token).
- Logged-in path: code đúng + tsc/eslint pass, NHƯNG chưa chụp được flow live vì dev-login không giữ cookie trong Playwright MCP context (harness issue, không phải bug app — GoTrue login OK).

## Behavior nuance (đã đổi có chủ đích — cần user biết)
Trước: pre-launch, anon gõ thẳng route **protected** → `/countdown`. Sau: anon protected → `/login` (đúng tinh thần "chưa login → login"). Anon trên `/` pre-launch vẫn → `/countdown` như cũ. Sự kiện hiện đã launched (event_start_at quá khứ) nên gate là no-op → thay đổi này 0 tác động thực tế hôm nay.

## Open items
- **Tối ưu sâu hơn (tách PR, cần review):** (1) nhét `is_admin` vào JWT `app_metadata` → bỏ hẳn query `profiles` mỗi nav; (2) cache `event_start_at` → bỏ query `event_config`. Làm xong middleware còn đúng 1 `getUser`.
- **fail-soft cho false-logout:** khi `getUser()` lỗi do hạ tầng (khác "token invalid") → không hard-redirect. Đụng `lib/supabase/middleware.ts` để surface error — chưa làm.
