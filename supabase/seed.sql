-- Seed data for development / local testing (SQL portion).
-- Idempotent: safe to run multiple times (on conflict do nothing).
--
-- ⚠️  AUTH USERS ARE NOT SEEDED HERE.
--     Raw INSERT into auth.users leaves GoTrue token columns NULL, which breaks
--     sign-in ("invalid credentials"). Seed users via the GoTrue admin API instead:
--       npm run seed:auth      (or: npm run db:reset  →  db reset + seed:auth)
--     See supabase/seed-auth-users.mjs. profiles rows are created by the
--     handle_new_user trigger when those users are inserted by the admin API.
--
-- Run: supabase db reset  (applies migrations then this file — hashtags only)

-- ============================================================
-- Hashtag catalog
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

-- ============================================================
-- Secret Box grants for demo users
-- ============================================================
-- profiles rows are created by the handle_new_user trigger when seed:auth runs.
-- Supabase db reset runs seed.sql AFTER migrations but BEFORE seed:auth, so
-- profiles rows do NOT yet exist at this point. The secret_box rows therefore
-- cannot be inserted here (FK → profiles.id would fail).
--
-- Resolution: secret_box grants are inserted by seed-auth-users.mjs AFTER the
-- admin API creates each user (and the trigger creates their profiles row).
-- See the NOTE in seed-auth-users.mjs — grants are applied there, not here.
--
-- This comment is left as the authoritative record of WHY this section is empty.
