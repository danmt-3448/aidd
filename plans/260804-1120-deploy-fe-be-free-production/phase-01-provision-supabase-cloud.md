# Phase 01 — Provision Supabase Cloud

**Priority:** High · **Status:** pending · **Depends on:** — · **Owner role:** deployer

## Goal
Create a free Supabase Cloud project and capture the four connection values the rest of the deploy needs.

## Context Links
- Consultation: `plans/reports/brainstorm-260804-1120-deploy-fe-be-free.md`
- Local config: `supabase/config.toml`

## Steps
1. Log in at https://supabase.com → **New project**. Region: closest to your users (e.g. Singapore for VN). Set a strong DB password (save it in a password manager — needed for CLI link).
2. Wait for provisioning (~2 min). Note the **project ref** (the `<ref>` in `<ref>.supabase.co`).
3. **Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secret — server only)
4. **Settings → Database → Connection string** → copy the URI → this is the cloud `SUPABASE_DB_URL` (used by CLI/seed).
5. Store all four locally in an **uncommitted** `.env.production.local` (gitignored) for the migrate/seed step — do NOT put them in `.env.local` (that's your local dev).

## Todo
- [ ] Project created, ref noted
- [ ] URL + anon + service_role captured
- [ ] DB connection string captured
- [ ] Values saved to gitignored `.env.production.local`

## Success Criteria
Four values in hand; `supabase projects list` (after `supabase login`) shows the new project.

## Risks
- **Service-role key is admin-level** — never paste into client code, chat, or a committed file. Treat like a root password.
- Region choice is permanent — pick right the first time (VN users → Singapore/Tokyo).

## Next
Phase 02 (migrate schema+seed) and Phase 03 (deploy FE) can both start once these values exist.
