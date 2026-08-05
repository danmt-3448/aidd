-- Fix: grant SELECT on departments to authenticated.
--
-- Migration 20260804040000_create_departments.sql created the RLS policy
-- `departments_select_authenticated` but never issued the table-level GRANT.
-- In Postgres an RLS policy only filters rows AFTER the role already holds
-- the table privilege — without GRANT SELECT the authenticated role gets
-- "permission denied for table departments", which surfaced as a failing
-- listDepartments() (board department filter). Board is auth-guarded, so only
-- `authenticated` needs read access (no anon grant — YAGNI).
--
-- Rollback: revoke select on public.departments from authenticated;

grant select on public.departments to authenticated;
