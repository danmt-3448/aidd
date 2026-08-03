-- event_config: singleton row (id always = 1) storing event-level config.
-- Used by: phase-02 (countdown), homepage.
-- Rollback: drop table if exists public.event_config cascade;

create table if not exists public.event_config (
  id                        smallint    primary key default 1 check (id = 1),
  event_start_at            timestamptz not null,
  hearts_special_multiplier int         not null default 1,
  updated_at                timestamptz not null default now()
);

-- RLS: authenticated may SELECT; no client writes.
alter table public.event_config enable row level security;

create policy "event_config_select_authenticated"
  on public.event_config
  for select
  to authenticated
  using (true);

-- GRANT: mirrors 20260731010000 precedent — gate table-level access.
grant select on public.event_config to authenticated;

-- Seed the singleton row (placeholder; TZ=Asia/Ho_Chi_Minh).
-- On conflict do nothing so db:reset is idempotent.
insert into public.event_config (id, event_start_at, hearts_special_multiplier, updated_at)
values (1, '2026-09-01 00:00:00+07', 1, now())
on conflict (id) do nothing;
