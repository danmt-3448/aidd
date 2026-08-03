-- hearts: one heart per user per kudo; self-heart prohibited.
-- PK(user_id, kudo_id) is the unique guard — no separate UNIQUE constraint needed.
-- Self-heart is blocked by the INSERT RLS policy (subqueries not allowed in CHECK constraints).
-- Rollback: drop table if exists public.hearts cascade;

create table if not exists public.hearts (
  user_id        uuid        not null references public.profiles (id) on delete cascade,
  kudo_id        uuid        not null references public.kudos (id) on delete cascade,
  liked_at       timestamptz not null default now(),
  is_special_day boolean     not null default false,
  primary key (user_id, kudo_id)
);

-- Index for efficient heart-count aggregation by kudo (ranking queries in phase-04).
create index if not exists hearts_kudo_id_idx on public.hearts (kudo_id);

-- RLS
alter table public.hearts enable row level security;

-- SELECT: any authenticated user may see hearts (for heart counts on the board).
create policy "hearts_select_authenticated"
  on public.hearts
  for select
  to authenticated
  using (true);

-- INSERT: caller must be the user_id row; self-heart also blocked by CHECK above.
create policy "hearts_insert_own"
  on public.hearts
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from public.kudos k
      where k.id = kudo_id and k.sender_id = auth.uid()
    )
  );

-- DELETE: caller may remove their own heart.
create policy "hearts_delete_own"
  on public.hearts
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- GRANT: authenticated needs SELECT + INSERT + DELETE; writes still gated by RLS.
grant select, insert, delete on public.hearts to authenticated;
