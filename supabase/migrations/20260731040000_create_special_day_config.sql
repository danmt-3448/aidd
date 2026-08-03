-- special_day_config: per-date heart multiplier overrides.
-- Keyed on event_date (date PK); no FK to event_config needed.
-- Rollback: drop table if exists public.special_day_config cascade;

create table if not exists public.special_day_config (
  event_date        date primary key,
  hearts_multiplier int  not null default 1
);

-- RLS: authenticated may SELECT; no client writes (admin-only via service role / direct DB).
alter table public.special_day_config enable row level security;

create policy "special_day_config_select_authenticated"
  on public.special_day_config
  for select
  to authenticated
  using (true);

-- GRANT
grant select on public.special_day_config to authenticated;
