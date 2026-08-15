-- seed-demo-data.sql — demo content for the 5 dynamic screens (board/profile/kudos/secret-box/homepage).
-- Runs AFTER `db:reset` (schema + seed.sql departments/hashtags + seed:auth 30 users + secret_box grants).
-- Idempotent: deletes by two id-prefix patterns, then re-inserts.
--   • dddddddd-0000-…  (original range — old version-0 kudo ids)
--   • cccccccc-0000-4000-8000-…  (new v4-format kudo ids for the extended set)
-- Hearts + kudo_hashtags + kudo_images cascade-delete from kudos.
--
-- User ids:
--   Original 10:  11111111-0000-0000-0000-<12-digit-n>
--   New 20:       0000000N-0000-4000-8000-<12-digit-N>  (N hex, 0b–1e)
-- All 30 users are referenced below for word-cloud density.

begin;

-- ── 0. Clean prior demo run ───────────────────────────────────────────────────
delete from public.kudos where id::text like 'dddddddd-0000-0000-0000-%';
delete from public.kudos where id::text like 'cccccccc-0000-4000-8000-%';

-- ── 1a. Event LIVE (past start) ───────────────────────────────────────────────
update public.event_config set event_start_at = now() - interval '2 days';

-- ── 1b. Special-day config for TODAY ──────────────────────────────────────────
insert into public.special_day_config (event_date, hearts_multiplier)
values (current_date, 2)
on conflict (event_date) do update set hearts_multiplier = excluded.hearts_multiplier;

-- ── 2. Kudos across 30 users (v4-format ids: cccccccc-0000-4000-8000-…) ───────
-- sender = (g%30)+1 mapped to user N · receiver = ((g+7)%30)+1 (offset 7 > sender, always distinct)
-- ~1/7 anonymous · danh_hieu cycles the 4 Hero tiers · created_at descending by g.
-- User id mapping: 1-10 → 11111111-…-<n>, 11-30 → 0000000N-…-<N> (hex offset 0x0a = 10).
-- We use a helper approach: embed the user ids directly via CASE expressions.

-- Helper CTE for 30 user IDs in order (1-indexed for modular arithmetic below).
-- PostgreSQL arrays are 1-indexed natively.
with users(n, uid) as (
  values
    ( 1, '11111111-0000-0000-0000-000000000001'::uuid),
    ( 2, '11111111-0000-0000-0000-000000000002'::uuid),
    ( 3, '11111111-0000-0000-0000-000000000003'::uuid),
    ( 4, '11111111-0000-0000-0000-000000000004'::uuid),
    ( 5, '11111111-0000-0000-0000-000000000005'::uuid),
    ( 6, '11111111-0000-0000-0000-000000000006'::uuid),
    ( 7, '11111111-0000-0000-0000-000000000007'::uuid),
    ( 8, '11111111-0000-0000-0000-000000000008'::uuid),
    ( 9, '11111111-0000-0000-0000-000000000009'::uuid),
    (10, '11111111-0000-0000-0000-000000000010'::uuid),
    (11, '0000000b-0000-4000-8000-00000000000b'::uuid),
    (12, '0000000c-0000-4000-8000-00000000000c'::uuid),
    (13, '0000000d-0000-4000-8000-00000000000d'::uuid),
    (14, '0000000e-0000-4000-8000-00000000000e'::uuid),
    (15, '0000000f-0000-4000-8000-00000000000f'::uuid),
    (16, '00000010-0000-4000-8000-000000000010'::uuid),
    (17, '00000011-0000-4000-8000-000000000011'::uuid),
    (18, '00000012-0000-4000-8000-000000000012'::uuid),
    (19, '00000013-0000-4000-8000-000000000013'::uuid),
    (20, '00000014-0000-4000-8000-000000000014'::uuid),
    (21, '00000015-0000-4000-8000-000000000015'::uuid),
    (22, '00000016-0000-4000-8000-000000000016'::uuid),
    (23, '00000017-0000-4000-8000-000000000017'::uuid),
    (24, '00000018-0000-4000-8000-000000000018'::uuid),
    (25, '00000019-0000-4000-8000-000000000019'::uuid),
    (26, '0000001a-0000-4000-8000-00000000001a'::uuid),
    (27, '0000001b-0000-4000-8000-00000000001b'::uuid),
    (28, '0000001c-0000-4000-8000-00000000001c'::uuid),
    (29, '0000001d-0000-4000-8000-00000000001d'::uuid),
    (30, '0000001e-0000-4000-8000-00000000001e'::uuid)
)
insert into public.kudos (id, sender_id, receiver_id, content_html, is_anonymous, anonymous_name, danh_hieu, created_at)
select
  -- v4-format kudo id: cccccccc-0000-4000-8000-<12-digit g>
  ('cccccccc-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
  s.uid,
  r.uid,
  '<p>' || (array[
    'Cảm ơn bạn đã hỗ trợ dự án hết mình!',
    'Làm việc rất chuyên nghiệp và tận tâm.',
    'Bạn đã giúp cả team vượt deadline khó.',
    'Tinh thần trách nhiệm cao, đáng học hỏi.',
    'Cảm ơn vì đã luôn sẵn sàng giúp đỡ mọi người.',
    'Kỹ năng giải quyết vấn đề của bạn thật xuất sắc.',
    'Cảm ơn vì luôn giữ thái độ tích cực cho cả nhóm.',
    'Bạn đã chia sẻ kiến thức rất hữu ích trong tuần này.',
    'Sự hỗ trợ kịp thời của bạn đã cứu cả sprint.',
    'Luôn deliver đúng hạn — cực kỳ đáng tin cậy!'
  ])[(g % 10) + 1] || '</p>',
  (g % 7 = 0),
  case when (g % 7 = 0)
       then (array['Người giấu tên', 'Sunner bí ẩn', 'Đồng nghiệp thầm lặng'])[(g % 3) + 1]
       else null end,
  (array['New Hero', 'Rising Hero', 'Super Hero', 'Legend Hero'])[(g % 4) + 1],
  now() - ((g * 1) || ' hours')::interval
from generate_series(1, 60) g
join users s on s.n = (g % 30) + 1
join users r on r.n = ((g + 7) % 30) + 1
where s.uid <> r.uid;

-- ── 3. Hashtags: ~2/3 of kudos get 1–2 hashtags (good mix of with/without) ───
-- Hashtag ids: aaaaaaaa-0000-0000-0000-<12-digit n>, n = 1..12.
insert into public.kudo_hashtags (kudo_id, hashtag_id)
select ('cccccccc-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       ('aaaaaaaa-0000-0000-0000-' || lpad(((g % 12) + 1)::text, 12, '0'))::uuid
from generate_series(1, 60) g
where g % 3 <> 0   -- ~40 of 60 get a first hashtag
on conflict do nothing;

insert into public.kudo_hashtags (kudo_id, hashtag_id)
select ('cccccccc-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
       ('aaaaaaaa-0000-0000-0000-' || lpad((((g + 5) % 12) + 1)::text, 12, '0'))::uuid
from generate_series(1, 60) g
where g % 2 = 0 and g % 3 <> 0   -- ~20 of those get a second hashtag
on conflict do nothing;

-- ── 3b. Minimal kudos — no hashtag, short content, no image (cards 901–905) ──
insert into public.kudos (id, sender_id, receiver_id, content_html, is_anonymous, anonymous_name, danh_hieu, created_at)
values
  ('cccccccc-0000-4000-8000-000000000901'::uuid,
   '11111111-0000-0000-0000-000000000002'::uuid,
   '0000000b-0000-4000-8000-00000000000b'::uuid,
   '<p>Cảm ơn!</p>', false, null, 'New Hero',
   now() - interval '62 hours'),
  ('cccccccc-0000-4000-8000-000000000902'::uuid,
   '0000000c-0000-4000-8000-00000000000c'::uuid,
   '11111111-0000-0000-0000-000000000003'::uuid,
   '<p>Bạn làm tốt lắm.</p>', false, null, 'Rising Hero',
   now() - interval '64 hours'),
  ('cccccccc-0000-4000-8000-000000000903'::uuid,
   '0000000d-0000-4000-8000-00000000000d'::uuid,
   '11111111-0000-0000-0000-000000000007'::uuid,
   '<p>Teamwork tuyệt vời!</p>', false, null, 'Super Hero',
   now() - interval '66 hours'),
  ('cccccccc-0000-4000-8000-000000000904'::uuid,
   '11111111-0000-0000-0000-000000000005'::uuid,
   '0000000e-0000-4000-8000-00000000000e'::uuid,
   '<p>Luôn hỗ trợ kịp thời.</p>', false, null, 'Legend Hero',
   now() - interval '68 hours'),
  ('cccccccc-0000-4000-8000-000000000905'::uuid,
   '0000000f-0000-4000-8000-00000000000f'::uuid,
   '11111111-0000-0000-0000-000000000009'::uuid,
   '<p>Rất đáng tin cậy.</p>', false, null, 'New Hero',
   now() - interval '70 hours');

-- ── 3c. Long-content kudos (cards 906–907) ────────────────────────────────────
insert into public.kudos (id, sender_id, receiver_id, content_html, is_anonymous, anonymous_name, danh_hieu, created_at)
values
  ('cccccccc-0000-4000-8000-000000000906'::uuid,
   '00000010-0000-4000-8000-000000000010'::uuid,
   '11111111-0000-0000-0000-000000000010'::uuid,
   '<p>Bạn đã mang lại nguồn cảm hứng lớn cho cả team trong suốt sprint vừa qua. Từ lúc kick-off đến khi release, bạn luôn giữ vững tinh thần tích cực, giải quyết từng blockers một cách bình tĩnh và khoa học. Mỗi khi team cần support, bạn đều có mặt — không phải chỉ về mặt kỹ thuật mà còn về mặt tinh thần. Xin chân thành cảm ơn vì đã đóng góp hết mình cho dự án và cho tập thể Sun* luôn vững mạnh.</p>',
   false, null, 'Legend Hero',
   now() - interval '72 hours'),
  ('cccccccc-0000-4000-8000-000000000907'::uuid,
   '00000011-0000-4000-8000-000000000011'::uuid,
   '11111111-0000-0000-0000-000000000001'::uuid,
   '<p>Cảm ơn bạn đã luôn sẵn sàng pair-programming cùng mình trong những buổi debug kéo dài. Bạn không chỉ giải quyết được các vấn đề kỹ thuật phức tạp mà còn giải thích rất rõ ràng để mình hiểu gốc rễ vấn đề. Tinh thần chia sẻ kiến thức của bạn giúp cả team level-up rõ rệt. Chúc bạn luôn phát triển và tiếp tục truyền lửa cho đồng đội nhé!</p>',
   false, null, 'Super Hero',
   now() - interval '74 hours');

insert into public.kudo_hashtags (kudo_id, hashtag_id)
values
  ('cccccccc-0000-4000-8000-000000000906'::uuid, 'aaaaaaaa-0000-0000-0000-000000000001'::uuid),
  ('cccccccc-0000-4000-8000-000000000907'::uuid, 'aaaaaaaa-0000-0000-0000-000000000002'::uuid),
  ('cccccccc-0000-4000-8000-000000000907'::uuid, 'aaaaaaaa-0000-0000-0000-000000000005'::uuid)
on conflict do nothing;

-- ── 3d. Image-bearing kudos (cards 910–913, with kudo_images rows) ────────────
-- These will show the image gallery. Storage placeholder paths reference the
-- upload done by seed-kudo-real-images.mjs (run separately after db:reset).
-- Inserted here so the kudo_images FK rows are valid even before upload.
insert into public.kudos (id, sender_id, receiver_id, content_html, is_anonymous, anonymous_name, danh_hieu, created_at)
values
  ('cccccccc-0000-4000-8000-000000000910'::uuid,
   '11111111-0000-0000-0000-000000000001'::uuid,
   '0000000c-0000-4000-8000-00000000000c'::uuid,
   '<p>Cảm ơn vì đã chia sẻ bức ảnh kỷ niệm team dinner tuyệt vời!</p>',
   false, null, 'Super Hero',
   now() - interval '76 hours'),
  ('cccccccc-0000-4000-8000-000000000911'::uuid,
   '11111111-0000-0000-0000-000000000003'::uuid,
   '0000000d-0000-4000-8000-00000000000d'::uuid,
   '<p>Bức ảnh bạn chụp lại buổi retrospect thật ý nghĩa với cả nhóm.</p>',
   false, null, 'Rising Hero',
   now() - interval '78 hours'),
  ('cccccccc-0000-4000-8000-000000000912'::uuid,
   '0000000e-0000-4000-8000-00000000000e'::uuid,
   '11111111-0000-0000-0000-000000000005'::uuid,
   '<p>Cảm ơn vì đã ghi lại khoảnh khắc ship thành công — lịch sử của team!</p>',
   false, null, 'Legend Hero',
   now() - interval '80 hours'),
  ('cccccccc-0000-4000-8000-000000000913'::uuid,
   '00000012-0000-4000-8000-000000000012'::uuid,
   '11111111-0000-0000-0000-000000000008'::uuid,
   '<p>Ảnh team meeting luôn nhắc mình nhớ đây là một team tuyệt vời!</p>',
   false, null, 'New Hero',
   now() - interval '82 hours');

-- Hashtags for image kudos
insert into public.kudo_hashtags (kudo_id, hashtag_id)
values
  ('cccccccc-0000-4000-8000-000000000910'::uuid, 'aaaaaaaa-0000-0000-0000-000000000003'::uuid),
  ('cccccccc-0000-4000-8000-000000000911'::uuid, 'aaaaaaaa-0000-0000-0000-000000000007'::uuid),
  ('cccccccc-0000-4000-8000-000000000912'::uuid, 'aaaaaaaa-0000-0000-0000-000000000010'::uuid)
on conflict do nothing;

-- kudo_images rows — storage_path matches upload convention {sender_uid}/{kudo_id}/{file}.png.
-- Actual PNG files are uploaded by seed-kudo-real-images.mjs. These rows are safe to insert
-- before the upload; the UI renders <img src> via storage URL and shows nothing if the
-- file does not exist yet (no broken render — img just shows nothing or fallback).
insert into public.kudo_images (kudo_id, storage_path, sort_order)
values
  ('cccccccc-0000-4000-8000-000000000910'::uuid,
   '11111111-0000-0000-0000-000000000001/cccccccc-0000-4000-8000-000000000910/photo1.png', 0),
  ('cccccccc-0000-4000-8000-000000000911'::uuid,
   '11111111-0000-0000-0000-000000000003/cccccccc-0000-4000-8000-000000000911/photo1.png', 0),
  ('cccccccc-0000-4000-8000-000000000912'::uuid,
   '0000000e-0000-4000-8000-00000000000e/cccccccc-0000-4000-8000-000000000912/photo1.png', 0),
  ('cccccccc-0000-4000-8000-000000000913'::uuid,
   '00000012-0000-4000-8000-000000000012/cccccccc-0000-4000-8000-000000000913/photo1.png', 0)
on conflict do nothing;

-- ── 4. Hearts: varied counts; ~1/3 of users heart each kudo; some special-day ─
-- Source kudos: main batch g=1..60 (ids cccccccc-…-<g>).
-- Hearter user index: 1–10 (original users only for simplicity; new users heart manually above).
-- Never heart your own kudo (tracked by sender = (g%30)+1; user u+1 ≠ sender index).
insert into public.hearts (user_id, kudo_id, is_special_day, liked_at)
select
  ('11111111-0000-0000-0000-' || lpad(u::text, 12, '0'))::uuid,
  ('cccccccc-0000-4000-8000-' || lpad(g::text, 12, '0'))::uuid,
  (g % 4 = 0 and u % 2 = 0),
  now() - ((g + u) || ' hours')::interval
from generate_series(1, 60) g
cross join generate_series(1, 10) u
-- Exclude hearter == sender: sender index = (g % 30) + 1; for u in 1..10, sender_n = (g%30)+1.
-- When (g%30)+1 <= 10, sender is one of the original 10 users → skip that u.
where u <> (g % 30) + 1
  and (u + g) % 3 = 0
on conflict (user_id, kudo_id) do nothing;

-- Hearts for extra kudos (901–907, 910–913) — sparse engagement
insert into public.hearts (user_id, kudo_id, is_special_day, liked_at)
values
  ('11111111-0000-0000-0000-000000000001'::uuid, 'cccccccc-0000-4000-8000-000000000901'::uuid, false, now() - interval '63 hours'),
  ('11111111-0000-0000-0000-000000000003'::uuid, 'cccccccc-0000-4000-8000-000000000902'::uuid, false, now() - interval '65 hours'),
  ('11111111-0000-0000-0000-000000000002'::uuid, 'cccccccc-0000-4000-8000-000000000906'::uuid, true,  now() - interval '73 hours'),
  ('11111111-0000-0000-0000-000000000004'::uuid, 'cccccccc-0000-4000-8000-000000000906'::uuid, false, now() - interval '73 hours'),
  ('11111111-0000-0000-0000-000000000001'::uuid, 'cccccccc-0000-4000-8000-000000000907'::uuid, false, now() - interval '75 hours'),
  ('11111111-0000-0000-0000-000000000003'::uuid, 'cccccccc-0000-4000-8000-000000000907'::uuid, true,  now() - interval '75 hours'),
  ('11111111-0000-0000-0000-000000000002'::uuid, 'cccccccc-0000-4000-8000-000000000910'::uuid, false, now() - interval '77 hours'),
  ('11111111-0000-0000-0000-000000000004'::uuid, 'cccccccc-0000-4000-8000-000000000910'::uuid, true,  now() - interval '77 hours'),
  ('11111111-0000-0000-0000-000000000005'::uuid, 'cccccccc-0000-4000-8000-000000000911'::uuid, false, now() - interval '79 hours'),
  ('11111111-0000-0000-0000-000000000006'::uuid, 'cccccccc-0000-4000-8000-000000000912'::uuid, true,  now() - interval '81 hours'),
  ('11111111-0000-0000-0000-000000000007'::uuid, 'cccccccc-0000-4000-8000-000000000913'::uuid, false, now() - interval '83 hours')
on conflict (user_id, kudo_id) do nothing;

-- ── 5. Secret box: one user with 0 boxes to exercise the empty/disabled state ─
update public.secret_box
   set unopened_box_count = 0
 where user_id = '11111111-0000-0000-0000-000000000010';

commit;

-- ── Summary ───────────────────────────────────────────────────────────────────
select
  (select count(*) from public.profiles)              as total_users,
  (select count(*) from public.kudos)                 as kudos,
  (select count(*) from public.kudos where is_anonymous)   as anon_kudos,
  (select count(*) from public.hearts)                as hearts,
  (select count(*) from public.hearts where is_special_day) as special_hearts,
  (select count(*) from public.kudo_hashtags)         as kudo_hashtags,
  (select count(*) from public.kudo_images)           as kudo_images,
  (select count(distinct kudo_id) from public.kudo_images) as kudos_with_images;
