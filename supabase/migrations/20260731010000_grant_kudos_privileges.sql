-- Grant table/function privileges to the `authenticated` role.
-- The create_profiles / create_kudos migrations enabled RLS + policies but never
-- GRANTed DML — so PostgREST requests (which run as `authenticated`) hit
-- "permission denied for table ...". RLS still gates WHICH rows; these grants gate
-- whether the role may touch the table at all. Surfaced by live login testing:
-- searchRecipients/listHashtags/createKudo all failed without these.

-- Read paths
grant select on public.profiles to authenticated;
grant select on public.hashtags to authenticated;

-- Kudo write paths (RLS policies still enforce sender = auth.uid(), etc.)
grant select, insert on public.kudos         to authenticated;
grant select, insert on public.kudo_hashtags to authenticated;
grant select, insert on public.kudo_images   to authenticated;

-- RPC is SECURITY INVOKER → caller needs EXECUTE
grant execute on function public.create_kudo(uuid, uuid, text, boolean, text, uuid[], text[])
  to authenticated;
