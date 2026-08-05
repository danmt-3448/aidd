---
title: Deploy AIDD (FE + BE) to free/stable internal production
status: pending
priority: high
work_type: deliverable
spec_waived: ops/deployment runbook — no product feature; config-only, zero code changes
created: 2026-08-04
branch: main
blockedBy: []
blocks: []
phases:
  - phase-01-provision-supabase-cloud
  - phase-02-migrate-schema-and-seed
  - phase-03-deploy-frontend-vercel
  - phase-04-wire-google-oauth-and-harden
  - phase-05-smoke-test-and-keep-warm
---

# Plan: Deploy AIDD (FE + BE) — free, internal, stable

Take AIDD from local-only to a live internal URL. **Free end-to-end**: Next.js 16 → Vercel Hobby,
Supabase-local → Supabase Cloud free tier. Data migration = replay 13 migrations + re-seed reference
data (no dev-row copy). **Zero code changes** — auth callback/OAuth redirect already domain-agnostic;
dev-login is 404-by-default in prod. This is a config/ops runbook.

Consultation: `plans/reports/brainstorm-260804-1120-deploy-fe-be-free.md`

## Architecture

```
GitHub repo ──git push──▶ Vercel (Next.js SSR + Server Actions + middleware)
                             │  env: NEXT_PUBLIC_SUPABASE_*, SERVICE_ROLE, GOOGLE_*, EVENT_START_AT
                             ▼
                        Supabase Cloud (free)  →  Postgres + Auth + RLS + RPC + Realtime + Storage
```

Sequential by nature: BE must exist before data migrates; FE needs the BE URL; auth needs the FE domain.

## Phases

| # | Phase | Depends on | Status |
|---|-------|-----------|--------|
| 01 | [Provision Supabase Cloud](phase-01-provision-supabase-cloud.md) | — | pending |
| 02 | [Migrate schema + seed](phase-02-migrate-schema-and-seed.md) | 01 | pending |
| 03 | [Deploy FE to Vercel](phase-03-deploy-frontend-vercel.md) | 01 | pending |
| 04 | [Wire Google OAuth + harden](phase-04-wire-google-oauth-and-harden.md) | 02, 03 | pending |
| 05 | [Smoke test + keep-warm](phase-05-smoke-test-and-keep-warm.md) | 04 | pending |

## Key Decisions (sealed in consultation)

- FE=Vercel Hobby; BE=Supabase Cloud free tier. Both free.
- Data = schema (`supabase db push`) + reseed (`seed.sql` + `seed-auth-users.mjs`). No dev-row copy.
- Google OAuth live in prod, **dedicated prod OAuth client** (separate from dev). `NEXT_PUBLIC_ENABLE_DEV_LOGIN` unset in prod (auth bypass).
- **Production branch = `main`** (merge `develop` → `main`; prod deploys from `main`, no separate staging).
- Keep-warm: internal use — **cron ping if setup is trivial** (external cron hitting the URL), else manual resume.
- Default `*.vercel.app` subdomain (no custom domain unless asked).

## Critical Risks (baked into phases)

1. **Google OAuth = 3 places must agree** — Google Console redirect → Supabase `/auth/v1/callback`;
   Supabase Site+Redirect URLs → Vercel domain; app already handles origin. (Phase 04)
2. **`NEXT_PUBLIC_ENABLE_DEV_LOGIN`** must be absent in Vercel — leaving it `true` ships an auth bypass. (Phase 04)
3. **`SUPABASE_SERVICE_ROLE_KEY`** server-only; never client, never committed. `.env.local` is gitignored → re-enter all keys in Vercel. (Phase 03)
4. **Supabase free tier pauses after ~7 days idle** + 500MB cap — keep-warm decision. (Phase 05)
5. **Realtime** — verify `supabase_realtime` publication present on cloud (kudos depends on it). (Phase 02)

## Setup Progress (pre-deploy)

Done early (config that won't change):
- ✅ Supabase Cloud project created — ref `ngsvtvfhgtarbzvlfyrz`, region Asia-Pacific. DB password saved offline (not in repo).
- ✅ Google OAuth **prod** client "SAA Prod" created; redirect URI = `https://ngsvtvfhgtarbzvlfyrz.supabase.co/auth/v1/callback`.
- ✅ Supabase → Auth → Google provider enabled with the prod client id/secret.
- ✅ Supabase CLI v2.110 installed (login pending — do at deploy time).

**Deferred until schema stable / deploy time** (avoids migration drift while `saa2025-remaining-7-screens` still in progress):
- ⏸️ Phase 02 `supabase login` → `link` → `db push` → seed. Push is incremental; run once schema settles.

Not yet started: Phase 03 (Vercel), Phase 04 (Supabase Site/Redirect URLs — needs Vercel domain), Phase 05.

## Definition of Done

Prod URL loads; Google + email/password login work; kudos realtime + hearts + secret-box + countdown
function per spec; RLS enforced; dev-login 404 in prod; migrations+seed reproducible from clean project.

> Evidence gate: actual push/deploy needs a SEALED verdict in `evidence/`. Run smoke test (phase 05) → record verdict before calling deploy done.
