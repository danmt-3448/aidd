-- event_config anon read: the launch time (`event_start_at`) is public info —
-- it is shown on the /countdown screen to everyone, and the pre-launch gate in
-- proxy.ts must read it for UNAUTHENTICATED visitors to redirect them to
-- /countdown before launch. Grant anon SELECT (no secret columns exposed).
--
-- Rollback:
--   drop policy if exists "event_config_select_anon" on public.event_config;
--   revoke select on public.event_config from anon;

create policy "event_config_select_anon"
  on public.event_config
  for select
  to anon
  using (true);

grant select on public.event_config to anon;
