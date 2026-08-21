---
title: i18n cho tất cả các page (VN/EN)
status: completed
work_type: deliverable
spec_waived: internal-refactor — không có feature spec mới; chỉ trích chuỗi hardcode ra i18n catalog. UI/behavior không đổi ở locale mặc định (vi).
created: 260813-1108
branch: develop
blockedBy: []
blocks: []
coordination: >
  Touches board/* components (Phase 04-06). Plans 260812-1355-spotlight-board (pending)
  và 260806-0711-ui-pixel-parity-fix (in_progress) cũng chạm board. i18n chỉ đổi
  text-literal → t(), KHÔNG đổi visual ở locale vi mặc định → không hard-block, chỉ
  cần tránh chạy đồng thời trên cùng file board. Nếu 2 plan kia active → làm i18n board sau.
---

# i18n cho tất cả các page

## Mục tiêu
Trích **toàn bộ** chuỗi hardcode tiếng Việt (kể cả prose dài rules/awards) ra i18n
catalog theo namespace; thay bằng `useTranslations`/`getTranslations`. VN = **verbatim**
text hiện có (UI + test không đổi). EN = **dịch chuẩn nghĩa** từ VN (không bịa nội dung).

## Kiến trúc chốt — parallel-safe qua per-feature message files
Hạ tầng next-intl đã có (cookie `NEXT_LOCALE`, vi mặc định). **Không dựng lại.**
Vấn đề: N subagent song song cùng ghi `messages/vi.json` + `en.json` (monolith) → xung đột.
**Giải:** tách catalog thành **per-feature file** — `messages/{vi,en}/{feature}.json`.
Mỗi phase feature sở hữu **file JSON riêng + component riêng** ⇒ 0 tranh chấp.
`src/i18n/request.ts` merge tất cả file (viết **một lần** ở Phase 00, pre-wire sẵn mọi feature).

```
messages/vi/  common.json auth.json awards.json board.json board-spotlight.json
              board-sidebar.json errors.json home.json kudos.json notifications.json
              profile.json rules.json secret-box.json event.json
messages/en/  (mirror y hệt danh sách trên)
```
Mỗi file = 1+ top-level namespace. request.ts: `{ ...(await import(`../../messages/${locale}/common.json`)).default, ... }`.

## Quy ước key (BẮT BUỘC — mọi phase theo đúng)
- Namespace = feature (camelCase): `common`,`language`,`auth`,`awards`,`board`,`spotlight`,`highlight`,`leaderboard`,`boardStats`,`boardFilters`,`userCard`,`errors`,`home`,`kudos`,`notifications`,`profile`,`rules`,`secretBox`,`event`,`countdown`.
- Key: camelCase mô tả, nested theo section/component. ICU cho biến/số nhiều: `{name}`, `{count, plural, ...}`.
- **VN verbatim** — copy đúng ký tự chuỗi cũ (giữ UI + test pass). **EN accurate**, không thêm ý.
- Chuỗi dùng chung (nav, nút Hủy/Gửi/Đóng, "Bản quyền…", language) → `common` — DRY, không lặp mỗi feature.

## Phases
| # | Phase | Owns (JSON file · namespace) | Parallel |
|---|-------|------------------------------|----------|
| 00 | [Foundation: split catalog + rewire request.ts](phase-00-foundation-message-catalog.md) | request.ts, messages/**, migrate 5 ns cũ | — (blocks all) |
| 01 | [auth](phase-01-auth.md) | auth.json · `auth` (+ dev-login) | ✓ |
| 02 | [awards](phase-02-awards.md) | awards.json · `awards` | ✓ |
| 03 | [homepage](phase-03-homepage.md) | home.json · `home` | ✓ |
| 04 | [board-main](phase-04-board-main.md) | board.json · `board` (feed/card/kv) | ✓ |
| 05 | [board-spotlight](phase-05-board-spotlight.md) | board-spotlight.json · `spotlight`,`highlight` | ✓ |
| 06 | [board-sidebar](phase-06-board-sidebar.md) | board-sidebar.json · `leaderboard`,`boardStats`,`boardFilters`,`userCard` | ✓ |
| 07 | [kudos](phase-07-kudos.md) | kudos.json · `kudos` | ✓ |
| 08 | [profile](phase-08-profile.md) | profile.json · `profile` | ✓ |
| 09 | [notifications](phase-09-notifications.md) | notifications.json · `notifications` | ✓ |
| 10 | [rules](phase-10-rules.md) | rules.json · `rules` (prose dài) | ✓ |
| 11 | [secret-box](phase-11-secret-box.md) | secret-box.json · `secretBox` | ✓ |
| 12 | [errors](phase-12-errors.md) | errors.json · `errors` (+ app/error, not-found) | ✓ |
| 13 | [Integration + verify](phase-13-integration-verify.md) | key-parity script, tsc, build, runtime switch | — (blockedBy 01-12) |

**Dependency:** 01–12 đều `blockedBy: [00]`, KHÔNG blocks/blockedBy lẫn nhau. 13 `blockedBy: [01..12]`.

## Definition of Done
1. Không còn chuỗi hardcode VN trong `.tsx` các feature (trừ data/test cố ý).
2. `messages/vi/**` và `messages/en/**` **cùng bộ key** (script parity exit 0), EN đã dịch.
3. `npx tsc --noEmit` + `npm run build` PASS.
4. Đổi language-switcher → toàn bộ page render đúng ngôn ngữ; vi giữ nguyên chữ cũ (UI/test không đổi).
5. Reviewer chạy sau khi merge các phase.
