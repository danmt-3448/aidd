# Phase 02 — Mock-fixture infra dùng chung

**Track:** Infra · **Priority:** CRITICAL · **Status:** pending · **blockedBy:** — (chạy song song phase-01)

## Vì sao

BE đã wire vào 8/11 màn ([board/page.tsx:18-22](../../src/app/board/page.tsx#L18-L22), [awards:21](../../src/app/awards/page.tsx#L21), [notifications:17](../../src/app/notifications/page.tsx#L17), [profile:2](../../src/app/profile/page.tsx#L2)) → gate đang chấm UI xuyên qua BE. Thiệt hại đã xảy ra: [ui-gate-260805-board.md](../reports/ui-gate/ui-gate-260805-board.md) FAIL vì **36× lỗi 500 từ Supabase Realtime** — bug BE giết verdict UI.

Cơ chế tách hiện chỉ có ở `/board`. 9 màn còn lại không có fixture → nhóm B (4 state) không kiểm được → FAIL tự động theo `.claude/rules/ui-first-gate.md`.

## Thiết kế — nhân rộng pattern đã chạy được của /board

Ba mảnh hiện có, giữ nguyên kiến trúc:
1. **Proxy bypass** — [proxy.ts:26-31](../../src/proxy.ts#L26-L31) đã generic (bắt mọi route có `?ui_state=`). **Không cần sửa.**
2. **Hook đọc param** — [use-ui-state-override.ts](../../src/features/board/use-ui-state-override.ts) đang nằm trong `features/board/` → **hoist lên `src/lib/ui-state-override.ts`** để mọi feature dùng chung (DRY). Sửa import ở board.
3. **Fixture file** — convention `src/features/{feature}/mocks/{screen}.mock.ts` export `mockFull` / `mockEmpty` / `mockError`. `/countdown` đã đúng convention; `/board` đang để `src/features/board/board-mock.ts` (410 dòng) → **di chuyển về `src/features/board/mocks/board.mock.ts`** cho nhất quán.

**Điểm nối vào UI:** component `*-connected.tsx` gọi hook, có override thì render từ fixture, bỏ qua props từ server + không mở realtime channel — y như [board-connected.tsx:41](../../src/features/board/components/board-connected.tsx#L41) đang làm.

## Files

**Tạo:** `src/lib/ui-state-override.ts` · `src/features/{profile,homepage,kudos,notifications}/mocks/*.mock.ts`
**Sửa:** `src/features/board/use-ui-state-override.ts` (xoá sau khi hoist) · các `*-connected.tsx` tương ứng
**Di chuyển:** `src/features/board/board-mock.ts` → `src/features/board/mocks/board.mock.ts`

> **KHÔNG tạo fixture cho `/awards`** — `awards/page.tsx` là Server Component, data từ `award-config.ts` (static), `supabase-files=0`. Không xuyên qua BE → không cần tách. Phase-03 sửa thuần UI, không phụ thuộc phase này.

> **`/kudos` không có `*-connected.tsx`** — modal `KudoComposeModal` do state `composeOpen` ở [board-screen.tsx:76](../../src/features/board/components/board-screen.tsx#L76) điều khiển (mở tại `:169`). **(fix RT-13/Scope-7: KHÔNG nhét logic đọc query param vào `board-screen.tsx` production — file có 31 phụ thuộc.)** Thay vào đó: dev-only wrapper (kiểu [board-connected.tsx:41](../../src/features/board/components/board-connected.tsx#L41)) đọc `?modal=compose` ở tầng proxy rồi truyền `initialComposeOpen` **dạng prop** vào board-screen. Prop do test-harness lái, không cần guard `NODE_ENV` nhúng trong component. Chi tiết chấm ở phase-08.

## Steps

1. Hoist hook → `src/lib/ui-state-override.ts`, giữ nguyên guard `NODE_ENV !== 'production'`. Sửa import board, `tsc --noEmit`.
2. Chuẩn hoá vị trí `board.mock.ts`, cập nhật import.
3. Mỗi màn còn lại: tạo fixture + nối vào `*-connected.tsx`. **Content lấy từ Figma** (`get_frame_image` + `get_node`) — không bịa.
4. **Density phải bằng Figma** — rule bất di của gate. `/profile` hiện app cao 1104px vs Figma 4660px = thiếu hẳn data; fixture phải lấp đủ (kudos list + stats + badges) mới chấm visual được.
5. Verify mỗi màn: `?ui_state=full|empty|error|loading` ra 4 kết quả KHÁC nhau + `browser_console_messages` sạch.

## Success criteria

- [ ] 1 hook duy nhất ở `src/lib/`, không còn bản sao trong feature
- [ ] Mọi màn trong scope trả đúng 4 state qua `?ui_state=`
- [ ] `?ui_state=full` render **không phát sinh request Supabase nào** (kiểm bằng `browser_network_requests`)
- [ ] Density khớp Figma: `/profile` cao xấp xỉ 4660px, không còn 1104px
- [ ] `tsc --noEmit` sạch

## Rủi ro

| Rủi ro | Đối phó |
|---|---|
| RSC vẫn gọi `createClient().auth.getUser()` dù có `ui_state` | Chấp nhận: trả `user=null`, Connected dùng fixture. Chỉ short-circuit ở page nếu đo thấy có request DB thật. |
| Fixture phình > 200 dòng (board đã 410) | Tách theo nhóm dữ liệu (`feed`, `spotlight`, `leaderboard`) trong `mocks/`, không nhồi 1 file. |
| Mock lệch shape với type thật → tsc đỏ | Fixture phải import type từ chính module đang dùng, không khai lại interface. |

## Next

Gỡ chặn phase-06 (`/profile`), phase-07 (`/board`), phase-08 (`/kudos`).
