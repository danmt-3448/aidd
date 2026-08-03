-- secret_box: one row per user tracking unopened box count.
-- secret_box_badges: records badges earned when a box is opened.
-- Client may only SELECT own rows; all mutations go through DEFINER RPC (phase-06).
-- Rollback: drop table if exists public.secret_box_badges cascade;
--           drop table if exists public.secret_box cascade;

create table if not exists public.secret_box (
  user_id           uuid    primary key references public.profiles (id) on delete cascade,
  unopened_box_count int    not null default 0 check (unopened_box_count >= 0),
  updated_at        timestamptz not null default now()
);

create table if not exists public.secret_box_badges (
  id        uuid        primary key default gen_random_uuid(),
  user_id   uuid        not null references public.profiles (id) on delete cascade,
  badge_key text        not null,
  opened_at timestamptz not null default now()
);

-- ============================================================
-- RLS
-- ============================================================

alter table public.secret_box        enable row level security;
alter table public.secret_box_badges enable row level security;

-- secret_box: SELECT own row only; no client INSERT/UPDATE/DELETE.
create policy "secret_box_select_own"
  on public.secret_box
  for select
  to authenticated
  using (auth.uid() = user_id);

-- secret_box_badges: SELECT own rows only; no client INSERT.
create policy "secret_box_badges_select_own"
  on public.secret_box_badges
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- GRANTs: SELECT only — mutations are DEFINER RPC (phase-06).
-- ============================================================

grant select on public.secret_box        to authenticated;
grant select on public.secret_box_badges to authenticated;
