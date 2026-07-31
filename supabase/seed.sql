-- Seed data for development / local testing.
-- Idempotent: safe to run multiple times (on conflict do nothing).
--
-- ⚠️  profiles.id is a FK → auth.users(id).
--     Insert auth.users first; trigger handle_new_user auto-creates profiles rows.
--
-- Run: supabase db reset  (applies migrations then seed.sql)
--      OR: psql ... -f supabase/seed.sql

-- ============================================================
-- 1.  Test Sunners  (auth.users → profiles via trigger)
-- ============================================================
-- We use fixed UUIDs so seed is idempotent across resets.
-- raw_user_meta_data carries full_name + avatar_url consumed by handle_new_user().

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at,
  role, aud
)
values
  (
    '11111111-0000-0000-0000-000000000001',
    'nguyen.van.an@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Nguyễn Văn An", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenVanAn"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '11111111-0000-0000-0000-000000000002',
    'tran.thi.binh@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Trần Thị Bình", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=TranThiBinh"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '11111111-0000-0000-0000-000000000003',
    'le.van.cuong@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Lê Văn Cường", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=LeVanCuong"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '11111111-0000-0000-0000-000000000004',
    'pham.thi.dung@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Phạm Thị Dung", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=PhamThiDung"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '11111111-0000-0000-0000-000000000005',
    'hoang.van.em@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Hoàng Văn Em", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=HoangVanEm"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '11111111-0000-0000-0000-000000000006',
    'vo.thi.phuong@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Võ Thị Phương", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=VoThiPhuong"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '11111111-0000-0000-0000-000000000007',
    'dang.van.giang@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Đặng Văn Giang", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=DangVanGiang"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '11111111-0000-0000-0000-000000000008',
    'bui.thi.huong@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Bùi Thị Hương", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=BuiThiHuong"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '11111111-0000-0000-0000-000000000009',
    'dinh.van.ien@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Đinh Văn Iên", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=DinhVanIen"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  ),
  (
    '11111111-0000-0000-0000-000000000010',
    'ngo.thi.khanh@sun-asterisk.com',
    crypt('TestPass123!', gen_salt('bf')),
    now(),
    '{"full_name": "Ngô Thị Khánh", "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=NgoThiKhanh"}'::jsonb,
    now(), now(), 'authenticated', 'authenticated'
  )
on conflict (id) do nothing;

-- ============================================================
-- 2.  Hashtag catalog
-- ============================================================

insert into public.hashtags (id, name)
values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'TeamWork'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Support'),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'Innovation'),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'Leadership'),
  ('aaaaaaaa-0000-0000-0000-000000000005', 'Ownership'),
  ('aaaaaaaa-0000-0000-0000-000000000006', 'GoAbove'),
  ('aaaaaaaa-0000-0000-0000-000000000007', 'CustomerFirst'),
  ('aaaaaaaa-0000-0000-0000-000000000008', 'Mentorship'),
  ('aaaaaaaa-0000-0000-0000-000000000009', 'Quality'),
  ('aaaaaaaa-0000-0000-0000-000000000010', 'Agility'),
  ('aaaaaaaa-0000-0000-0000-000000000011', 'Collaboration'),
  ('aaaaaaaa-0000-0000-0000-000000000012', 'WellDone')
on conflict (id) do nothing;
