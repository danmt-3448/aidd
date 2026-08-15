---
title: Seed demo data (make Category-B screens lively)
work_type: feature
track: B
status: planned
blockedBy: [01, 06]
blocks: []
spec_source: momorph:i87tDx10uM,MaZUn5xHXZ,3FoIx6ALVb,J3-4YFIpMM,8PJQswPZmU
---

# Phase 07b — Seed demo data (Track B · tooling)

## Context Links
- Recon: `plans/reports/check-progress-260803-1636-remaining-screens.md` (Nhóm B: màn động không có đường tạo data in-app).
- Gap: phase-15 xoá mock fixtures + success = "renders real data"; DB không có content → màn rỗng. No phase creates that content today (chỉ event_config 1 row + 10 test users).
- Infra sẵn: `supabase/seed-auth-users.mjs` (service role, idempotent), `npm run seed:auth`, `db:reset`.
- Validate gate: `plans/reports/validate-260803-2035-phase-07b-seed.md` (predict-risks + review — 3 fix đã áp).

## Overview
- **Priority:** P1 · **Status:** planned
- Bơm **content demo** để các màn Nhóm B (Homepage bell · Live board feed/carousel/word-cloud/leaderboard ·
  Profile stats/badges · Secret box · Countdown) render data thật, đẹp, ngay sau `db:reset`.
- **Ràng buộc tối thượng: KHÔNG được sửa/xoá data do user/app tạo.** Seed chỉ *cộng thêm*, không đụng row có sẵn.

## Key Insights
- **Phải là JS script (service role), KHÔNG phải SQL migration.** Content FK tới `profiles` (do `seed:auth`
  tạo *sau* migrations) → SQL trong reset chạy trước profiles = FK fail. Script chạy **sau `seed:auth`**,
  resolve user id từ bảng `profiles` lúc runtime.
- **Idempotent bằng ON CONFLICT DO NOTHING + fixed demo-UUID namespace**, KHÔNG bằng delete-then-insert.
  Mọi demo row mang id literal `dddddddd-…` → phân biệt tuyệt đối với `gen_random_uuid()` của data thật,
  auditable. **KHÔNG có đường xoá demo** (xem npm scripts — cascade risk).
- **`db:reset` = WIPE toàn DB** (đã vậy từ trước). Seed gắn sau reset chỉ chạy trên DB fresh. `seed:demo`
  đứng riêng phải an toàn khi chạy trên DB *đang có data thật* (chỉ thêm phần thiếu).
- `kudos.id` KHÔNG có default → seed cấp id demo trực tiếp → `on conflict (id) do nothing` chuẩn.
- Nuôi màn nào: `kudos`+`kudo_hashtags`+`hearts` → Live board + Profile feed/stats; `secret_box`(count>0)
  + `secret_box_badges` → Secret box + Profile counter; `notifications`(unread) → Homepage bell.

## Requirements
### Script `supabase/seed-demo-data.mjs` (service role, idempotent, insert-only)
Resolve 10 user id từ `profiles` (fixed `11111111-…-000N`) lúc runtime — **KHÔNG hardcode**.
**Scope cứng: chỉ demo↔demo trong tập 10 user này — TUYỆT ĐỐI không insert row nào trỏ tới user ngoài tập**
(để aggregate của user thật không bị phồng). Insert với demo namespace `dddddddd-…`:
- **kudos** ~24 rows: receiver đa dạng (An nhận nhiều nhất → top rank), created_at rải 14 ngày,
  **≥3 `is_anonymous=true`** (verify masking), content_html ngắn hợp lệ. `on conflict (id) do nothing`.
- **kudo_hashtags**: mỗi kudo 1–3 hashtag (từ 12 hashtag seed sẵn `aaaaaaaa-…`). `on conflict (kudo_id, hashtag_id) do nothing` (theo PK bảng).
- **hearts** ~50 rows: user tim kudo người khác — **tôn trọng `sender≠self` + PK(user,kudo)**;
  phân bố lệch để top-5 carousel có thứ hạng. `on conflict do nothing`.
- **secret_box** ~5 user: `unopened_box_count` 1–3. **`on conflict (user_id) do nothing`** — TUYỆT ĐỐI
  không update (count là state tiêu thụ = data tạo).
- **secret_box_badges** vài user 1–2 badge: `badge_key` **dùng chung một nguồn duy nhất với phase-06**
  (`badgeAsset` allowlist) → phase này `blockedBy: [01, 06]` để tránh drift. id demo cố định + `on conflict (id) do nothing`.
- **notifications** 2–4 unread cho vài user (trigger phase-03 chưa build → insert thẳng), id demo cố định + `on conflict (id) do nothing`.
- **event_config:** đường `seed:demo` **KHÔNG chạm** (row đã có). Việc chỉnh countdown tách hẳn thành
  script + lệnh riêng — xem "Countdown demo" bên dưới.

### npm scripts
- `seed:demo` = `node --env-file=.env.local supabase/seed-demo-data.mjs` (opt-in, an toàn trên DB có data).
- `db:reset` = nối `&& npm run seed:demo` **sau** `seed:auth` (fresh DB).
- **KHÔNG có `seed:demo:clean`.** Muốn bỏ demo → `db:reset` (đã wipe toàn DB). Lý do: `hearts.kudo_id`
  là `ON DELETE CASCADE` → xoá demo kudo sẽ cascade xoá cả heart THẬT trỏ vào nó = phá data tạo.

### Countdown demo (TÁCH RỜI — opt-in, chạy tay; KHÔNG thuộc `seed:demo`/`db:reset`)
- Script riêng `supabase/demo-countdown-soon.mjs` (service role). Một việc duy nhất:
  `update public.event_config set event_start_at = now() + (interval từ arg, default 5 phút), updated_at = now() where id = 1`.
- npm `demo:countdown-soon` = `node --env-file=.env.local supabase/demo-countdown-soon.mjs [phút]`.
- **Tách hoàn toàn:** KHÔNG nối vào `seed:demo` hay `db:reset` — chỉ chạy tay khi cần demo cảnh countdown
  về `00:00:00` + mở khoá nav, hoặc muốn thấy giờ/phút thay vì ~29 ngày.
- An toàn: chỉ đụng singleton *config* `id=1` (không phải data user tạo). Idempotent (mỗi lần chạy set lại mốc theo `now()`).
- **Revert:** chạy lại với datetime launch thật (thêm arg/flag khôi phục). **KHÔNG dùng `db:reset` để revert
  nếu DB có data thật** — reset wipe toàn bộ.
- **Ảnh hưởng rộng:** `event_config` là nguồn dùng chung → đổi cả **Countdown LẪN Homepage** countdown;
  nav-lock bật toàn cục tới khi về `00:00:00`. → chỉ chạy tay trên **DB dev/throwaway**, KHÔNG chạy trên shared/staging/prod.

## Architecture — thứ tự chạy
```
db:reset → supabase db reset (migrations + seed.sql: hashtags + event_config row)
         → seed:auth  (10 users → profiles qua trigger)
         → seed:demo  ← MỚI: resolve profiles → insert kudos/hearts/secret_box/badges/notifications
                         (fixed demo UUID · on-conflict-do-nothing · KHÔNG update/delete · demo↔demo)
```

## Related Code Files
- **Create:** `supabase/seed-demo-data.mjs`; `supabase/demo-countdown-soon.mjs` (tách rời).
- **Modify:** `package.json` (`seed:demo` nối vào `db:reset`; `demo:countdown-soon` **đứng riêng**, không nối chuỗi).
- **Delete:** none.

## Implementation Steps
1. Script service-role: load env, resolve 10 profile id, guard thiếu user → exit rõ ràng.
2. Insert theo thứ tự FK: kudos → kudo_hashtags → hearts → secret_box → secret_box_badges → notifications,
   mỗi bước `on conflict do nothing`, id demo literal, chỉ tham chiếu trong tập 10 user.
3. Validate business rules trước khi insert hearts (bỏ cặp sender==self).
4. Wire npm scripts; nối `db:reset` sau `seed:auth`.
5. Chạy trên DB fresh + verify; chạy lại lần 2 → 0 thay đổi (idempotent).

## Todo
- [ ] `seed-demo-data.mjs` (service role, resolve profiles runtime, insert-only, fixed demo namespace, demo↔demo)
- [ ] kudos + kudo_hashtags (≥3 anonymous) · hearts (sender≠self) · secret_box (count>0, no-update) · badges (badge_key chung phase-06) · notifications
- [ ] npm `seed:demo`; `db:reset` nối sau `seed:auth`
- [ ] `demo-countdown-soon.mjs` + npm `demo:countdown-soon [phút]` — TÁCH RỜI, không nối vào seed/reset

## Success Criteria (binary)
- [ ] Sau `db:reset`: Live board có feed + carousel top-5 + word-cloud; Profile stats ≠ 0; Secret box mở được; Homepage bell có badge.
- [ ] **Chạy `seed:demo` lần 2 → 0 row bị đổi/xoá** (chỉ insert phần thiếu; idempotent).
- [ ] **Chạy `seed:demo` trên DB đã có kudo/heart THẬT → không một row user-created nào bị sửa/xoá** (chỉ cộng demo).
- [ ] Seed **chỉ tham chiếu 10 seeded user** (không insert row trỏ tới user ngoài tập); id resolve runtime từ `profiles`.
- [ ] Không có `UPDATE`/`DELETE`/`TRUNCATE` ở đường seed; không tồn tại lệnh `seed:demo:clean`.
- [ ] ≥1 anonymous kudo → verify board/profile không lộ sender.
- [ ] `demo:countdown-soon` là lệnh riêng — KHÔNG xuất hiện trong chuỗi `seed:demo` hay `db:reset`; chỉ đụng `event_config.id=1`.

## Risk Assessment
| Risk | Likelihood | Impact | Countermeasure |
|------|-----------|--------|----------------|
| Ghi đè state đã tiêu thụ (secret_box count) | Med | **High** | `on conflict (user_id) do nothing`; cấm update count |
| Xoá nhầm data thật (cascade từ hearts.kudo_id) | Med | **High** | **Bỏ hẳn đường xoá demo**; reset chỉ bằng `db:reset` |
| Demo id trùng data thật | Very Low | High | Namespace `dddddddd-…` literal vs `gen_random_uuid()` |
| Aggregate user thật bị phồng bởi demo | Med | Med | Scope demo↔demo; không trỏ tới user ngoài tập |
| `badge_key` lệch allowlist phase-06 | Med | Med | `blockedBy: [01, 06]`; dùng chung nguồn hằng |
| FK fail (profiles chưa có) | Med | Med | Chạy sau `seed:auth`; resolve từ `profiles`, guard thiếu user |
| hearts vi phạm sender≠self / PK | Med | Low | Lọc cặp self trước insert; `on conflict do nothing` |

## Security Considerations
- Service role chỉ dùng ở seed dev (env `.env.local`), không vào bundle app. Không seed secret thật.
- Anonymous masking do view `kudos_public` lo; seed chỉ set `is_anonymous` — không tự unmask.

## Next Steps
- **Nên hoàn tất trước bước verify của phase-15** ("Every screen renders real data") để tránh màn rỗng.
  Không hard-block 15 (15 chỉ cần hook/compile), nhưng demo data là điều kiện để pass mắt thường + demo.

## MoMorph refs:
- Homepage: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Profile: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Secret box: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/J3-4YFIpMM
- Countdown: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/8PJQswPZmU
- Clarifications: plans/260803-1636-saa2025-remaining-7-screens/clarifications.md
