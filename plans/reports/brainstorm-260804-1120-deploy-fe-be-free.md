# Consultation — Deploy FE + BE (free, internal, stable)

**Date:** 2026-08-04 · **Lens:** CTO · **Status:** Design sealed

## The Commission

Deploy AIDD (SAA 2025 internal) from local-only to a live, **free**, **stable internal link**.
Both tracks: FE (Next.js 16) + BE (Supabase). "Easy data migration" = schema + reference data,
re-seeded via existing scripts (not a full row copy of dev-generated data).

## Decisions (from clarification)

- **Data scope:** schema (13 migrations) + reference/seed data only. Dev-generated kudos/hearts dropped.
- **FE host:** Vercel (Hobby, free) — native for Next.js App Router + Server Actions + middleware.
- **BE host:** Supabase Cloud (free tier) — the app IS built on Supabase; no real alternative.
- **Auth:** Google OAuth must work in production. Dev-login toggle OFF in prod.
- **Purpose:** free, internal link, stable. No paid tier unless free limits bite.

## Agreed Architecture

```
GitHub repo ──push──▶ Vercel (Next.js SSR + Server Actions)
                          │  env: NEXT_PUBLIC_SUPABASE_*, SERVICE_ROLE, GOOGLE_*, EVENT_START_AT
                          ▼
                    Supabase Cloud (free project)
                    Postgres + Auth + RLS + RPC + Realtime + Storage
```

**Data migration path:** `supabase link` → `supabase db push` (replays 13 migrations) →
run `seed.sql` (hashtags/config) + `seed-auth-users.mjs` against cloud (GoTrue admin API).
Reproducible, no manual SQL.

## What to Watch (real risks)

1. **Google OAuth = 3 places, all must agree** (top failure mode):
   - Google Cloud Console → authorized redirect URI = `https://<ref>.supabase.co/auth/v1/callback`
   - Supabase → Auth → URL Config: Site URL + Redirect URLs include the Vercel prod domain
   - App `auth/callback/route.ts` must redirect to the prod origin, not localhost
2. **Dev-login toggle:** `NEXT_PUBLIC_ENABLE_DEV_LOGIN` must be unset/false in Vercel prod — it's an auth bypass.
3. **Service role key:** only in Vercel server env + seed step. Never client-exposed. Never committed.
4. **Supabase free tier limits:** DB pauses after ~7 days of inactivity; 500MB DB cap.
   For a "stable" event link, plan a keep-warm ping or accept manual resume. Flag before go-live.
5. **Realtime (kudos):** verify the `supabase_realtime` publication migration applied on cloud.
6. **Env parity:** `.env.local` is gitignored — every key must be re-entered in Vercel dashboard.

## How Success Is Measured

- Vercel prod URL loads; login (Google + email/password) works end-to-end.
- Kudos create → appears realtime; hearts, secret-box, event countdown all function per spec.
- RLS enforced (no anon leak); dev-login unavailable in prod.
- Migrations + seed reproducible from clean cloud project.

## Next Steps

- Draft full phased deploy plan via `/tkm:create-plan` (BE provision → data migrate → FE deploy → auth wiring → smoke test).
- Evidence gate: actual deploy needs a SEALED verdict in the plan's `evidence/` dir.

## Open Questions

- Keep-warm strategy for Supabase free-tier pause — decide at plan time (cron ping vs manual vs accept).
- Custom domain vs default `*.vercel.app` — defaulting to `*.vercel.app` unless you want a domain.
