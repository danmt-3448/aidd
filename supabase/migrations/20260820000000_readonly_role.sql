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
--   • Password is a fixed local-only placeholder — NOT a real secret, NEVER for prod.
--     Supabase hosted manages its own roles; this migration is for local dev.

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'aidd_readonly') THEN
    CREATE ROLE aidd_readonly LOGIN PASSWORD 'changeme_local_only';
  END IF;
END
$$;

-- Connect + read the public schema.
GRANT USAGE ON SCHEMA public TO aidd_readonly;

-- Existing tables (any owner) — the guarantee for current schema.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO aidd_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO aidd_readonly;

-- Future tables created by the migration runner role inherit SELECT automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO aidd_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO aidd_readonly;

-- Explicitly ensure NO write privileges leak in (defensive; role starts with none).
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM aidd_readonly;
