# BE Audit — screens (for BE agent) — 2026-08-05

Mục đích: liệt kê chỗ **BE code lỗi / thiếu data** để (1) BE agent check & fix, (2) FE tạm ẩn + thay mock để test UI+behavior độc lập.
Phương pháp: authed sweep (seed admin qua /dev-login) + DB census (psql local).

## DB census (data thật)
`kudos=0 · hearts=0 · notifications=0 · profiles=11 · departments=7 · secret_box=5 grants`
→ Phần lớn màn rỗng vì **KHÔNG có kudos/hearts data**, không phải BE lỗi.

## Console-error sweep per route
| Route | Errors | Chẩn đoán |
|---|---|---|
| **/board** | **36× HTTP 500** + 1× avatar 400 | ❌ **BE LỖI THẬT** — xem #1 |
| /profile | 2× avatar 400 | ✅ BE OK · rỗng data · avatar (#2) |
| /awards | 1× avatar 400 | ✅ OK (awards static config) |
| /secret-box | 0 | ✅ sạch — secret_box=5 render đúng |
| /notifications | 1× avatar 400 | ✅ BE OK · rỗng (0 notif) |
| / (homepage) | 1× avatar 400 | ✅ OK |
| /kudos | → redirect /board | alias |
| /todo | → redirect / | alias |

## Vấn đề BE cần agent check

### #1 — [CHẶN] /board: 36× HTTP 500 lặp (BE error)
- **Hiện tượng:** request tới `/board` trả 500, lặp ~36 lần, **độc lập với data** (vẫn xảy ra khi kudos=0), tích lũy theo thời gian.
- **Nghi ngờ:** Supabase Realtime channels (`board-feed-realtime` @ `src/features/board/use-board-feed.ts`, `board-highlights-realtime` @ `src/features/board/use-highlights.ts`) invalidate `boardFeedKeys.all` → refetch RSC/query `/board` fail lặp. Có thể query `kudos_public`/RLS/realtime publication lỗi.
- **Cần agent:** đọc dev-server log lúc load /board để lấy stack 500; kiểm query board feed + spotlight + RLS trên `kudos`/`kudos_public`/`hearts`. (Chưa curl được body: cookie e2e/.auth hết hạn.)
- **File nghi:** `src/features/board/board-queries.ts`, `use-board-feed.ts`, `use-spotlight.ts`, `use-highlights.ts`.

### #2 — [GLOBAL] Avatar 400 (dicebear SVG) — mọi màn
- **Hiện tượng:** `GET /_next/image?url=https://api.dicebear.com/7.x/avataaars/svg?...` → 400.
- **Root cause:** `next.config.ts` allow hostname `api.dicebear.com` nhưng **thiếu `images.dangerouslyAllowSVG: true`** → next/image từ chối SVG.
- **Tác động phụ:** avatar fail → component fallback render **alt text** → badge tên user **tràn/vỡ ô** ở header (thấy trên /board, /profile — mọi authed page).
- **Fix gợi ý:** thêm `dangerouslyAllowSVG: true` (+ `contentDispositionType: 'attachment'`, CSP) HOẶC đổi dicebear sang endpoint PNG (`/png` thay `/svg`).

### #3 — [DATA] Thiếu seed kudos/hearts
- Không phải BE lỗi, nhưng khiến board/profile/spotlight/feed rỗng → **không verify được layout populated**.
- **Cần:** seed mock kudos + hearts (BE agent hoặc seed script) HOẶC FE mock (xem kế hoạch FE dưới).

## Kế hoạch FE (ẩn BE lỗi/thiếu data → mock) — chờ user duyệt
Áp convention đã chốt (`.claude/rules/ui-first-gate.md`): mỗi feature rỗng/lỗi → `src/features/{feature}/mocks/{screen}.mock.ts` (mockFull/Empty/Error) + hook đọc `?ui_state=` (dev-only). Ưu tiên:
1. **board** (lỗi nặng nhất) — mock feed/highlight/spotlight/sidebar để test UI dù BE 500.
2. **profile** — mock kudos list + stats.
3. Avatar — dùng ảnh mock local thay dicebear để hết 400 khi test.
Các màn khác (awards/secret-box/notifications/homepage) BE OK → chỉ cần mock data rỗng khi cần.

## Resolution — debug-code 2026-08-05 (all BE fixed + verified)

Root-cause 500 /board **KHÔNG phải** realtime/RLS/query như nghi ban đầu. Stack thật (dev log):
`⨯ Error: A "use server" file can only export async functions, found object` @ `app/board/page/actions.js` (server-actions loader). → mọi POST /board server action 500 lúc module-eval, lặp vì 3 hook × react-query retry.

- **#1 [FIXED]** `src/features/board/board-department-queries.ts` (`'use server'`) export `departmentIdSchema` (Zod = object) — dead code, không import đâu. Xóa hẳn schema + import `z`. → POST /board 200 (verified browser: 12→27 POST đều 200, 0×500).
- **[NEW/FIXED]** Sau khi #1 hết, log lộ `listDepartments() → permission denied for table departments`. RCA: migration `20260804040000` tạo RLS policy nhưng **quên `grant select ... to authenticated`** (RLS lọc row sau khi đã có table-privilege). Fix: migration `20260805030000_grant_departments_select.sql` + apply live. → listDepartments 200.
- **#2 [FIXED]** avatar 400: `next.config.ts` thiếu `dangerouslyAllowSVG` cho dicebear SVG. Thêm `dangerouslyAllowSVG:true` + `contentDispositionType:'attachment'` + CSP `script-src 'none'; sandbox`. → `/_next/image` dicebear 200.
- **#3** thiếu seed kudos/hearts — KHÔNG phải bug, để FE mock/seed riêng.

Verify cuối: `/board` authed = **0 console error, 0 HTTP 500** (trước 36×500 + avatar 400). Không sửa FE — chỉ BE (server action, DB migration, next config).
