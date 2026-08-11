# Runtime probes — mẫu SQL/behavior chứng minh rule (dùng khi `--runtime`)

Chạy trên **local Supabase** (`postgresql://postgres:postgres@127.0.0.1:54322/postgres`). Bật DB: `npm run db:reset` (schema + seed). Rule sửa dữ liệu → bọc `begin; ... rollback;` để không bẩn seed. Đây là **pattern**, chỉnh tên bảng/cột theo screen.

## Nguyên tắc
- Mỗi probe = 1 assertion: chạy → đọc lại số/kết quả → so kỳ vọng. In `PASS`/`FAIL` rõ.
- Set caller identity khi RLS/`auth.uid()` chi phối: `set local role authenticated; set local request.jwt.claims = '{"sub":"<uuid>"}';` (hoặc gọi RPC qua PostgREST với JWT test user từ `npm run seed:auth`).
- Ưu tiên probe **lớp lỗi static hay bỏ sót**: race/concurrency, aggregation đơn vị (count vs weighted), TZ/date-boundary, cascade.

## Mẫu theo loại rule

### Idempotency / race (toggle)
```sql
-- kỳ vọng: gọi 2 lần → trạng thái lật, KHÔNG lỗi unique_violation (23505)
begin;
select toggle_heart('<kudo_id>');  -- liked=true
select toggle_heart('<kudo_id>');  -- kỳ vọng liked=false, không exception
rollback;
```
Concurrency thật (race) cần 2 kết nối song song — dùng 2 `psql` background cùng gọi `toggle_heart` cùng lúc; kỳ vọng không có PK error rơi ra client.

### Aggregation đơn vị (count vs weighted) — vd special-day +2
```sql
begin;
-- tạo 1 heart thường + 1 heart special-day cho kudos mà :U là receiver
insert into hearts(user_id, kudo_id, is_special_day) values ('<liker1>','<kudoA>',false);
insert into hearts(user_id, kudo_id, is_special_day) values ('<liker2>','<kudoB>',true);
-- kỳ vọng hearts_received = 1 + 2 = 3 (KHÔNG phải count=2)
select hearts_received from profile_stats where user_id = '<U>';
rollback;
```

### Access control (self-action)
```sql
-- kỳ vọng: sender thả tim kudo của mình → bị chặn (RLS/RPC raise), không insert được
begin;
set local request.jwt.claims = '{"sub":"<senderUid>"}';
insert into hearts(user_id, kudo_id, is_special_day) values ('<senderUid>','<ownKudo>',false); -- kỳ vọng lỗi
rollback;
```

### FK / receiver tồn tại
```sql
-- kỳ vọng: create_kudo với receiver không tồn tại → P-code thân thiện, KHÔNG lỗi FK thô lọt ra
select create_kudo('<uuid-not-a-profile>', '<content>', array['<tag>']::uuid[], '{}'::text[], false, null, null, '<danh_hieu>');
```

### Date/timezone boundary (special-day theo ngày)
```sql
-- kiểm current_date dùng TZ nào; nếu server UTC mà event VN (+7) → ranh giới ngày lệch 7h
show timezone;
select current_date, (now() at time zone 'Asia/Ho_Chi_Minh')::date as vn_date;  -- kỳ vọng khớp ngày special theo VN
```

### Unlike revoke đúng
```sql
begin;
insert into hearts(user_id,kudo_id,is_special_day) values ('<L>','<kudoB>',true);
select hearts_received from profile_stats where user_id='<U>';  -- +2
delete from hearts where user_id='<L>' and kudo_id='<kudoB>';
select hearts_received from profile_stats where user_id='<U>';  -- kỳ vọng trừ đúng 2, về mốc cũ
rollback;
```

## Behavior (FE) — cần hydrate
Interactive (click toggle, disable self-like nút) KHÔNG verify được trên dev Turbopack headless → chạy `next build && next start` rồi Playwright. Xem `[[ui-gate-turbopack-headless-hydration]]`.
