-- Read-only database role for agent/tooling introspection.
--
-- Problem: agents inspect the DB via `psql` with full-privilege credentials — one
-- fat-fingered statement can mutate data. A dedicated SELECT-only role bounds the
-- blast radius of automated introspection (local dev only).
--
-- Strategy:
--   • Idempotent role creation: roles are CLUSTER-global and survive `supabase db reset`
--     (which drops the database, not the cluster). A bare CREATE ROLE would error
--     "role already exists" on every reset after the first, breaking `npm run db:reset`.
--     Guard with a pg_roles existence check.
--   • Cover BOTH existing tables (GRANT ... ON ALL TABLES) and future tables
--     (ALTER DEFAULT PRIVILEGES). ALTER DEFAULT PRIVILEGES only applies to objects
--     created by the role running it, so the explicit ALL-TABLES grant is what
--     guarantees coverage regardless of table owner.
--   • NOLOGIN, no password: the role cannot be connected to directly — there is no
--     credential to leak or hardcode. Introspect by connecting as a superuser
--     (e.g. `postgres`) and then `SET ROLE aidd_readonly;` to drop into read-only
--     mode for the session. This also keeps the migration safe if it ever reaches a
--     hosted/prod cluster: it creates a login-less, write-less role, not an exposed
--     weak-credential account.
--   • RLS caveat: aidd_readonly is a non-superuser role, so SELECT on RLS-enabled
--     tables (e.g. profiles, kudos) returns only rows the table's policies permit —
--     typically none without a matching policy. This role is meant for SCHEMA and
--     non-RLS introspection; it is intentionally NOT granted BYPASSRLS (that would
--     widen data exposure). Add BYPASSRLS deliberately only if data-row introspection
--     is required.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aidd_readonly') THEN
    CREATE ROLE aidd_readonly NOLOGIN;
  END IF;
END
$$;

-- Let the local admin role assume aidd_readonly via SET ROLE. In Supabase, `postgres`
-- is NOT a superuser, so SET ROLE is denied unless postgres is a MEMBER of the target
-- role. Grant membership (idempotent — re-GRANT is a NOTICE, not an error, so it is
-- reset-safe). This is what makes `SET ROLE aidd_readonly` work for introspection.
GRANT aidd_readonly TO postgres;

-- Read the public schema (via SET ROLE from the postgres session — see header).
GRANT USAGE ON SCHEMA public TO aidd_readonly;

-- Existing tables (any owner) — the guarantee for current schema.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO aidd_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO aidd_readonly;

-- Future tables created by the migration runner role inherit SELECT automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO aidd_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO aidd_readonly;

-- Explicitly ensure NO write privileges leak in (defensive; role starts with none).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM aidd_readonly;
