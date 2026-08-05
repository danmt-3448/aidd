# Phase 03 — Deploy FE to Vercel

**Priority:** High · **Status:** pending · **Depends on:** 01 · **Owner role:** deployer / fe-developer

## Goal
Ship the Next.js 16 app to Vercel Hobby with GitHub auto-deploy and the full env-var set. No code changes.

## Context Links
- `next.config.ts` (next-intl plugin — no special export config; SSR default, correct for Vercel)
- Env keys used in code: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `EVENT_START_AT`, `GOOGLE_CLIENT_ID/SECRET`

## Steps
1. Merge `develop` → `main` and push to GitHub `origin`. **Production branch = `main`** (no separate staging).
2. Vercel → **Add New → Project** → import the GitHub repo. Framework auto-detected as Next.js. Build command `next build`, output default — accept.
3. **Set Environment Variables** (Production scope) — `.env.local` is gitignored, so every key is entered by hand:
   | Key | Value | Notes |
   |-----|-------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | cloud URL | public |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | cloud anon | public |
   | `SUPABASE_SERVICE_ROLE_KEY` | cloud service_role | **secret, server-only** |
   | `EVENT_START_AT` | event start ISO | as in local |
   | `GOOGLE_CLIENT_ID` | OAuth client id | set in Phase 04 too |
   | `GOOGLE_CLIENT_SECRET` | OAuth client secret | **secret** |
   | `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | **DO NOT SET** | absence → dev-login 404 in prod |
4. Deploy. Note the assigned `*.vercel.app` domain — this is the prod origin used in Phase 04.
5. Confirm the build passes (`next build`) and the home page renders (auth flows verified in Phase 05).

## Todo
- [ ] Production branch chosen, repo imported
- [ ] All env vars set (Production scope); `NEXT_PUBLIC_ENABLE_DEV_LOGIN` intentionally omitted
- [ ] Build green, `*.vercel.app` domain noted
- [ ] Home page loads (no runtime env errors in Vercel logs)

## Success Criteria
Deployment succeeds; app reachable at `*.vercel.app`; no missing-env errors in function logs.

## Risks
- **Missing/typo'd env var** → Server Actions or Supabase client throw at runtime. Cross-check names against the table.
- **Committing secrets** — never add keys to the repo to "make the build see them"; use the Vercel dashboard only.
- **Wrong branch deployed** — set the Production branch explicitly in Vercel Git settings.

## Next
Phase 04 wires OAuth using the `*.vercel.app` domain from step 4.
