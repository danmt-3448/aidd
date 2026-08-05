-- departments: master list of Sun* internal departments.
-- Replaces the bare integer profiles.department_id with a proper FK.
--
-- Schema decision (20260804):
--   profiles.department_id is an integer with no FK and is only used as a
--   display label in profile-hero. Converting that column type in a live
--   migration (int → uuid) would require a full table rewrite and break any
--   existing data. Least-disruptive path: add profiles.department_ref uuid
--   as a new nullable FK column. Board filter joins through department_ref.
--   The legacy department_id integer stays for backward compat until a
--   future migration explicitly drops it.
--
-- UUID note: fixed UUIDs below are RFC 4122 v4 compliant (version nibble = 4,
-- variant nibble = 8-b) so they pass Zod z.string().uuid() validation in the
-- application layer when returned from listDepartments() and used as URL params.

-- ── departments table ────────────────────────────────────────────────────────

create table if not exists public.departments (
  id          uuid        primary key default gen_random_uuid(),
  name        text        unique not null,
  created_at  timestamptz not null default now()
);

-- RLS: any authenticated user can read department names.
alter table public.departments enable row level security;

create policy "departments_select_authenticated"
  on public.departments
  for select
  to authenticated
  using (true);

-- ── FK column on profiles ────────────────────────────────────────────────────

alter table public.profiles
  add column if not exists department_ref uuid references public.departments(id) on delete set null;

-- ── Seed: canonical Sun* departments ────────────────────────────────────────
-- Fixed RFC 4122 v4 UUIDs so re-runs and backfill SQL stay deterministic.

insert into public.departments (id, name) values
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marketing'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'CEVC10'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'DXVC'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'Engineering'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'HR'),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'Finance'),
  ('a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77', 'Design')
on conflict (id) do nothing;

-- ── Backfill: assign seed users to departments (round-robin for demo variety) ──
-- Seed users have fixed UUIDs 11111111-0000-0000-0000-00000000000N.
-- This runs after departments are inserted, so FK refs are safe.

update public.profiles set department_ref = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' where id = '11111111-0000-0000-0000-000000000001';
update public.profiles set department_ref = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' where id = '11111111-0000-0000-0000-000000000002';
update public.profiles set department_ref = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' where id = '11111111-0000-0000-0000-000000000003';
update public.profiles set department_ref = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' where id = '11111111-0000-0000-0000-000000000004';
update public.profiles set department_ref = 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55' where id = '11111111-0000-0000-0000-000000000005';
update public.profiles set department_ref = 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66' where id = '11111111-0000-0000-0000-000000000006';
update public.profiles set department_ref = 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77' where id = '11111111-0000-0000-0000-000000000007';
update public.profiles set department_ref = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' where id = '11111111-0000-0000-0000-000000000008';
update public.profiles set department_ref = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' where id = '11111111-0000-0000-0000-000000000009';
update public.profiles set department_ref = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' where id = '11111111-0000-0000-0000-000000000010';
-- Note: UPDATE on profiles rows that don't yet exist (pre-seed:auth) silently
-- affects 0 rows, which is safe. seed-auth-users.mjs runs after db:reset, so
-- this backfill will find the rows only if seed:auth has already run once.
-- A second db:reset+seed:auth cycle will re-apply these UPDATEs correctly.
